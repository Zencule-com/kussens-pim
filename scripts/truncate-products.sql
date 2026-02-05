-- Truncate products table
-- Run this SQL directly on your database

TRUNCATE TABLE products CASCADE;

-- Verify it's empty
SELECT COUNT(*) FROM products;
