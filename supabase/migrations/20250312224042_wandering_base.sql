/*
  # Add product details column

  1. Changes
    - Add JSONB column 'details' to products table to store technical specifications
    - Column allows storing flexible product details like weight, clarity, color, etc.

  2. Security
    - Maintains existing RLS policies
*/

ALTER TABLE products
ADD COLUMN IF NOT EXISTS details JSONB;