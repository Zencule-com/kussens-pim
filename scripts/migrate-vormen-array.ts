/**
 * One-time migration: create products_vormen table and migrate data from products_rels.
 * Safe to run multiple times (uses IF NOT EXISTS).
 * Run before Payload starts so the table exists when Drizzle checks.
 */
import 'dotenv/config'
import pg from 'pg'

const { Client } = pg

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()

  // 1. Create the array table if it doesn't exist
  await client.query(`
    CREATE TABLE IF NOT EXISTS "products_vormen" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "vorm_id" integer NOT NULL
    );
  `)

  // Add foreign keys (ignore if they already exist)
  await client.query(`
    DO $$ BEGIN
      ALTER TABLE "products_vormen"
        ADD CONSTRAINT "products_vormen_vorm_id_vormen_id_fk"
        FOREIGN KEY ("vorm_id") REFERENCES "public"."vormen"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `)

  await client.query(`
    DO $$ BEGIN
      ALTER TABLE "products_vormen"
        ADD CONSTRAINT "products_vormen_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `)

  // Add indexes
  await client.query(`CREATE INDEX IF NOT EXISTS "products_vormen_order_idx" ON "products_vormen" ("_order");`)
  await client.query(`CREATE INDEX IF NOT EXISTS "products_vormen_parent_id_idx" ON "products_vormen" ("_parent_id");`)
  await client.query(`CREATE INDEX IF NOT EXISTS "products_vormen_vorm_idx" ON "products_vormen" ("vorm_id");`)

  // 2. Migrate data from products_rels (if any vormen rows exist there)
  const { rowCount } = await client.query(`
    INSERT INTO "products_vormen" ("_order", "_parent_id", "id", "vorm_id")
    SELECT
      ROW_NUMBER() OVER (PARTITION BY "parent_id" ORDER BY "order") AS "_order",
      "parent_id" AS "_parent_id",
      gen_random_uuid()::varchar AS "id",
      "vormen_id" AS "vorm_id"
    FROM "products_rels"
    WHERE "vormen_id" IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM "products_vormen" pv
        WHERE pv."_parent_id" = "products_rels"."parent_id"
          AND pv."vorm_id" = "products_rels"."vormen_id"
      )
    ON CONFLICT DO NOTHING;
  `)
  console.log(`Migrated ${rowCount} vormen rows from products_rels to products_vormen`)

  // 3. Clean up old rows from products_rels
  const del = await client.query(`DELETE FROM "products_rels" WHERE "vormen_id" IS NOT NULL;`)
  console.log(`Cleaned up ${del.rowCount} old vormen rows from products_rels`)

  // 4. Backfill displayTitle on vormen (naam + category label)
  await client.query(`ALTER TABLE "vormen" ADD COLUMN IF NOT EXISTS "display_title" varchar;`)

  const categoryLabels: Record<string, string> = {
    zitkussen: 'Zitkussen',
    rugkussen: 'Rugkussen',
    overig: 'Overig',
  }
  const vormen = await client.query(`SELECT id, naam, category FROM vormen WHERE display_title IS NULL OR display_title = ''`)
  for (const row of vormen.rows) {
    const catLabel = categoryLabels[row.category] || row.category || ''
    const displayTitle = catLabel ? `${row.naam} (${catLabel})` : row.naam
    await client.query(`UPDATE vormen SET display_title = $1 WHERE id = $2`, [displayTitle, row.id])
  }
  console.log(`Backfilled displayTitle for ${vormen.rowCount} vormen`)

  // 5. Add fields and default_dims columns for dimension config
  await client.query(`ALTER TABLE "vormen" ADD COLUMN IF NOT EXISTS "fields" jsonb;`)
  await client.query(`ALTER TABLE "vormen" ADD COLUMN IF NOT EXISTS "default_dims" jsonb;`)

  // Seed dimension data for shapes that don't have it yet
  const SHAPE_DIMENSIONS: Record<string, { fields: object; defaultDims: object }> = {
    rechthoekig: {
      fields: { length: true, depth: true, thickness: true },
      defaultDims: { length: 50, depth: 50, thickness: 10 },
    },
    rond: {
      fields: { diameter: true, thickness: true },
      defaultDims: { diameter: 50, thickness: 10 },
    },
    'rug-schuin': {
      fields: { lengthUpper: true, lengthLower: true, height: true, thickness: true },
      defaultDims: { lengthUpper: 30, lengthLower: 50, height: 50, thickness: 10 },
    },
    'schuine-zijde-links': {
      fields: { lengthBack: true, lengthFront: true, depth: true, thickness: true },
      defaultDims: { lengthBack: 50, lengthFront: 30, depth: 50, thickness: 10 },
    },
    'schuine-zijde-rechts': {
      fields: { lengthBack: true, lengthFront: true, depth: true, thickness: true },
      defaultDims: { lengthBack: 50, lengthFront: 30, depth: 50, thickness: 10 },
    },
    'plof-kussen': {
      fields: { length: true, depth: true },
      defaultDims: { length: 60, depth: 60, thickness: 7 },
    },
    sier: {
      fields: { length: true, depth: true, thickness: true },
      defaultDims: { length: 45, depth: 45, thickness: 5 },
    },
    'sier-rechthoekig': {
      fields: { length: true, depth: true, thickness: true },
      defaultDims: { length: 50, depth: 30, thickness: 5 },
    },
    kussenopplank: {
      fields: { length: true, depth: true, thickness: true },
      defaultDims: { length: 50, depth: 50, thickness: 10 },
    },
  }

  let seededCount = 0
  for (const [key, dims] of Object.entries(SHAPE_DIMENSIONS)) {
    const res = await client.query(
      `UPDATE vormen SET fields = $1, default_dims = $2 WHERE key = $3 AND (fields IS NULL OR default_dims IS NULL)`,
      [JSON.stringify(dims.fields), JSON.stringify(dims.defaultDims), key],
    )
    if (res.rowCount && res.rowCount > 0) seededCount++
  }
  console.log(`Seeded dimension data for ${seededCount} vormen`)

  await client.end()
  console.log('Migration complete')
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
