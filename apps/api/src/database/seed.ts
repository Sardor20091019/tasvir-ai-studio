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
    const existing = await db.selectFrom('users').selectAll().where('phone_number', '=', '+998901234567').executeTakeFirst();
    let userId = existing?.id;
    if (!userId) {
      const u = await db.insertInto('users').values({
        phone_number: '+998901234567',
        full_name: 'Anvar Rahimov',
        telegram_id: 849201938,
        locale: 'uz',
        plan_tier: 'starter',
        credits_balance: 3,
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

