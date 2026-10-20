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

  // Delegated query builders for convenience
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

        // Test connection
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

    // Zero-config in-memory PostgreSQL engine
    this.logger.log(`Initializing zero-config Postgres engine (pg-mem) with pgcrypto extensions...`);
    const mem = newDb({
      autoCreateForeignKeyIndices: true,
    });

    // Register pgcrypto extension & gen_random_uuid
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
      // Ignore if table already exists
      if (err.message && (err.message.includes('already exists') || err.message.includes('duplicate'))) {
        this.logger.log(`Tables already initialized.`);
      } else {
        this.logger.error(`Migration error: ${err.message}`, err.stack);
      }
    }
  }

  private async seedInitialData() {
    try {
      // 1. Seed or find default demo user
      const existingUser = await this._db
        .selectFrom('users')
        .selectAll()
        .where('phone_number', '=', '+998901234567')
        .executeTakeFirst();

      let defaultUserId: string;

      if (!existingUser) {
        const newUser = await this._db
          .insertInto('users')
          .values({
            phone_number: '+998901234567',
            full_name: 'Anvar Rahimov',
            telegram_id: 849201938,
            locale: 'uz',
            plan_tier: 'starter',
            credits_balance: 3,
          })
          .returningAll()
          .executeTakeFirstOrThrow();
        defaultUserId = newUser.id;
        this.logger.log(`Seeded default demo user (Anvar Rahimov, id: ${defaultUserId}) with 3 free credits.`);
      } else {
        defaultUserId = existingUser.id;
      }

      // 2. Seed 4 Central Asian AI Avatars
      const avatarsCount = await this._db
        .selectFrom('ai_avatars')
        .select(sql`count(*)`.as('count'))
        .executeTakeFirst();

      if (Number(avatarsCount?.count || 0) === 0) {
        const avatars = [
          {
            slug: 'malika',
            display_name: 'Malika',
            dialect_label: 'Toshkent shevasi',
            language_code: 'uz-UZ',
            avatar_image_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
            voice_model_id: 'uz-voice-malika-warm',
            is_active: true,
          },
          {
            slug: 'javohir',
            display_name: 'Javohir',
            dialect_label: 'Adabiy oʻzbek',
            language_code: 'uz-UZ',
            avatar_image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
            voice_model_id: 'uz-voice-javohir-dynamic',
            is_active: true,
          },
          {
            slug: 'dilnoza',
            display_name: 'Dilnoza',
            dialect_label: 'Samarqand / Vodiy',
            language_code: 'uz-UZ',
            avatar_image_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80',
            voice_model_id: 'uz-voice-dilnoza-friendly',
            is_active: true,
          },
          {
            slug: 'timur',
            display_name: 'Timur',
            dialect_label: 'Rus tili (Toshkent)',
            language_code: 'ru-UZ',
            avatar_image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
            voice_model_id: 'ru-voice-timur-energetic',
            is_active: true,
          },
        ];

        for (const av of avatars) {
          await this._db.insertInto('ai_avatars').values(av).execute();
        }
        this.logger.log(`Seeded 4 Central Asian AI presenter avatars.`);
      }

      // 3. Seed demo products if empty
      const productsCount = await this._db
        .selectFrom('products')
        .select(sql`count(*)`.as('count'))
        .executeTakeFirst();

      if (Number(productsCount?.count || 0) === 0) {
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
