import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as initialMigration from './migrations/0001_init_tasvir_schema';

dotenv.config();

async function run() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/tasvir';
  console.log(`Connecting to database at ${connectionString}...`);

  const isSsl = connectionString.includes('sslmode=') || connectionString.includes('neon.tech');
  const pool = new Pool({
    connectionString,
    ssl: isSsl ? { rejectUnauthorized: false } : undefined,
  });
  const db = new Kysely<any>({
    dialect: new PostgresDialect({ pool }),
  });

  try {
    console.log('Running up() migration...');
    await initialMigration.up(db);
    console.log('Migration finished successfully!');
  } catch (error: any) {
    console.error('Migration failed:', error);
  } finally {
    await db.destroy();
  }
}

run();

