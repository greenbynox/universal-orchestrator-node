
import { migrateNodesJsonToPrisma } from './src/utils/migrationHelpers';
import { logger } from './src/utils/logger';
import { config } from './src/config';
import path from 'path';

async function runMigration() {
  logger.info('Starting migration...');
  logger.info(`Config data path: ${config.paths.data}`);
  logger.info(`Expected nodes.json path: ${path.join(config.paths.data, 'nodes.json')}`);
  
  try {
    await migrateNodesJsonToPrisma();
    logger.info('Migration completed successfully.');
  } catch (error) {
    logger.error('Migration failed:', error);
  }
}

runMigration();
