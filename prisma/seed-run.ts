import { seed } from './seed';

seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    // ensure prisma disconnect if exported
    try {
      const { prisma } = await import('../src/lib/db');
      await prisma.$disconnect();
    } catch (_e) {
      // ignore
    }
  });
