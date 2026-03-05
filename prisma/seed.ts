import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.api.upsert({
    where: { id: 'default-google' },
    update: {},
    create: {
      id: 'default-google',
      name: 'Google API Test',
      url: 'https://www.google.com',
      interval: 60,
      active: true,
    },
  });

  await prisma.api.upsert({
    where: { id: 'default-failure' },
    update: {},
    create: {
      id: 'default-failure',
      name: 'Failure Test API',
      url: 'https://httpstat.us/404',
      interval: 60,
      active: true,
    },
  });

  console.log('Seed data created!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
