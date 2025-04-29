/*
  # Product Specifications Restructure

  1. Changes
    - Update products table with new fields
    - Create specialized tables for different product types
    - Add foreign key relationships
    - Set up appropriate indexes

  2. Security
    - Maintain existing RLS policies
    - Add appropriate policies for new tables
*/

-- Update products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'ILS',
ADD COLUMN IF NOT EXISTS thumbnail_url text,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create watch_specs table
CREATE TABLE IF NOT EXISTS watch_specs (
  product_id uuid PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  brand text,
  model text,
  diameter numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create diamond_specs table
CREATE TABLE IF NOT EXISTS diamond_specs (
  product_id uuid PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  shape text,
  weight numeric,
  color text,
  clarity text,
  cut_grade text,
  certificate text,
  origin text,
  lab_grown_type text,
  treatment_type text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create gem_specs table
CREATE TABLE IF NOT EXISTS gem_specs (
  product_id uuid PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  type text,
  origin text,
  certification text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create jewelry_specs table
CREATE TABLE IF NOT EXISTS jewelry_specs (
  product_id uuid PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  diamond_size_from numeric,
  diamond_size_to numeric,
  color text,
  clarity text,
  gold_color text,
  material text,
  gold_karat text,
  side_stones boolean,
  cut_grade text,
  certification text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE watch_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE diamond_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gem_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE jewelry_specs ENABLE ROW LEVEL SECURITY;

-- Create policies for watch_specs
CREATE POLICY "Anyone can view watch specs"
  ON watch_specs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their own watch specs"
  ON watch_specs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = watch_specs.product_id
      AND products.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = watch_specs.product_id
      AND products.user_id = auth.uid()
    )
  );

-- Create policies for diamond_specs
CREATE POLICY "Anyone can view diamond specs"
  ON diamond_specs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their own diamond specs"
  ON diamond_specs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = diamond_specs.product_id
      AND products.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = diamond_specs.product_id
      AND products.user_id = auth.uid()
    )
  );

-- Create policies for gem_specs
CREATE POLICY "Anyone can view gem specs"
  ON gem_specs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their own gem specs"
  ON gem_specs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = gem_specs.product_id
      AND products.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = gem_specs.product_id
      AND products.user_id = auth.uid()
    )
  );

-- Create policies for jewelry_specs
CREATE POLICY "Anyone can view jewelry specs"
  ON jewelry_specs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their own jewelry specs"
  ON jewelry_specs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = jewelry_specs.product_id
      AND products.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = jewelry_specs.product_id
      AND products.user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_watch_specs_updated_at
  BEFORE UPDATE ON watch_specs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_diamond_specs_updated_at
  BEFORE UPDATE ON diamond_specs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gem_specs_updated_at
  BEFORE UPDATE ON gem_specs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jewelry_specs_updated_at
  BEFORE UPDATE ON jewelry_specs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 