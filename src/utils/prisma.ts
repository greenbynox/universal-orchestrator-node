
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Helper: ensure SQLite DB file and parent dir exist before Prisma init
function ensureSqliteDb() {
  const dbUrl = process.env.DATABASE_URL || 'file:./data/orchestrator.db';
  // Only handle file: URLs (sqlite)
  const match = dbUrl.match(/^file:(.+)$/);
  if (match) {
    const dbPath = match[1].replace(/^\//, ''); // remove leading slash if present
    const absPath = path.isAbsolute(dbPath) ? dbPath : path.join(process.cwd(), dbPath);
    const dir = path.dirname(absPath);
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      if (!fs.existsSync(absPath)) {
        // Create empty file (Prisma will migrate on first use)
        fs.writeFileSync(absPath, '');
        // Optionally: run `prisma db push` here if you want auto-migration
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[prisma] Failed to auto-create SQLite DB file:', e);
    }
  }
}

ensureSqliteDb();

// Singleton Prisma client to avoid exhausting connections
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['warn', 'error'],
  });

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}

export default prisma;
