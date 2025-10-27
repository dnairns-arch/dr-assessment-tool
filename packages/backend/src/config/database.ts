import { PrismaClient } from '@prisma/client';
import { env } from './env';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: env.server.nodeEnv === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: env.database.url
      }
    }
  });
};

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (env.server.nodeEnv !== 'production') {
  globalThis.prismaGlobal = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
