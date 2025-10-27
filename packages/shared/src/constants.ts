// Assessment Categories with Weights
export const ASSESSMENT_CATEGORIES = {
  BUSINESS_CONTINUITY: {
    name: 'Business Continuity Planning',
    weight: 0.15
  },
  BACKUP_RECOVERY: {
    name: 'Backup & Recovery',
    weight: 0.2
  },
  INFRASTRUCTURE_REDUNDANCY: {
    name: 'Infrastructure Redundancy',
    weight: 0.18
  },
  DATA_REPLICATION: {
    name: 'Data Replication',
    weight: 0.12
  },
  MONITORING_ALERTING: {
    name: 'Monitoring & Alerting',
    weight: 0.1
  },
  TESTING_VALIDATION: {
    name: 'Testing & Validation',
    weight: 0.15
  },
  SECURITY_COMPLIANCE: {
    name: 'Security & Compliance',
    weight: 0.05
  },
  DOCUMENTATION_TRAINING: {
    name: 'Documentation & Training',
    weight: 0.05
  }
} as const;

// Score Ranges
export const SCORE_RANGES = {
  EXCELLENT: { min: 90, max: 100, label: 'Excellent', color: '#28a745' },
  GOOD: { min: 75, max: 89, label: 'Good', color: '#5cb85c' },
  FAIR: { min: 60, max: 74, label: 'Fair', color: '#ffc107' },
  NEEDS_IMPROVEMENT: { min: 40, max: 59, label: 'Needs Improvement', color: '#fd7e14' },
  CRITICAL: { min: 0, max: 39, label: 'Critical', color: '#dc3545' }
} as const;

// Cloud Providers
export const CLOUD_PROVIDERS = [
  'AWS',
  'Azure',
  'GCP',
  'Oracle Cloud',
  'IBM Cloud',
  'Alibaba Cloud',
  'DigitalOcean',
  'Linode',
  'Vultr',
  'On-Premise',
  'Hybrid',
  'Other'
] as const;

// AWS Regions
export const AWS_REGIONS = [
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'ca-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-central-1',
  'eu-north-1',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-south-1',
  'sa-east-1'
] as const;

// RPO/RTO Common Values (in minutes)
export const RPO_RTO_PRESETS = {
  MISSION_CRITICAL: { rpo: 5, rto: 15 },
  BUSINESS_CRITICAL: { rpo: 15, rto: 60 },
  IMPORTANT: { rpo: 60, rto: 240 },
  LOW_PRIORITY: { rpo: 1440, rto: 2880 }
} as const;

// Compliance Frameworks
export const COMPLIANCE_FRAMEWORKS = [
  'SOC 2 Type II',
  'ISO 27001',
  'HIPAA',
  'PCI DSS',
  'GDPR',
  'NIST CSF',
  'FedRAMP',
  'FISMA',
  'CCPA',
  'PIPEDA'
] as const;

// Component Types by Provider Service
export const PROVIDER_SERVICES = {
  AWS: {
    COMPUTE: ['EC2', 'Lambda', 'ECS', 'EKS', 'Fargate', 'Lightsail'],
    STORAGE: ['S3', 'EBS', 'EFS', 'FSx', 'Glacier'],
    DATABASE: ['RDS', 'DynamoDB', 'Aurora', 'Redshift', 'DocumentDB', 'Neptune'],
    NETWORK: ['VPC', 'Route 53', 'CloudFront', 'API Gateway', 'Direct Connect'],
    LOAD_BALANCER: ['ELB', 'ALB', 'NLB', 'GWLB'],
    CACHE: ['ElastiCache', 'DAX'],
    MESSAGE_QUEUE: ['SQS', 'SNS', 'EventBridge', 'Kinesis', 'MQ']
  },
  Azure: {
    COMPUTE: ['Virtual Machines', 'App Service', 'Functions', 'Container Instances', 'AKS'],
    STORAGE: ['Blob Storage', 'File Storage', 'Queue Storage', 'Disk Storage'],
    DATABASE: ['SQL Database', 'Cosmos DB', 'Database for MySQL', 'Database for PostgreSQL'],
    NETWORK: ['Virtual Network', 'DNS', 'CDN', 'Front Door', 'ExpressRoute'],
    LOAD_BALANCER: ['Load Balancer', 'Application Gateway', 'Traffic Manager'],
    CACHE: ['Cache for Redis'],
    MESSAGE_QUEUE: ['Service Bus', 'Event Grid', 'Event Hubs']
  },
  GCP: {
    COMPUTE: ['Compute Engine', 'Cloud Functions', 'Cloud Run', 'GKE', 'App Engine'],
    STORAGE: ['Cloud Storage', 'Persistent Disk', 'Filestore'],
    DATABASE: ['Cloud SQL', 'Cloud Spanner', 'Bigtable', 'Firestore'],
    NETWORK: ['VPC', 'Cloud DNS', 'Cloud CDN', 'Cloud Interconnect'],
    LOAD_BALANCER: ['Cloud Load Balancing'],
    CACHE: ['Memorystore'],
    MESSAGE_QUEUE: ['Pub/Sub', 'Cloud Tasks']
  }
} as const;

// Default Branding
export const DEFAULT_BRANDING = {
  primaryColor: '#0066cc',
  secondaryColor: '#333333',
  accentColor: '#ff6600',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
} as const;

// Rate Limiting
export const RATE_LIMITS = {
  API_DEFAULT: { windowMs: 15 * 60 * 1000, max: 100 },
  AUTH: { windowMs: 15 * 60 * 1000, max: 5 },
  PDF_GENERATION: { windowMs: 60 * 60 * 1000, max: 10 }
} as const;

// Token Expiry
export const TOKEN_EXPIRY = {
  ACCESS_TOKEN: '15m',
  REFRESH_TOKEN: '7d',
  PASSWORD_RESET: '1h',
  MFA: '5m'
} as const;
