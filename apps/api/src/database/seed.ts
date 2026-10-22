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
    const existing = await db.selectFrom('users').selectAll().where('phone_number', 'in', ['+998990991112', '+998901234567']).executeTakeFirst();
    let userId = existing?.id;
    if (!userId) {
      const u = await db.insertInto('users').values({
        phone_number: '+998990991112',
        full_name: 'Sardor Sunatullayev',
        telegram_id: null,
        locale: 'uz',
        role: 'admin',
        plan_tier: 'agency',
        credits_balance: 100,
      }).returningAll().executeTakeFirstOrThrow();
      userId = u.id;
    } else {
      await db.updateTable('users').set({
        full_name: 'Sardor Sunatullayev',
        phone_number: '+998990991112',
        role: 'admin',
        credits_balance: 100,
      }).where('id', '=', userId).execute();
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

