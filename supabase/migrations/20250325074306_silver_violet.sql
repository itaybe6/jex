/*
  # Add Saved Searches and Notifications

  1. New Tables
    - `saved_searches`: Stores user search preferences
    - `notifications`: Stores user notifications
    
  2. Changes
    - Add notification triggers for new products
    - Add policies for saved searches and notifications

  3. Security
    - Enable RLS on new tables
    - Add appropriate policies
*/

-- Create saved_searches table
CREATE TABLE IF NOT EXISTS saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  categories text[] DEFAULT '{}',
  cuts text[] DEFAULT '{}',
  min_price numeric,
  max_price numeric,
  min_weight numeric,
  max_weight numeric,
  clarity text[],
  color text[]
);

ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  read boolean DEFAULT false,
  data jsonb NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for saved_searches
CREATE POLICY "Users can manage their saved searches"
  ON saved_searches
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for notifications
CREATE POLICY "Users can view their notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can mark their notifications as read"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to check if a product matches a saved search
CREATE OR REPLACE FUNCTION matches_saved_search(
  product_data jsonb,
  search saved_searches
) RETURNS boolean AS $$
BEGIN
  -- Check category match
  IF array_length(search.categories, 1) > 0 AND 
     NOT (product_data->>'category')::text = ANY(search.categories) THEN
    RETURN false;
  END IF;

  -- Check cut match for diamonds
  IF array_length(search.cuts, 1) > 0 AND 
     NOT (product_data->'details'->>'cut')::text = ANY(search.cuts) THEN
    RETURN false;
  END IF;

  -- Check price range
  IF search.min_price IS NOT NULL AND 
     (product_data->>'price')::numeric < search.min_price THEN
    RETURN false;
  END IF;

  IF search.max_price IS NOT NULL AND 
     (product_data->>'price')::numeric > search.max_price THEN
    RETURN false;
  END IF;

  -- Check weight range for diamonds
  IF search.min_weight IS NOT NULL AND 
     (product_data->'details'->>'weight')::numeric < search.min_weight THEN
    RETURN false;
  END IF;

  IF search.max_weight IS NOT NULL AND 
     (product_data->'details'->>'weight')::numeric > search.max_weight THEN
    RETURN false;
  END IF;

  -- Check clarity
  IF array_length(search.clarity, 1) > 0 AND 
     NOT (product_data->'details'->>'clarity')::text = ANY(search.clarity) THEN
    RETURN false;
  END IF;

  -- Check color
  IF array_length(search.color, 1) > 0 AND 
     NOT (product_data->'details'->>'color')::text = ANY(search.color) THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to create notifications for matching saved searches
CREATE OR REPLACE FUNCTION create_product_notifications()
RETURNS TRIGGER AS $$
DECLARE
  search saved_searches;
  product_json jsonb;
BEGIN
  -- Convert the new product to JSON
  product_json = row_to_json(NEW)::jsonb;

  -- Find matching saved searches and create notifications
  FOR search IN
    SELECT * FROM saved_searches
    WHERE user_id != NEW.user_id  -- Don't notify the product creator
  LOOP
    IF matches_saved_search(product_json, search) THEN
      INSERT INTO notifications (
        user_id,
        type,
        data,
        product_id
      ) VALUES (
        search.user_id,
        'new_product',
        jsonb_build_object(
          'product_id', NEW.id,
          'product_title', NEW.title,
          'product_image', NEW.image_url,
          'product_price', NEW.price,
          'seller_id', NEW.user_id
        ),
        NEW.id
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new product notifications
CREATE TRIGGER product_notification_trigger
  AFTER INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION create_product_notifications();