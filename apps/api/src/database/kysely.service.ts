import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Kysely, PostgresDialect, sql } from 'kysely';
import { Pool } from 'pg';
import { newDb, DataType } from 'pg-mem';
import { Database } from './schema';
import * as initialMigration from './migrations/0001_init_tasvir_schema';
import * as crypto from 'crypto';

@Injectable()
export class KyselyService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KyselyService.name);
  private _db!: Kysely<Database>;
  private pool?: Pool;

  get db(): Kysely<Database> {
    return this._db;
  }

  selectFrom<TB extends keyof Database>(table: TB) {
    return this._db.selectFrom(table);
  }

  insertInto<TB extends keyof Database>(table: TB) {
    return this._db.insertInto(table);
  }

  updateTable<TB extends keyof Database>(table: TB) {
    return this._db.updateTable(table);
  }

  deleteFrom<TB extends keyof Database>(table: TB) {
    return this._db.deleteFrom(table);
  }

  transaction() {
    return this._db.transaction();
  }

  async onModuleInit() {
    await this.initDatabase();
    await this.runMigrations();
    await this.seedInitialData();
  }

  async onModuleDestroy() {
    if (this._db) {
      await this._db.destroy();
    }
    if (this.pool) {
      await this.pool.end();
    }
  }

  private async initDatabase() {
    const connectionString = process.env.DATABASE_URL;

    if (connectionString) {
      try {
        this.logger.log(`Connecting to PostgreSQL via DATABASE_URL...`);
        const isSsl = connectionString.includes('sslmode=') || connectionString.includes('neon.tech');
        this.pool = new Pool({
          connectionString,
          ssl: isSsl ? { rejectUnauthorized: false } : undefined,
          max: 10,
          idleTimeoutMillis: 30000,
        });

        const client = await this.pool.connect();
        client.release();

        this._db = new Kysely<Database>({
          dialect: new PostgresDialect({
            pool: this.pool,
          }),
        });
        this.logger.log(`Successfully connected to PostgreSQL`);
        return;
      } catch (err: any) {
        this.logger.warn(`Could not connect to external PostgreSQL (${err.message}). Falling back to high-fidelity pg-mem engine.`);
      }
    }

    this.logger.log(`Initializing zero-config Postgres engine (pg-mem) with pgcrypto extensions...`);
    const mem = newDb({
      autoCreateForeignKeyIndices: true,
    });

    mem.registerExtension('pgcrypto', (schema) => {
      schema.registerFunction({
        name: 'gen_random_uuid',
        returns: DataType.uuid,
        impure: true,
        implementation: () => crypto.randomUUID(),
      });
    });

    mem.public.registerFunction({
      name: 'gen_random_uuid',
      returns: DataType.uuid,
      impure: true,
      implementation: () => crypto.randomUUID(),
    });

    const pgAdapter = mem.adapters.createPg();
    this.pool = new pgAdapter.Pool() as unknown as Pool;

    this._db = new Kysely<Database>({
      dialect: new PostgresDialect({
        pool: this.pool,
      }),
    });
    this.logger.log(`PostgreSQL engine ready.`);
  }

  private async runMigrations() {
    try {
      this.logger.log(`Running initial schema migration (0001_init_tasvir_schema)...`);
      await initialMigration.up(this._db);
      this.logger.log(`Schema migration completed successfully.`);
    } catch (err: any) {
      if (err.message && (err.message.includes('already exists') || err.message.includes('duplicate'))) {
        this.logger.log(`Tables already initialized.`);
      } else {
        this.logger.error(`Migration error: ${err.message}`, err.stack);
      }
    }

    try {
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS role varchar(20) DEFAULT 'user'`.execute(this._db);
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email varchar(120)`.execute(this._db);
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url text`.execute(this._db);
      await sql`ALTER TABLE users DROP COLUMN IF EXISTS phone_number CASCADE`.execute(this._db);
      await sql`ALTER TABLE users ALTER COLUMN credits_balance SET DEFAULT 0`.execute(this._db);
      await sql`ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user'`.execute(this._db);
      await sql`ALTER TABLE video_jobs DROP CONSTRAINT IF EXISTS video_jobs_avatar_id_fkey`.execute(this._db);
      await sql`ALTER TABLE video_jobs ALTER COLUMN avatar_id DROP NOT NULL`.execute(this._db);
      await sql`ALTER TABLE video_jobs DROP CONSTRAINT IF EXISTS video_jobs_product_id_fkey`.execute(this._db);
      await sql`ALTER TABLE video_jobs ALTER COLUMN product_id TYPE varchar(255) USING product_id::varchar`.execute(this._db);
      await sql`ALTER TABLE video_jobs ALTER COLUMN product_id DROP NOT NULL`.execute(this._db);
      await sql`DROP TABLE IF EXISTS ai_avatars CASCADE`.execute(this._db);
      await sql`
        CREATE TABLE IF NOT EXISTS token_requests (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          phone_number varchar(20),
          requested_tokens integer NOT NULL,
          note text,
          status varchar(20) NOT NULL DEFAULT 'pending',
          admin_id uuid,
          created_at timestamptz NOT NULL DEFAULT now(),
          resolved_at timestamptz
        )
      `.execute(this._db);
      await sql`CREATE INDEX IF NOT EXISTS idx_video_jobs_user_created ON video_jobs (user_id, created_at DESC)`.execute(this._db);
      await sql`CREATE INDEX IF NOT EXISTS idx_token_requests_user ON token_requests (user_id, status)`.execute(this._db);
    } catch (err: any) {
      this.logger.warn(`Token request schema check notice: ${err.message}`);
    }
  }

  private async seedInitialData() {
    try {
      const usersCount = await this._db
        .selectFrom('users')
        .select(sql`count(*)`.as('count'))
        .executeTakeFirst();

      if (Number(usersCount?.count || 0) === 0) {
        await this._db
          .insertInto('users')
          .values({
            email: 'sardor091019@gmail.com',
            full_name: 'Sardor Sunnatullayev',
            telegram_id: null,
            locale: 'uz',
            role: 'admin',
            plan_tier: 'agency',
            credits_balance: 100,
          })
          .execute();
        this.logger.log(`Seeded default admin user (sardor091019@gmail.com) with 100 credits.`);
      }

      const firstUser = await this._db
        .selectFrom('users')
        .select('id')
        .limit(1)
        .executeTakeFirst();
      const defaultUserId = firstUser?.id;

      const productsCount = await this._db
        .selectFrom('products')
        .select(sql`count(*)`.as('count'))
        .executeTakeFirst();

      if (defaultUserId && Number(productsCount?.count || 0) === 0) {
        const demoProducts = [
          {
            user_id: defaultUserId,
            title: 'Nike Air Zoom Pegasus 40',
            category: 'Kiyim va Poyabzal',
            price_uzs: 450000,
            discount_badge: '-35% Chegirma',
            image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
          },
          {
            user_id: defaultUserId,
            title: "Milliy Atlas Ayollar Ko'ylagi (Xonatlas)",
            category: 'Milliy Liboslar',
            price_uzs: 320000,
            discount_badge: 'Bestseller Uzum',
            image_url: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80',
          },
          {
            user_id: defaultUserId,
            title: 'Smart Watch Ultra 8 Series AMOLED',
            category: 'Elektronika',
            price_uzs: 290000,
            discount_badge: '1+1 Sovg‘a',
            image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
          },
          {
            user_id: defaultUserId,
            title: 'Samarqand Oq Mushk Parfyum 50ml',
            category: "Go'zallik va Parvarish",
            price_uzs: 550000,
            discount_badge: '-20% Maxsus Taklif',
            image_url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80',
          },
        ];

        for (const prod of demoProducts) {
          await this._db.insertInto('products').values(prod).execute();
        }
        this.logger.log(`Seeded demo e-commerce products.`);
      }
    } catch (err: any) {
      this.logger.error(`Seed error: ${err.message}`, err.stack);
    }
  }
}
