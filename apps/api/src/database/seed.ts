import { Kysely, PostgresDialect, sql } from 'kysely';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { Database } from './schema';

dotenv.config();

async function seed() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/tasvir';
  console.log(`Connecting to database at ${connectionString}...`);

  const isSsl = connectionString.includes('sslmode=') || connectionString.includes('neon.tech');
  const pool = new Pool({
    connectionString,
    ssl: isSsl ? { rejectUnauthorized: false } : undefined,
  });
  const db = new Kysely<Database>({
    dialect: new PostgresDialect({ pool }),
  });

  try {
    console.log('Seeding demo user, avatars and products...');
    const existing = await db.selectFrom('users').selectAll().where('email', '=', 'sardor091019@gmail.com').executeTakeFirst();
    let userId = existing?.id;
    if (!userId) {
      const u = await db.insertInto('users').values({
        email: 'sardor091019@gmail.com',
        full_name: 'Sardor Sunnatullayev',
        telegram_id: null,
        locale: 'uz',
        role: 'admin',
        plan_tier: 'agency',
        credits_balance: 100,
      }).returningAll().executeTakeFirstOrThrow();
      userId = u.id;
    }

    console.log(`User ID: ${userId}`);
    console.log('Seed completed successfully!');
  } catch (error) {
    console.error('Seed failed:', error);
  } finally {
    await db.destroy();
  }
}

seed();

