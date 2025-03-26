/*
  # Add sold products tracking

  1. Changes
    - Add sold_products table to track product sales
    - Add sold_count to profiles table
    - Add trigger to update sold_count automatically

  2. Security
    - Enable RLS on sold_products table
    - Add policies for authenticated users
*/

-- Add sold_count to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS sold_count INTEGER DEFAULT 0;

-- Create sold_products table
CREATE TABLE IF NOT EXISTS sold_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id),
  seller_id uuid REFERENCES profiles(id),
  sold_at timestamptz DEFAULT now(),
  price numeric NOT NULL
);

ALTER TABLE sold_products ENABLE ROW LEVEL SECURITY;

-- Create policies for sold_products
CREATE POLICY "Users can view their own sold products"
  ON sold_products
  FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid());

CREATE POLICY "Users can mark their products as sold"
  ON sold_products
  FOR INSERT
  TO authenticated
  WITH CHECK (seller_id = auth.uid());

-- Create function to update sold_count
CREATE OR REPLACE FUNCTION update_sold_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET sold_count = sold_count + 1
  WHERE id = NEW.seller_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update sold_count
CREATE TRIGGER increment_sold_count
  AFTER INSERT ON sold_products
  FOR EACH ROW
  EXECUTE FUNCTION update_sold_count();