import { PrismaClient } from '@prisma/client';

// If DATABASE_URL is not provided but separate PostgreSQL credentials are, construct the URL
const getDatabaseUrl = () => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  if (process.env.PGUSER && process.env.PGPASSWORD) {
    const user = process.env.PGUSER;
    const password = process.env.PGPASSWORD;
    const host = process.env.PGHOST || 'localhost';
    const port = process.env.PGPORT || '5432';
    const db = process.env.PGDATABASE || 'aicte_db';
    return `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${db}?schema=public`;
  }
  return undefined;
};

const dbUrl = getDatabaseUrl();
if (dbUrl) {
  process.env.DATABASE_URL = dbUrl;
}

const prisma = new PrismaClient({
  datasources: dbUrl ? { db: { url: dbUrl } } : undefined,
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export default prisma;
