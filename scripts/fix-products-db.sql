-- Fix products table: remove old data and fix schema
-- Run this SQL directly on your database

-- Step 1: Delete all products first
DELETE FROM products;

-- Step 2: Convert category to TEXT to remove enum constraint
ALTER TABLE products ALTER COLUMN category TYPE TEXT USING category::TEXT;

-- Step 3: Drop the old enum type
DROP TYPE IF EXISTS enum_products_category CASCADE;

-- Step 4: Add uid column if it doesn't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS uid TEXT;

-- Step 5: Create unique index on uid
CREATE UNIQUE INDEX IF NOT EXISTS products_uid_key ON products(uid);

-- Now restart your Payload server and it will recreate the enum with new values
