import { PrismaClient, ComponentType, Criticality, DependencyType, RiskType, Severity, Priority } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

interface AnalysisResult {
  risks: any[];
  spofs: any[];
  recommendations: any[];
  summary: {
    totalRisks: number;
    criticalRisks: number;
    highRisks: number;
    totalSpofs: number;
    criticalSpofs: number;
    totalRecommendations: number;
  };
}

interface ComponentWithDependencies {
  id: string;
  name: string;
  componentType: ComponentType;
  isRedundant: boolean;
  redundancyLevel: number | null;
  hasHealthCheck: boolean;
  system: {
    id: string;
    name: string;
    businessCriticality: Criticality;
    rpoMinutes: number | null;
    rtoMinutes: number | null;
    site: {
      id: string;
      name: string;
      provider: string | null;
      region: string | null;
    };
  };
  dependenciesFrom: Array<{
    id: string;
    targetId: string;
    dependencyType: DependencyType;
    isRequired: boolean;
    target: {
      id: string;
      name: string;
      componentType: ComponentType;
      isRedundant: boolean;
    };
  }>;
  dependenciesTo: Array<{
    id: string;
    sourceId: string;
    dependencyType: DependencyType;
    isRequired: boolean;
    source: {
      id: string;
      name: string;
      componentType: ComponentType;
    };
  }>;
}

