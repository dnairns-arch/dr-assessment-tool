import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default organization
  const org = await prisma.organization.upsert({
    where: { subdomain: 'demo' },
    update: {},
    create: {
      name: 'Demo Organization',
      subdomain: 'demo',
      brandingConfig: {
        create: {
          primaryColor: '#0066cc',
          secondaryColor: '#333333',
          accentColor: '#ff6600',
          fontFamily: 'Inter, sans-serif',
          contactEmail: 'contact@demo.com',
          website: 'https://demo.dr-assessment.com'
        }
      }
    },
    include: {
      brandingConfig: true
    }
  });

  console.log('✅ Created organization:', org.name);

  // Create admin user
  const adminPasswordHash = await hashPassword('Admin123!');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      passwordHash: adminPasswordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ORG_ADMIN',
      organizationId: org.id
    }
  });

  console.log('✅ Created admin user:', admin.email);
  console.log('   Password: Admin123!');

  // Create assessor user
  const assessorPasswordHash = await hashPassword('Assessor123!');
  const assessor = await prisma.user.upsert({
    where: { email: 'assessor@demo.com' },
    update: {},
    create: {
      email: 'assessor@demo.com',
      passwordHash: assessorPasswordHash,
      firstName: 'Test',
      lastName: 'Assessor',
      role: 'ASSESSOR',
      organizationId: org.id
    }
  });

  console.log('✅ Created assessor user:', assessor.email);
  console.log('   Password: Assessor123!');

  // Create a sample assessment
  const assessment = await prisma.assessment.create({
    data: {
      name: 'Sample DR Assessment',
      description: 'A sample assessment to demonstrate the platform',
      type: 'HIGH_LEVEL',
      status: 'DRAFT',
      organizationId: org.id,
      createdById: admin.id
    }
  });

  console.log('✅ Created sample assessment:', assessment.name);

  console.log('\n✨ Seed completed successfully!\n');
  console.log('You can now log in with:');
  console.log('  Email: admin@demo.com');
  console.log('  Password: Admin123!');
  console.log('\nor');
  console.log('  Email: assessor@demo.com');
  console.log('  Password: Assessor123!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
