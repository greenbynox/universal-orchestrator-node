import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface LegacyNode {
  id: string;
  name: string;
  blockchain: string;
  mode: string;
  dataPath: string;
  rpcPort: number;
  p2pPort: number;
  wsPort?: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Migre les nodes du fichier JSON historique vers SQLite via Prisma
 */
export async function migrateNodesJsonToPrisma(): Promise<void> {
  const nodesFile = path.join(process.cwd(), 'data', 'nodes.json');
  if (!fs.existsSync(nodesFile)) {
    logger.info('Aucun nodes.json à migrer');
    return;
  }

  const backupFile = path.join(process.cwd(), 'data', `nodes.json.backup`);
  const raw = fs.readFileSync(nodesFile, 'utf-8');
  const nodes: LegacyNode[] = JSON.parse(raw);

  let migrated = 0;
  for (const node of nodes) {
    const exists = await prisma.node.findUnique({ where: { id: node.id } });
    if (exists) continue;

    await prisma.node.create({
      data: {
        id: node.id,
        name: node.name,
        blockchain: node.blockchain,
        mode: node.mode,
        dataPath: node.dataPath,
        rpcPort: node.rpcPort,
        p2pPort: node.p2pPort,
        wsPort: node.wsPort ?? null,
        status: 'stopped',
        createdAt: node.createdAt ? new Date(node.createdAt) : new Date(),
        updatedAt: node.updatedAt ? new Date(node.updatedAt) : new Date(),
      },
    });
    migrated++;
  }

  fs.renameSync(nodesFile, backupFile);
  logger.info(`Migration de ${migrated} node(s) vers SQLite ✓`, { backupFile });
}

// Permet d'exécuter directement: ts-node src/utils/migrationHelpers.ts
if (require.main === module) {
  migrateNodesJsonToPrisma()
    .then(() => {
      logger.info('Migration terminée');
      return prisma.$disconnect();
    })
    .catch(async (err) => {
      logger.error('Migration échouée', { err });
      await prisma.$disconnect();
      process.exit(1);
    });
}
