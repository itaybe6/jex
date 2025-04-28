/*
  # Fix Product Deletion Permissions and Add Product Status

  1. Changes
    - Add explicit CASCADE option to foreign key constraints
    - Update RLS policies for product deletion
    - Ensure proper user authorization checks
    - Add status column to products table

  2. Security
    - Maintains data integrity
    - Enforces proper user authorization
*/

-- Add status column to products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS status text DEFAULT 'available';

-- Drop existing foreign key constraints if they exist
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'sold_products_product_id_fkey'
  ) THEN
    ALTER TABLE sold_products DROP CONSTRAINT sold_products_product_id_fkey;
  END IF;
END $$;

-- Re-create foreign key with CASCADE
ALTER TABLE sold_products
ADD CONSTRAINT sold_products_product_id_fkey
FOREIGN KEY (product_id) 
REFERENCES products(id)
ON DELETE CASCADE;

-- Ensure RLS is enabled
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop existing delete policy if exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE tablename = 'products' 
    AND policyname = 'Users can delete their own products'
  ) THEN
    DROP POLICY "Users can delete their own products" ON products;
  END IF;
END $$;

-- Create new delete policy with proper checks
CREATE POLICY "Users can delete their own products"
ON products
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);