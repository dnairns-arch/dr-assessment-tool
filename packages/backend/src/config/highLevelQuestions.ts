export interface HighLevelQuestion {
  id: string;
  category: string;
  text: string;
  weight: number;
  helpText?: string;
}

// Total weights must sum to 1.0
export const HIGH_LEVEL_QUESTIONS: HighLevelQuestion[] = [
  // Business Continuity Planning (15% total)
  {
    id: 'bcp_001',
    category: 'Business Continuity Planning',
    text: 'Does your organization have a documented Business Continuity Plan (BCP)?',
    weight: 0.03,
    helpText:
      'A BCP outlines procedures and instructions for maintaining or recovering operations during a disaster.'
  },
  {
    id: 'bcp_002',
    category: 'Business Continuity Planning',
    text: 'Is the BCP reviewed and updated at least annually?',
    weight: 0.025,
    helpText: 'Regular reviews ensure the plan remains relevant as your organization evolves.'
  },
  {
    id: 'bcp_003',
    category: 'Business Continuity Planning',
    text: 'Have key stakeholders and their roles been identified in the BCP?',
    weight: 0.025,
    helpText: 'Clear role definition ensures everyone knows their responsibilities during an incident.'
  },
  {
    id: 'bcp_004',
    category: 'Business Continuity Planning',
    text: 'Are communication plans established for stakeholders during incidents?',
    weight: 0.02,
    helpText: 'Effective communication is critical for coordinating response efforts.'
  },
  {
    id: 'bcp_005',
    category: 'Business Continuity Planning',
    text: 'Are crisis management procedures documented and accessible?',
    weight: 0.025,
    helpText: 'Documented procedures enable quick, informed decision-making under pressure.'
  },
  {
    id: 'bcp_006',
    category: 'Business Continuity Planning',
    text: 'Have you conducted a Business Impact Analysis (BIA)?',
    weight: 0.025,
    helpText: 'A BIA identifies critical functions and the impact of their disruption.'
  },

  // Backup & Recovery (20% total)
  {
    id: 'backup_001',
    category: 'Backup & Recovery',
    text: 'Are all critical systems backed up at least daily?',
    weight: 0.04,
    helpText: 'Daily backups minimize data loss in the event of a failure.'
  },
  {
    id: 'backup_002',
    category: 'Backup & Recovery',
    text: 'Are backups stored in a geographically separate location?',
    weight: 0.035,
    helpText: 'Geographic separation protects against regional disasters.'
  },
  {
    id: 'backup_003',
    category: 'Backup & Recovery',
    text: 'Are backup restoration procedures tested at least quarterly?',
    weight: 0.04,
    helpText: 'Regular testing validates that backups can be successfully restored when needed.'
  },
  {
    id: 'backup_004',
    category: 'Backup & Recovery',
    text: 'Are backups encrypted both at rest and in transit?',
    weight: 0.03,
    helpText: 'Encryption protects sensitive data from unauthorized access.'
  },
  {
    id: 'backup_005',
    category: 'Backup & Recovery',
    text: 'Is backup retention aligned with compliance and business requirements?',
    weight: 0.025,
    helpText: 'Proper retention ensures availability for recovery and regulatory compliance.'
  },
  {
    id: 'backup_006',
    category: 'Backup & Recovery',
    text: 'Are immutable backups implemented to prevent tampering?',
    weight: 0.03,
    helpText: 'Immutable backups protect against ransomware and accidental deletion.'
  },

  // Infrastructure Redundancy (18% total)
  {
    id: 'infra_001',
    category: 'Infrastructure Redundancy',
    text: 'Have all single points of failure been identified?',
    weight: 0.04,
    helpText: 'Identifying SPOFs is the first step toward eliminating them.'
  },
  {
    id: 'infra_002',
    category: 'Infrastructure Redundancy',
    text: 'Are critical systems deployed across multiple availability zones?',
    weight: 0.04,
    helpText: 'Multi-AZ deployment protects against zone-level failures.'
  },
  {
    id: 'infra_003',
    category: 'Infrastructure Redundancy',
    text: 'Are critical systems deployed across multiple geographic regions?',
    weight: 0.035,
    helpText: 'Multi-region deployment provides the highest level of geographic resilience.'
  },
  {
    id: 'infra_004',
    category: 'Infrastructure Redundancy',
    text: 'Is there redundancy in network connectivity?',
    weight: 0.03,
    helpText: 'Multiple network paths prevent connectivity single points of failure.'
  },
  {
    id: 'infra_005',
    category: 'Infrastructure Redundancy',
    text: 'Is there redundancy in power supply for on-premise infrastructure?',
    weight: 0.025,
    helpText: 'Backup power (UPS, generators) prevents outages from power failures.'
  },
  {
    id: 'infra_006',
    category: 'Infrastructure Redundancy',
    text: 'Are load balancers deployed with failover capabilities?',
    weight: 0.02,
    helpText: 'Redundant load balancers ensure traffic can be routed even if one fails.'
  },

  // Data Replication (12% total)
  {
    id: 'data_001',
    category: 'Data Replication',
    text: 'Is database replication configured for critical data stores?',
    weight: 0.03,
    helpText: 'Replication provides real-time or near-real-time data redundancy.'
  },
  {
    id: 'data_002',
    category: 'Data Replication',
    text: 'Are RPO (Recovery Point Objective) targets defined and met?',
    weight: 0.03,
    helpText: 'RPO defines the maximum acceptable data loss in a disaster scenario.'
  },
  {
    id: 'data_003',
    category: 'Data Replication',
    text: 'Are RTO (Recovery Time Objective) targets defined and met?',
    weight: 0.03,
    helpText: 'RTO defines the maximum acceptable downtime for recovery.'
  },
  {
    id: 'data_004',
    category: 'Data Replication',
    text: 'Is cross-region data replication implemented for critical databases?',
    weight: 0.015,
    helpText: 'Cross-region replication protects against regional outages.'
  },
  {
    id: 'data_005',
    category: 'Data Replication',
    text: 'Are data consistency checks performed regularly on replicas?',
    weight: 0.015,
    helpText: 'Consistency validation ensures replicas are accurate and usable.'
  },

  // Monitoring & Alerting (10% total)
  {
    id: 'monitor_001',
    category: 'Monitoring & Alerting',
    text: 'Are all critical systems monitored 24/7?',
    weight: 0.03,
    helpText: 'Continuous monitoring enables rapid detection and response to issues.'
  },
  {
    id: 'monitor_002',
    category: 'Monitoring & Alerting',
    text: 'Are alert escalation procedures documented and tested?',
    weight: 0.02,
    helpText: 'Escalation ensures the right people are notified when issues occur.'
  },
  {
    id: 'monitor_003',
    category: 'Monitoring & Alerting',
    text: 'Are runbooks available for common incidents and failure scenarios?',
    weight: 0.025,
    helpText: 'Runbooks provide step-by-step recovery procedures for known issues.'
  },
  {
    id: 'monitor_004',
    category: 'Monitoring & Alerting',
    text: 'Is automated remediation implemented where possible?',
    weight: 0.015,
    helpText: 'Automation reduces response time and human error during incidents.'
  },
  {
    id: 'monitor_005',
    category: 'Monitoring & Alerting',
    text: 'Are synthetic monitoring and health checks configured for critical services?',
    weight: 0.01,
    helpText: 'Synthetic tests proactively validate system availability and functionality.'
  },

  // Testing & Validation (15% total)
  {
    id: 'test_001',
    category: 'Testing & Validation',
    text: 'Are DR drills conducted at least annually for critical systems?',
    weight: 0.04,
    helpText: 'Regular drills validate DR procedures and identify gaps.'
  },
  {
    id: 'test_002',
    category: 'Testing & Validation',
    text: 'Are failover procedures tested regularly?',
    weight: 0.035,
    helpText: 'Testing ensures failover mechanisms work as expected when needed.'
  },
  {
    id: 'test_003',
    category: 'Testing & Validation',
    text: 'Are recovery procedures validated for all critical systems?',
    weight: 0.035,
    helpText: 'Validation confirms you can actually recover from documented procedures.'
  },
  {
    id: 'test_004',
    category: 'Testing & Validation',
    text: 'Are post-mortem analyses conducted after incidents and DR tests?',
    weight: 0.02,
    helpText: 'Post-mortems identify improvement opportunities and lessons learned.'
  },
  {
    id: 'test_005',
    category: 'Testing & Validation',
    text: 'Are lessons learned from incidents incorporated into DR plans?',
    weight: 0.02,
    helpText: 'Continuous improvement ensures DR capabilities evolve with experience.'
  },

  // Security & Compliance (5% total)
  {
    id: 'security_001',
    category: 'Security & Compliance',
    text: 'Are access controls tested and validated during DR scenarios?',
    weight: 0.015,
    helpText: 'Security must be maintained even in recovery scenarios.'
  },
  {
    id: 'security_002',
    category: 'Security & Compliance',
    text: 'Are compliance requirements (SOC 2, HIPAA, etc.) considered in DR planning?',
    weight: 0.02,
    helpText: 'DR plans must align with regulatory and compliance obligations.'
  },
  {
    id: 'security_003',
    category: 'Security & Compliance',
    text: 'Are audit logs maintained for all DR activities and tests?',
    weight: 0.01,
    helpText: 'Audit trails provide evidence of DR testing and compliance.'
  },
  {
    id: 'security_004',
    category: 'Security & Compliance',
    text: 'Is incident response integrated with DR procedures?',
    weight: 0.005,
    helpText: 'Integration ensures coordinated response to security and operational incidents.'
  },

  // Documentation & Training (5% total)
  {
    id: 'doc_001',
    category: 'Documentation & Training',
    text: 'Are architecture diagrams up to date and accessible?',
    weight: 0.015,
    helpText: 'Current diagrams are essential for understanding system dependencies.'
  },
  {
    id: 'doc_002',
    category: 'Documentation & Training',
    text: 'Are DR procedures documented and easily accessible to the team?',
    weight: 0.015,
    helpText: 'Documentation must be available when needed, including offline access.'
  },
  {
    id: 'doc_003',
    category: 'Documentation & Training',
    text: 'Is the team trained on DR procedures and responsibilities?',
    weight: 0.01,
    helpText: 'Training ensures team members can execute their roles during an incident.'
  },
  {
    id: 'doc_004',
    category: 'Documentation & Training',
    text: 'Are knowledge transfer sessions conducted regularly?',
    weight: 0.01,
    helpText: 'Regular knowledge sharing prevents key-person dependencies.'
  }
];

// Validate total weight sums to 1.0
const totalWeight = HIGH_LEVEL_QUESTIONS.reduce((sum, q) => sum + q.weight, 0);
if (Math.abs(totalWeight - 1.0) > 0.001) {
  console.warn(
    `⚠️  High-level questions total weight is ${totalWeight.toFixed(3)}, expected 1.000`
  );
}

// Group questions by category
export const QUESTIONS_BY_CATEGORY = HIGH_LEVEL_QUESTIONS.reduce(
  (acc, question) => {
    if (!acc[question.category]) {
      acc[question.category] = [];
    }
    acc[question.category].push(question);
    return acc;
  },
  {} as Record<string, HighLevelQuestion[]>
);

// Get category weights
export const CATEGORY_WEIGHTS = Object.entries(QUESTIONS_BY_CATEGORY).reduce(
  (acc, [category, questions]) => {
    acc[category] = questions.reduce((sum, q) => sum + q.weight, 0);
    return acc;
  },
  {} as Record<string, number>
);