export class AnalysisService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Perform comprehensive DR analysis on an assessment
   */
  async analyzeAssessment(assessmentId: string, organizationId: string): Promise<AnalysisResult> {
    // Verify assessment ownership
    const assessment = await this.prisma.assessment.findFirst({
      where: { id: assessmentId, organizationId }
    });

    if (!assessment) {
      throw new AppError(404, 'NOT_FOUND', 'Assessment not found');
    }

    // Get all components with dependencies for this assessment
    const components = await this.getComponentsWithDependencies(assessmentId);

    // Run analysis
    const spofs = this.detectSPOFs(components);
    const risks = await this.identifyRisks(assessmentId, components, spofs);
    const recommendations = this.generateRecommendations(components, spofs, risks);

    // Save results to database
    await this.saveAnalysisResults(assessmentId, risks, recommendations);

    // Calculate summary
    const summary = {
      totalRisks: risks.length,
      criticalRisks: risks.filter((r: any) => r.severity === 'CRITICAL').length,
      highRisks: risks.filter((r: any) => r.severity === 'HIGH').length,
      totalSpofs: spofs.length,
      criticalSpofs: spofs.filter((s: any) => s.criticality === 'CRITICAL').length,
      totalRecommendations: recommendations.length
    };

    return { risks, spofs, recommendations, summary };
  }

  /**
   * Get all components with full dependency graph
   */
  private async getComponentsWithDependencies(assessmentId: string): Promise<ComponentWithDependencies[]> {
    return await this.prisma.component.findMany({
      where: {
        system: {
          site: {
            assessmentId
          }
        }
      },
      include: {
        system: {
          include: {
            site: {
              select: {
                id: true,
                name: true,
                provider: true,
                region: true
              }
            }
          }
        },
        dependenciesFrom: {
          include: {
            target: {
              select: {
                id: true,
                name: true,
                componentType: true,
                isRedundant: true
              }
            }
          }
        },
        dependenciesTo: {
          include: {
            source: {
              select: {
                id: true,
                name: true,
                componentType: true
              }
            }
          }
        }
      }
    }) as ComponentWithDependencies[];
  }

  /**
   * Detect Single Points of Failure (SPOFs)
   */
  private detectSPOFs(components: ComponentWithDependencies[]) {
    const spofs = [];

    for (const component of components) {
      // Component is a SPOF if it's not redundant and has dependencies
      if (!component.isRedundant && component.dependenciesTo.length > 0) {
        const criticality = component.system.businessCriticality;
        const dependentComponents = component.dependenciesTo.length;

        spofs.push({
          componentId: component.id,
          componentName: component.name,
          componentType: component.componentType,
          systemName: component.system.name,
          siteName: component.system.site.name,
          criticality,
          dependentComponents,
          impactDescription: this.generateSpofImpact(component),
          recommendation: this.generateSpofRecommendation(component)
        });
      }
    }

    // Sort by criticality and dependent components
    return spofs.sort((a, b) => {
      const criticalityOrder = { CRITICAL: 3, HIGH: 2, MEDIUM: 1, LOW: 0 };
      const aCrit = criticalityOrder[a.criticality as keyof typeof criticalityOrder] || 0;
      const bCrit = criticalityOrder[b.criticality as keyof typeof criticalityOrder] || 0;

      if (aCrit !== bCrit) return bCrit - aCrit;
      return b.dependentComponents - a.dependentComponents;
    });
  }

  /**
   * Identify all risks across multiple categories
   */
  private async identifyRisks(
    assessmentId: string,
    components: ComponentWithDependencies[],
    spofs: any[]
  ) {
    const risks = [];

    // 1. SPOF Risks
    for (const spof of spofs) {
      risks.push({
        assessmentId,
        componentId: spof.componentId,
        riskType: 'SPOF' as RiskType,
        severity: this.mapCriticalityToSeverity(spof.criticality),
        title: `Single Point of Failure: ${spof.componentName}`,
        description: spof.impactDescription,
        likelihood: 'MEDIUM',
        impact: this.mapCriticalityToSeverity(spof.criticality),
        affectedSystems: [spof.systemName],
        mitigation: spof.recommendation
      });
    }

    // 2. Availability Risks - No health checks
    for (const component of components) {
      if (!component.hasHealthCheck && component.system.businessCriticality !== 'LOW') {
        risks.push({
          assessmentId,
          componentId: component.id,
          riskType: 'AVAILABILITY' as RiskType,
          severity: 'MEDIUM' as Severity,
          title: `No Health Check: ${component.name}`,
          description: `Component ${component.name} does not have health monitoring configured, making it difficult to detect failures proactively.`,
          likelihood: 'HIGH',
          impact: 'MEDIUM',
          affectedSystems: [component.system.name],
          mitigation: 'Implement health check endpoints and monitoring for this component'
        });
      }
    }

    // 3. Data Loss Risks - Database without backup strategy
    for (const component of components) {
      if (
        component.componentType === 'DATABASE' &&
        (!component.system.rpoMinutes || component.system.rpoMinutes > 1440)
      ) {
        risks.push({
          assessmentId,
          componentId: component.id,
          riskType: 'DATA_LOSS' as RiskType,
          severity: component.system.businessCriticality === 'CRITICAL' ? 'CRITICAL' as Severity : 'HIGH' as Severity,
          title: `Insufficient Backup Strategy: ${component.name}`,
          description: `Database component has no defined RPO or RPO exceeds 24 hours, risking significant data loss.`,
          likelihood: 'MEDIUM',
          impact: component.system.businessCriticality === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
          affectedSystems: [component.system.name],
          mitigation: 'Define and implement an appropriate RPO target with automated backups'
        });
      }
    }

    // 4. Recovery Risks - Long RTO
    for (const component of components) {
      if (
        component.system.rtoMinutes &&
        component.system.rtoMinutes > 240 &&
        component.system.businessCriticality !== 'LOW'
      ) {
        risks.push({
          assessmentId,
          componentId: component.id,
          riskType: 'RECOVERY' as RiskType,
          severity: component.system.businessCriticality === 'CRITICAL' ? 'HIGH' as Severity : 'MEDIUM' as Severity,
          title: `Long Recovery Time: ${component.system.name}`,
          description: `System has RTO of ${component.system.rtoMinutes} minutes (${(component.system.rtoMinutes / 60).toFixed(1)} hours), which may be too long for business requirements.`,
          likelihood: 'MEDIUM',
          impact: component.system.businessCriticality === 'CRITICAL' ? 'HIGH' : 'MEDIUM',
          affectedSystems: [component.system.name],
          mitigation: 'Implement faster recovery procedures or reduce RTO target through automation and redundancy'
        });
      }
    }

    // 5. Dependency Risks - Synchronous critical dependencies
    for (const component of components) {
      const criticalSyncDeps = component.dependenciesFrom.filter(
        (dep) => dep.dependencyType === 'SYNC' && dep.isRequired && !dep.target.isRedundant
      );

      if (criticalSyncDeps.length > 0) {
        risks.push({
          assessmentId,
          componentId: component.id,
          riskType: 'DEPENDENCY' as RiskType,
          severity: 'MEDIUM' as Severity,
          title: `Critical Synchronous Dependency: ${component.name}`,
          description: `Component has ${criticalSyncDeps.length} synchronous dependencies on non-redundant components, creating potential cascade failures.`,
          likelihood: 'MEDIUM',
          impact: 'MEDIUM',
          affectedSystems: [component.system.name],
          mitigation: 'Consider async patterns, circuit breakers, or make dependencies redundant'
        });
      }
    }

    // 6. Provider Concentration Risk
    const sitesByProvider = this.groupSitesByProvider(components);
    for (const [provider, sites] of Object.entries(sitesByProvider)) {
      if (provider && sites.length > 1) {
        const criticalComponents = components.filter(
          (c) => c.system.site.provider === provider && c.system.businessCriticality === 'CRITICAL'
        );

        if (criticalComponents.length > 0) {
          risks.push({
            assessmentId,
            componentId: criticalComponents[0].id,
            riskType: 'AVAILABILITY' as RiskType,
            severity: 'HIGH' as Severity,
            title: `Provider Concentration Risk: ${provider}`,
            description: `${criticalComponents.length} critical components are hosted on a single provider (${provider}), creating risk of provider-wide outage.`,
            likelihood: 'LOW',
            impact: 'CRITICAL',
            affectedSystems: [...new Set(criticalComponents.map((c) => c.system.name))],
            mitigation: 'Consider multi-cloud strategy to distribute risk across providers'
          });
        }
      }
    }

    // 7. Region Concentration Risk
    const componentsByRegion = this.groupComponentsByRegion(components);
    for (const [region, comps] of Object.entries(componentsByRegion)) {
      if (region && comps.length > 3) {
        const critical = comps.filter((c) => c.system.businessCriticality === 'CRITICAL');
        if (critical.length > 0) {
          risks.push({
            assessmentId,
            componentId: critical[0].id,
            riskType: 'AVAILABILITY' as RiskType,
            severity: 'MEDIUM' as Severity,
            title: `Region Concentration: ${region}`,
            description: `${comps.length} components in single region ${region}, vulnerable to regional outages.`,
            likelihood: 'LOW',
            impact: 'HIGH',
            affectedSystems: [...new Set(comps.map((c) => c.system.name))],
            mitigation: 'Distribute components across multiple regions for geographic redundancy'
          });
        }
      }
    }

    return risks;
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(components: ComponentWithDependencies[], spofs: any[], risks: any[]) {
    const recommendations = [];

    // 1. Recommendations for SPOFs
    for (const spof of spofs) {
      const component = components.find((c) => c.id === spof.componentId);
      if (!component) continue;

      recommendations.push({
        title: `Implement Redundancy for ${spof.componentName}`,
        description: `This ${component.componentType} component is a single point of failure affecting ${spof.dependentComponents} dependent components.`,
        priority: spof.criticality === 'CRITICAL' ? 'CRITICAL' as Priority : 'HIGH' as Priority,
        category: 'REDUNDANCY',
        effort: this.estimateEffort(component.componentType),
        impact: 'Adding redundancy will eliminate this SPOF and significantly improve availability.',
        actionItems: this.generateRedundancyActions(component),
        affectedComponentId: component.id
      });
    }

    // 2. Backup and Recovery Recommendations
    const databasesWithoutBackup = components.filter(
      (c) => c.componentType === 'DATABASE' && !c.system.rpoMinutes
    );

    if (databasesWithoutBackup.length > 0) {
      recommendations.push({
        title: 'Implement Backup Strategy for Databases',
        description: `${databasesWithoutBackup.length} database component(s) lack defined backup and recovery procedures.`,
        priority: 'HIGH' as Priority,
        category: 'BACKUP',
        effort: 'MEDIUM',
        impact: 'Protects against data loss and enables point-in-time recovery.',
        actionItems: [
          'Define RPO and RTO targets based on business requirements',
          'Implement automated backup solution (snapshots, continuous backup)',
          'Test restore procedures regularly',
          'Store backups in different region/zone',
          'Document backup and recovery runbooks'
        ],
        affectedComponentId: databasesWithoutBackup[0].id
      });
    }

    // 3. Monitoring Recommendations
    const componentsWithoutHealthCheck = components.filter(
      (c) => !c.hasHealthCheck && c.system.businessCriticality !== 'LOW'
    );

    if (componentsWithoutHealthCheck.length > 0) {
      recommendations.push({
        title: 'Implement Health Checks and Monitoring',
        description: `${componentsWithoutHealthCheck.length} component(s) lack health check monitoring.`,
        priority: 'MEDIUM' as Priority,
        category: 'MONITORING',
        effort: 'LOW',
        impact: 'Enables proactive detection and automated recovery of failures.',
        actionItems: [
          'Implement health check endpoints for all services',
          'Configure automated health monitoring',
          'Set up alerting for health check failures',
          'Integrate with load balancers for automatic traffic routing',
          'Configure auto-restart or auto-scaling based on health'
        ],
        affectedComponentId: componentsWithoutHealthCheck[0].id
      });
    }

    // 4. Multi-Cloud Recommendation
    const providers = new Set(components.map((c) => c.system.site.provider).filter(Boolean));
    if (providers.size === 1 && components.length > 5) {
      recommendations.push({
        title: 'Consider Multi-Cloud Strategy',
        description: 'All infrastructure is hosted on a single cloud provider, creating provider-level risk.',
        priority: 'MEDIUM' as Priority,
        category: 'ARCHITECTURE',
        effort: 'HIGH',
        impact: 'Eliminates single provider dependency and improves overall resilience.',
        actionItems: [
          'Evaluate critical systems for multi-cloud deployment',
          'Design provider-agnostic architecture where possible',
          'Implement failover to secondary provider',
          'Use managed services that support multi-cloud',
          'Test cross-provider failover procedures'
        ],
        affectedComponentId: null
      });
    }

    // 5. Async Pattern Recommendation
    const syncDependencies = components.reduce(
      (acc, c) => acc + c.dependenciesFrom.filter((d) => d.dependencyType === 'SYNC').length,
      0
    );
    const asyncDependencies = components.reduce(
      (acc, c) => acc + c.dependenciesFrom.filter((d) => d.dependencyType === 'ASYNC').length,
      0
    );

    if (syncDependencies > asyncDependencies * 2 && syncDependencies > 5) {
      recommendations.push({
        title: 'Adopt Asynchronous Communication Patterns',
        description: 'High ratio of synchronous dependencies increases coupling and failure propagation risk.',
        priority: 'LOW' as Priority,
        category: 'ARCHITECTURE',
        effort: 'HIGH',
        impact: 'Reduces coupling and improves resilience to dependency failures.',
        actionItems: [
          'Identify candidates for async processing (non-critical paths)',
          'Implement message queues for async communication',
          'Add circuit breakers for synchronous calls',
          'Implement retry logic with exponential backoff',
          'Consider event-driven architecture patterns'
        ],
        affectedComponentId: null
      });
    }

    // Sort by priority
    const priorityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    return recommendations.sort((a, b) => {
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
      return bPriority - aPriority;
    });
  }

  /**
   * Save analysis results to database
   */
  private async saveAnalysisResults(assessmentId: string, risks: any[], recommendations: any[]) {
    // Delete existing risks and recommendations
    await this.prisma.risk.deleteMany({ where: { assessmentId } });
    await this.prisma.recommendation.deleteMany({ where: { assessmentId } });

    // Create new risks
    if (risks.length > 0) {
      await this.prisma.risk.createMany({
        data: risks.map((risk) => ({
          assessmentId: risk.assessmentId,
          componentId: risk.componentId,
          riskType: risk.riskType,
          severity: risk.severity,
          title: risk.title,
          description: risk.description,
          likelihood: risk.likelihood,
          impact: risk.impact,
          affectedSystems: risk.affectedSystems,
          mitigation: risk.mitigation
        }))
      });
    }

    // Create new recommendations
    if (recommendations.length > 0) {
      await this.prisma.recommendation.createMany({
        data: recommendations.map((rec) => ({
          assessmentId,
          componentId: rec.affectedComponentId,
          title: rec.title,
          description: rec.description,
          priority: rec.priority,
          category: rec.category,
          effort: rec.effort,
          impact: rec.impact,
          actionItems: rec.actionItems
        }))
      });
    }
  }

  // Helper methods

  private generateSpofImpact(component: ComponentWithDependencies): string {
    const dependentCount = component.dependenciesTo.length;
    const criticalityText = component.system.businessCriticality.toLowerCase();
    return `Failure of this ${component.componentType} would impact ${dependentCount} dependent component(s). System criticality: ${criticalityText}. No redundancy configured.`;
  }

  private generateSpofRecommendation(component: ComponentWithDependencies): string {
    switch (component.componentType) {
      case 'DATABASE':
        return 'Implement primary-replica setup with automatic failover, or use managed database service with built-in HA.';
      case 'LOAD_BALANCER':
        return 'Deploy multiple load balancers across availability zones with DNS failover or anycast routing.';
      case 'COMPUTE':
        return 'Deploy multiple instances behind a load balancer with auto-scaling and health checks.';
      case 'CACHE':
        return 'Configure cache cluster with replication across multiple nodes.';
      case 'MESSAGE_QUEUE':
        return 'Set up message queue cluster with redundant nodes and persistent storage.';
      default:
        return `Implement N+1 redundancy for this ${component.componentType} component.`;
    }
  }

  private generateRedundancyActions(component: ComponentWithDependencies): string[] {
    const baseActions = [
      'Evaluate current component configuration and constraints',
      'Design redundancy architecture (active-active or active-passive)',
      'Implement health checks and monitoring',
      'Test failover procedures'
    ];

    switch (component.componentType) {
      case 'DATABASE':
        return [
          ...baseActions,
          'Set up replication to secondary instance',
          'Configure automatic failover mechanism',
          'Test backup and restore procedures'
        ];
      case 'COMPUTE':
        return [
          ...baseActions,
          'Deploy additional instances in different AZs',
          'Configure load balancer for traffic distribution',
          'Implement auto-scaling policies'
        ];
      default:
        return [
          ...baseActions,
          'Deploy redundant instances across availability zones',
          'Implement appropriate failover mechanism'
        ];
    }
  }

  private estimateEffort(componentType: ComponentType): string {
    const highEffort: ComponentType[] = ['DATABASE', 'NETWORK'];
    const mediumEffort: ComponentType[] = ['COMPUTE', 'STORAGE', 'MESSAGE_QUEUE'];

    if (highEffort.includes(componentType)) return 'HIGH';
    if (mediumEffort.includes(componentType)) return 'MEDIUM';
    return 'LOW';
  }

  private mapCriticalityToSeverity(criticality: Criticality): Severity {
    const mapping: Record<Criticality, Severity> = {
      CRITICAL: 'CRITICAL',
      HIGH: 'HIGH',
      MEDIUM: 'MEDIUM',
      LOW: 'LOW'
    };
    return mapping[criticality] || 'MEDIUM';
  }

  private groupSitesByProvider(components: ComponentWithDependencies[]) {
    const grouped: Record<string, Set<string>> = {};
    for (const component of components) {
      const provider = component.system.site.provider;
      if (provider) {
        if (!grouped[provider]) grouped[provider] = new Set();
        grouped[provider].add(component.system.site.id);
      }
    }
    return Object.fromEntries(Object.entries(grouped).map(([k, v]) => [k, Array.from(v)]));
  }

  private groupComponentsByRegion(components: ComponentWithDependencies[]) {
    const grouped: Record<string, ComponentWithDependencies[]> = {};
    for (const component of components) {
      const region = component.system.site.region;
      if (region) {
        if (!grouped[region]) grouped[region] = [];
        grouped[region].push(component);
      }
    }
    return grouped;
  }
}
