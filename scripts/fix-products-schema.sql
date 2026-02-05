-- Fix products table schema
-- Run this SQL on your database

-- 1. Add uid column if it doesn't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS uid TEXT;

-- 2. Create unique index on uid if it doesn't exist
CREATE UNIQUE INDEX IF NOT EXISTS products_uid_key ON products(uid);

-- 3. First, convert category to TEXT to remove enum constraint
ALTER TABLE products ALTER COLUMN category TYPE TEXT USING category::TEXT;

-- 4. Drop the old enum type if it exists
DROP TYPE IF EXISTS enum_products_category CASCADE;

-- 5. Now Payload will recreate the enum with the new values when you restart
