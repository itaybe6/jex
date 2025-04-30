-- Migration: Remove currency column from products table
ALTER TABLE products DROP COLUMN IF EXISTS currency; 