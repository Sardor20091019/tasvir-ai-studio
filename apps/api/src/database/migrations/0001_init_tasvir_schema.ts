import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`.execute(db);

  await db.schema
    .createTable('users')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('email', 'varchar(120)', (col) => col.unique())
    .addColumn('phone_number', 'varchar(20)')
    .addColumn('full_name', 'varchar(120)', (col) => col.notNull())
    .addColumn('avatar_url', 'text')
    .addColumn('telegram_id', 'bigint', (col) => col.unique())
    .addColumn('locale', 'varchar(5)', (col) => col.notNull().defaultTo('uz'))
    .addColumn('plan_tier', 'varchar(30)', (col) =>
      col.notNull().defaultTo('starter')
    ) 
    .addColumn('credits_balance', 'integer', (col) =>
      col.notNull().defaultTo(0)
    )
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .execute();

  await db.schema
    .createTable('ai_avatars')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('slug', 'varchar(50)', (col) => col.notNull().unique())
    .addColumn('display_name', 'varchar(80)', (col) => col.notNull())
    .addColumn('dialect_label', 'varchar(80)', (col) => col.notNull()) 
    .addColumn('language_code', 'varchar(10)', (col) => col.notNull())
    .addColumn('avatar_image_url', 'text', (col) => col.notNull())
    .addColumn('voice_model_id', 'varchar(120)', (col) => col.notNull())
    .addColumn('is_active', 'boolean', (col) => col.notNull().defaultTo(true))
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .execute();

  await db.schema
    .createTable('products')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('user_id', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade')
    )
    .addColumn('title', 'varchar(160)', (col) => col.notNull())
    .addColumn('category', 'varchar(60)', (col) => col.notNull())
    .addColumn('price_uzs', 'bigint', (col) => col.notNull())
    .addColumn('discount_badge', 'varchar(40)') 
    .addColumn('image_url', 'text', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .execute();

  await db.schema
    .createTable('video_jobs')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('user_id', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade')
    )
    .addColumn('product_id', 'uuid', (col) =>
      col.notNull().references('products.id').onDelete('cascade')
    )
    .addColumn('avatar_id', 'uuid', (col) =>
      col.notNull().references('ai_avatars.id').onDelete('restrict')
    )
    .addColumn('platform_preset', 'varchar(30)', (col) =>
      col.notNull().defaultTo('uzum_9_16')
    ) 
    .addColumn('script_tone', 'varchar(30)', (col) =>
      col.notNull().defaultTo('discount_hook')
    )
    .addColumn('script_text', 'text', (col) => col.notNull())
    .addColumn('status', 'varchar(30)', (col) =>
      col.notNull().defaultTo('queued')
    ) 
    .addColumn('progress_percent', 'integer', (col) =>
      col.notNull().defaultTo(0)
    )
    .addColumn('audio_preview_url', 'text')
    .addColumn('output_video_url', 'text')
    .addColumn('credits_charged', 'integer', (col) =>
      col.notNull().defaultTo(1)
    )
    .addColumn('error_message', 'text')
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn('completed_at', 'timestamptz')
    .execute();

  await db.schema
    .createTable('payment_transactions')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('user_id', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade')
    )
    .addColumn('provider', 'varchar(20)', (col) => col.notNull()) 
    .addColumn('plan_tier', 'varchar(30)', (col) => col.notNull())
    .addColumn('amount_uzs', 'bigint', (col) => col.notNull())
    .addColumn('credits_added', 'integer', (col) => col.notNull())
    .addColumn('phone_number', 'varchar(20)')
    .addColumn('external_tx_id', 'varchar(120)')
    .addColumn('status', 'varchar(20)', (col) =>
      col.notNull().defaultTo('pending')
    ) 
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .execute();

  await db.schema
    .createIndex('idx_products_user_id')
    .on('products')
    .column('user_id')
    .execute();

  await db.schema
    .createIndex('idx_video_jobs_user_status')
    .on('video_jobs')
    .columns(['user_id', 'status'])
    .execute();

  await db.schema
    .createIndex('idx_payments_user_created')
    .on('payment_transactions')
    .columns(['user_id', 'created_at'])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('payment_transactions').ifExists().execute();
  await db.schema.dropTable('video_jobs').ifExists().execute();
  await db.schema.dropTable('products').ifExists().execute();
  await db.schema.dropTable('ai_avatars').ifExists().execute();
  await db.schema.dropTable('users').ifExists().execute();
}

