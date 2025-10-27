import puppeteer from 'puppeteer';
import { PrismaClient } from '@prisma/client';
import { BrandingService } from './branding.service';
import { ScoringService } from './scoring.service';
import { AppError } from '../middleware/errorHandler';

interface PdfGenerationOptions {
  includeExecutiveSummary?: boolean;
  includeHighLevelScores?: boolean;
  includeRisks?: boolean;
  includeRecommendations?: boolean;
  includeSpofs?: boolean;
  includeDependencyGraph?: boolean;
}

export class PdfService {
  private brandingService: BrandingService;
  private scoringService: ScoringService;

  constructor(private prisma: PrismaClient) {
    this.brandingService = new BrandingService(prisma);
    this.scoringService = new ScoringService(prisma);
  }

  /**
   * Generate comprehensive PDF report for an assessment
   */
  async generateAssessmentReport(
    assessmentId: string,
    organizationId: string,
    options: PdfGenerationOptions = {}
  ): Promise<Buffer> {
    // Set defaults
    const opts = {
      includeExecutiveSummary: true,
      includeHighLevelScores: true,
      includeRisks: true,
      includeRecommendations: true,
      includeSpofs: true,
      includeDependencyGraph: false,
      ...options
    };

    // Fetch all data
    const assessment = await this.prisma.assessment.findFirst({
      where: { id: assessmentId, organizationId },
      include: {
        organization: {
          include: {
            brandingConfig: true
          }
        },
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!assessment) {
      throw new AppError(404, 'NOT_FOUND', 'Assessment not found');
    }

    // Get branding
    const branding = assessment.organization.brandingConfig || this.brandingService.getDefaultBranding();

    // Fetch components and systems
    const [sites, risks, recommendations, highLevelScore] = await Promise.all([
      this.prisma.site.findMany({
        where: { assessmentId },
        include: {
          systems: {
            include: {
              components: {
                include: {
                  dependenciesFrom: true,
                  dependenciesTo: true
                }
              }
            }
          }
        }
      }),
      opts.includeRisks
        ? this.prisma.risk.findMany({
            where: { assessmentId },
            include: {
              component: {
                select: {
                  name: true,
                  componentType: true,
                  system: { select: { name: true } }
                }
              }
            },
            orderBy: { severity: 'desc' }
          })
        : [],
      opts.includeRecommendations
        ? this.prisma.recommendation.findMany({
            where: { assessmentId },
            include: {
              component: {
                select: {
                  name: true,
                  componentType: true
                }
              }
            },
            orderBy: { priority: 'desc' }
          })
        : [],
      opts.includeHighLevelScores && assessment.type !== 'DEEP_DIVE'
        ? this.scoringService.calculateHighLevelScore(assessmentId).catch(() => null)
        : null
    ]);

    // Calculate statistics
    const totalComponents = sites.reduce(
      (sum, site) => sum + site.systems.reduce((sysSum, sys) => sysSum + sys.components.length, 0),
      0
    );
    const spofs = sites
      .flatMap((site) => site.systems)
      .flatMap((system) => system.components)
      .filter((c) => !c.isRedundant && c.dependenciesTo.length > 0);

    const stats = {
      totalSites: sites.length,
      totalSystems: sites.reduce((sum, site) => sum + site.systems.length, 0),
      totalComponents,
      totalSpofs: spofs.length,
      criticalSpofs: spofs.filter((c) => c.system?.businessCriticality === 'CRITICAL').length,
      totalRisks: risks.length,
      criticalRisks: risks.filter((r) => r.severity === 'CRITICAL').length,
      highRisks: risks.filter((r) => r.severity === 'HIGH').length,
      totalRecommendations: recommendations.length,
      criticalRecommendations: recommendations.filter((r) => r.priority === 'CRITICAL').length
    };

    // Generate HTML
    const html = this.generateHtml(assessment, branding, stats, sites, risks, recommendations, highLevelScore, opts);

    // Generate PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdf = await page.pdf({
        format: 'A4',
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        },
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: this.getHeaderTemplate(branding, assessment.organization.name),
        footerTemplate: this.getFooterTemplate(branding)
      });

      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  /**
   * Generate HTML content for PDF
   */
  private generateHtml(
    assessment: any,
    branding: any,
    stats: any,
    sites: any[],
    risks: any[],
    recommendations: any[],
    highLevelScore: any,
    opts: PdfGenerationOptions
  ): string {
    const primaryColor = branding.primaryColor || '#0066CC';
    const secondaryColor = branding.secondaryColor || '#333333';
    const accentColor = branding.accentColor || '#FF6600';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>DR Assessment Report - ${assessment.name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: ${branding.fontFamily || 'Arial, sans-serif'};
      font-size: 11pt;
      line-height: 1.6;
      color: ${secondaryColor};
    }
    .container { max-width: 100%; }
    h1 { color: ${primaryColor}; font-size: 28pt; margin-bottom: 10px; page-break-after: avoid; }
    h2 { color: ${primaryColor}; font-size: 20pt; margin-top: 30px; margin-bottom: 15px; page-break-after: avoid; border-bottom: 2px solid ${primaryColor}; padding-bottom: 5px; }
    h3 { color: ${secondaryColor}; font-size: 14pt; margin-top: 20px; margin-bottom: 10px; page-break-after: avoid; }
    h4 { color: ${secondaryColor}; font-size: 12pt; margin-top: 15px; margin-bottom: 8px; }
    p { margin-bottom: 10px; text-align: justify; }
    .page-break { page-break-before: always; }
    .no-break { page-break-inside: avoid; }

    /* Cover Page */
    .cover {
      text-align: center;
      padding-top: 100px;
      page-break-after: always;
    }
    .cover h1 { font-size: 36pt; margin-bottom: 20px; }
    .cover .subtitle { font-size: 18pt; color: ${secondaryColor}; margin-bottom: 40px; }
    .cover .meta { font-size: 12pt; color: #666; margin-top: 60px; }

    /* Executive Summary */
    .executive-summary {
      background: #f8f9fa;
      padding: 20px;
      border-left: 4px solid ${accentColor};
      margin: 20px 0;
      page-break-inside: avoid;
    }

    /* Score Card */
    .score-card {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      margin: 20px 0;
    }
    .score-item {
      flex: 1;
      min-width: 150px;
      background: white;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      padding: 15px;
      text-align: center;
      page-break-inside: avoid;
    }
    .score-value {
      font-size: 32pt;
      font-weight: bold;
      color: ${primaryColor};
    }
    .score-label {
      font-size: 10pt;
      color: #666;
      margin-top: 5px;
    }

    /* Statistics Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin: 20px 0;
    }
    .stat-box {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      padding: 12px;
      text-align: center;
      page-break-inside: avoid;
    }
    .stat-number {
      font-size: 24pt;
      font-weight: bold;
      color: ${primaryColor};
    }
    .stat-label {
      font-size: 9pt;
      color: #666;
      margin-top: 5px;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      page-break-inside: auto;
    }
    tr { page-break-inside: avoid; page-break-after: auto; }
    th {
      background: ${primaryColor};
      color: white;
      padding: 10px;
      text-align: left;
      font-weight: bold;
      font-size: 10pt;
    }
    td {
      padding: 8px 10px;
      border-bottom: 1px solid #e0e0e0;
      font-size: 9pt;
    }
    tr:hover { background: #f8f9fa; }

    /* Severity Badges */
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 8pt;
      font-weight: bold;
      text-transform: uppercase;
    }
    .badge-critical { background: #dc3545; color: white; }
    .badge-high { background: #fd7e14; color: white; }
    .badge-medium { background: #ffc107; color: black; }
    .badge-low { background: #28a745; color: white; }

    /* Lists */
    ul, ol { margin-left: 25px; margin-bottom: 15px; }
    li { margin-bottom: 5px; }

    /* Recommendation Cards */
    .recommendation {
      background: white;
      border: 1px solid #e0e0e0;
      border-left: 4px solid ${accentColor};
      border-radius: 6px;
      padding: 15px;
      margin: 15px 0;
      page-break-inside: avoid;
    }
    .recommendation h4 { margin-top: 0; color: ${primaryColor}; }
    .recommendation .meta {
      display: flex;
      gap: 15px;
      margin: 10px 0;
      font-size: 9pt;
      color: #666;
    }
    .action-items {
      margin-top: 10px;
      padding-left: 20px;
    }
    .action-items li {
      margin-bottom: 5px;
      font-size: 9pt;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Cover Page -->
    <div class="cover">
      ${branding.logoUrl ? `<img src="${branding.logoUrl}" alt="Logo" style="max-width: 200px; margin-bottom: 40px;" />` : ''}
      <h1>Disaster Recovery Assessment Report</h1>
      <div class="subtitle">${assessment.name}</div>
      <div class="meta">
        <div>Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
        <div>Prepared for: ${assessment.organization.name}</div>
        ${assessment.createdBy ? `<div>Conducted by: ${assessment.createdBy.firstName} ${assessment.createdBy.lastName}</div>` : ''}
      </div>
    </div>

    ${opts.includeExecutiveSummary ? this.generateExecutiveSummary(assessment, stats, highLevelScore) : ''}
    ${opts.includeHighLevelScores && highLevelScore ? this.generateHighLevelScoreSection(highLevelScore) : ''}
    ${this.generateInfrastructureOverview(sites, stats)}
    ${opts.includeSpofs && stats.totalSpofs > 0 ? this.generateSpofsSection(sites) : ''}
    ${opts.includeRisks && risks.length > 0 ? this.generateRisksSection(risks) : ''}
    ${opts.includeRecommendations && recommendations.length > 0 ? this.generateRecommendationsSection(recommendations) : ''}
    ${this.generateConclusion(stats)}
  </div>
</body>
</html>
    `;
  }

  private generateExecutiveSummary(assessment: any, stats: any, highLevelScore: any): string {
    const overallRating = highLevelScore?.overallScore
      ? highLevelScore.overallScore >= 80
        ? 'Good'
        : highLevelScore.overallScore >= 60
        ? 'Moderate'
        : 'Needs Improvement'
      : 'N/A';

    return `
    <div class="page-break"></div>
    <h2>Executive Summary</h2>
    <div class="executive-summary no-break">
      <p><strong>Assessment Type:</strong> ${assessment.type.replace(/_/g, ' ')}</p>
      <p><strong>Status:</strong> ${assessment.status}</p>
      ${highLevelScore ? `<p><strong>Overall DR Readiness Score:</strong> ${highLevelScore.overallScore.toFixed(1)}% (${overallRating})</p>` : ''}
      <p><strong>Date Completed:</strong> ${assessment.completedAt ? new Date(assessment.completedAt).toLocaleDateString() : 'In Progress'}</p>
    </div>

    <h3>Key Findings</h3>
    <div class="stats-grid">
      <div class="stat-box">
        <div class="stat-number">${stats.totalComponents}</div>
        <div class="stat-label">Total Components</div>
      </div>
      <div class="stat-box">
        <div class="stat-number ${stats.totalSpofs > 0 ? 'text-danger' : ''}">${stats.totalSpofs}</div>
        <div class="stat-label">Single Points of Failure</div>
      </div>
      <div class="stat-box">
        <div class="stat-number ${stats.criticalRisks > 0 ? 'text-danger' : ''}">${stats.criticalRisks}</div>
        <div class="stat-label">Critical Risks</div>
      </div>
      <div class="stat-box">
        <div class="stat-number">${stats.totalRecommendations}</div>
        <div class="stat-label">Recommendations</div>
      </div>
    </div>

    <p>This assessment evaluated ${stats.totalSites} site(s), ${stats.totalSystems} system(s), and ${stats.totalComponents} infrastructure component(s).
    ${stats.totalSpofs > 0 ? `The analysis identified <strong>${stats.totalSpofs} single point(s) of failure</strong>, including ${stats.criticalSpofs} affecting critical systems. ` : 'No single points of failure were identified. '}
    ${stats.totalRisks > 0 ? `A total of <strong>${stats.totalRisks} risk(s)</strong> were identified, with ${stats.criticalRisks} classified as critical severity. ` : ''}
    ${stats.totalRecommendations > 0 ? `<strong>${stats.totalRecommendations} actionable recommendation(s)</strong> have been generated to improve disaster recovery readiness.` : ''}</p>
    `;
  }

  private generateHighLevelScoreSection(highLevelScore: any): string {
    const categories = Object.entries(highLevelScore.categoryScores || {})
      .map(
        ([category, score]: [string, any]) => `
      <tr>
        <td>${category.replace(/_/g, ' ')}</td>
        <td><strong>${score.toFixed(1)}%</strong></td>
        <td>${score >= 80 ? 'Good' : score >= 60 ? 'Moderate' : 'Needs Improvement'}</td>
      </tr>
    `
      )
      .join('');

    return `
    <div class="page-break"></div>
    <h2>High-Level Assessment Scores</h2>
    <div class="score-card">
      <div class="score-item">
        <div class="score-value">${highLevelScore.overallScore.toFixed(1)}%</div>
        <div class="score-label">Overall DR Readiness</div>
      </div>
    </div>

    <h3>Category Breakdown</h3>
    <table>
      <thead>
        <tr>
          <th>Category</th>
          <th>Score</th>
          <th>Rating</th>
        </tr>
      </thead>
      <tbody>
        ${categories}
      </tbody>
    </table>
    `;
  }

  private generateInfrastructureOverview(sites: any[], stats: any): string {
    const sitesTable = sites
      .map(
        (site) => `
      <tr>
        <td>${site.name}</td>
        <td>${site.siteType.replace(/_/g, ' ')}</td>
        <td>${site.provider || 'N/A'}</td>
        <td>${site.region || 'N/A'}</td>
        <td>${site.systems.length}</td>
        <td>${site.systems.reduce((sum: number, sys: any) => sum + sys.components.length, 0)}</td>
      </tr>
    `
      )
      .join('');

    return `
    <div class="page-break"></div>
    <h2>Infrastructure Overview</h2>
    <p>This section provides an overview of the infrastructure topology including sites, systems, and components.</p>

    <div class="stats-grid">
      <div class="stat-box">
        <div class="stat-number">${stats.totalSites}</div>
        <div class="stat-label">Sites</div>
      </div>
      <div class="stat-box">
        <div class="stat-number">${stats.totalSystems}</div>
        <div class="stat-label">Systems</div>
      </div>
      <div class="stat-box">
        <div class="stat-number">${stats.totalComponents}</div>
        <div class="stat-label">Components</div>
      </div>
      <div class="stat-box">
        <div class="stat-number">${new Set(sites.map((s) => s.provider).filter(Boolean)).size}</div>
        <div class="stat-label">Providers</div>
      </div>
    </div>

    <h3>Sites Inventory</h3>
    <table>
      <thead>
        <tr>
          <th>Site Name</th>
          <th>Type</th>
          <th>Provider</th>
          <th>Region</th>
          <th>Systems</th>
          <th>Components</th>
        </tr>
      </thead>
      <tbody>
        ${sitesTable}
      </tbody>
    </table>
    `;
  }

  private generateSpofsSection(sites: any[]): string {
    const spofs = sites
      .flatMap((site) =>
        site.systems.flatMap((system: any) =>
          system.components
            .filter((c: any) => !c.isRedundant && c.dependenciesTo.length > 0)
            .map((c: any) => ({
              component: c,
              system,
              site
            }))
        )
      )
      .sort((a, b) => {
        const critOrder = { CRITICAL: 3, HIGH: 2, MEDIUM: 1, LOW: 0 };
        return (
          (critOrder[b.system.businessCriticality as keyof typeof critOrder] || 0) -
          (critOrder[a.system.businessCriticality as keyof typeof critOrder] || 0)
        );
      });

    const spofsTable = spofs
      .map(
        ({ component, system, site }) => `
      <tr>
        <td>${component.name}</td>
        <td>${component.componentType.replace(/_/g, ' ')}</td>
        <td>${system.name}</td>
        <td>${site.name}</td>
        <td><span class="badge badge-${system.businessCriticality.toLowerCase()}">${system.businessCriticality}</span></td>
        <td>${component.dependenciesTo.length}</td>
      </tr>
    `
      )
      .join('');

    return `
    <div class="page-break"></div>
    <h2>Single Points of Failure (SPOFs)</h2>
    <p>The following components have been identified as single points of failure. These components lack redundancy and have dependencies, meaning their failure would impact other parts of the infrastructure.</p>

    <table>
      <thead>
        <tr>
          <th>Component</th>
          <th>Type</th>
          <th>System</th>
          <th>Site</th>
          <th>Criticality</th>
          <th>Dependencies</th>
        </tr>
      </thead>
      <tbody>
        ${spofsTable}
      </tbody>
    </table>
    `;
  }

  private generateRisksSection(risks: any[]): string {
    const risksTable = risks
      .slice(0, 50)
      .map(
        (risk) => `
      <tr>
        <td><span class="badge badge-${risk.severity.toLowerCase()}">${risk.severity}</span></td>
        <td>${risk.riskType.replace(/_/g, ' ')}</td>
        <td>${risk.title}</td>
        <td>${risk.component ? risk.component.name : 'N/A'}</td>
        <td style="font-size: 8pt;">${risk.description.substring(0, 120)}${risk.description.length > 120 ? '...' : ''}</td>
      </tr>
    `
      )
      .join('');

    return `
    <div class="page-break"></div>
    <h2>Risk Assessment</h2>
    <p>This section identifies and categorizes risks across the infrastructure. Risks are classified by type and severity.</p>

    <table>
      <thead>
        <tr>
          <th>Severity</th>
          <th>Risk Type</th>
          <th>Title</th>
          <th>Component</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        ${risksTable}
      </tbody>
    </table>
    ${risks.length > 50 ? '<p><em>Note: Only the top 50 risks are shown in this report. View full details in the application.</em></p>' : ''}
    `;
  }

  private generateRecommendationsSection(recommendations: any[]): string {
    const recCards = recommendations
      .slice(0, 20)
      .map(
        (rec) => `
      <div class="recommendation">
        <h4>${rec.title}</h4>
        <div class="meta">
          <div><strong>Priority:</strong> <span class="badge badge-${rec.priority.toLowerCase()}">${rec.priority}</span></div>
          <div><strong>Category:</strong> ${rec.category}</div>
          <div><strong>Effort:</strong> ${rec.effort}</div>
        </div>
        <p>${rec.description}</p>
        ${
          rec.actionItems && rec.actionItems.length > 0
            ? `
          <h4 style="font-size: 10pt; margin-top: 10px;">Action Items:</h4>
          <ol class="action-items">
            ${rec.actionItems.map((item: string) => `<li>${item}</li>`).join('')}
          </ol>
        `
            : ''
        }
      </div>
    `
      )
      .join('');

    return `
    <div class="page-break"></div>
    <h2>Recommendations</h2>
    <p>Based on the analysis, the following recommendations have been generated to improve disaster recovery readiness and resilience.</p>

    ${recCards}
    ${recommendations.length > 20 ? '<p><em>Note: Only the top 20 recommendations are shown. View full details in the application.</em></p>' : ''}
    `;
  }

  private generateConclusion(stats: any): string {
    return `
    <div class="page-break"></div>
    <h2>Conclusion</h2>
    <p>This disaster recovery assessment provides a comprehensive evaluation of your infrastructure's resilience and readiness.</p>

    ${
      stats.totalSpofs > 0 || stats.criticalRisks > 0
        ? `
      <p><strong>Priority Actions:</strong></p>
      <ul>
        ${stats.criticalSpofs > 0 ? `<li>Address ${stats.criticalSpofs} critical single point(s) of failure immediately</li>` : ''}
        ${stats.criticalRisks > 0 ? `<li>Mitigate ${stats.criticalRisks} critical risk(s) as soon as possible</li>` : ''}
        ${stats.totalRecommendations > 0 ? `<li>Review and prioritize ${stats.totalRecommendations} recommendation(s) for implementation</li>` : ''}
      </ul>
    `
        : '<p>Your infrastructure demonstrates strong disaster recovery readiness with no critical issues identified.</p>'
    }

    <p>Regular reassessment is recommended to maintain and improve disaster recovery capabilities as your infrastructure evolves.</p>
    `;
  }

  private getHeaderTemplate(branding: any, orgName: string): string {
    return `
      <div style="font-size: 8pt; color: #666; padding: 0 15mm; display: flex; justify-content: space-between; width: 100%;">
        <span>${orgName} - DR Assessment Report</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>
    `;
  }

  private getFooterTemplate(branding: any): string {
    const footer = branding.pdfFooter || 'Confidential - Disaster Recovery Assessment Report';
    return `
      <div style="font-size: 8pt; color: #666; text-align: center; padding: 0 15mm; width: 100%;">
        ${footer}
      </div>
    `;
  }
}
