/*
  # Add TrustMark System

  1. New Tables
    - `trust_marks`
      - Tracks trust relationships between users
      - Each record represents one user marking another as trusted
      - Includes timestamps for analytics

  2. Changes
    - Add trust_count to profiles table
    - Add trigger to automatically update trust_count

  3. Security
    - Enable RLS on trust_marks table
    - Add policies for authenticated users
*/

-- Add trust_count to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS trust_count INTEGER DEFAULT 0;

-- Create trust_marks table
CREATE TABLE IF NOT EXISTS trust_marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  truster_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  trusted_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE(truster_id, trusted_id)
);

ALTER TABLE trust_marks ENABLE ROW LEVEL SECURITY;

-- Create policies for trust_marks
CREATE POLICY "Users can view trust marks"
  ON trust_marks
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create trust marks"
  ON trust_marks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = truster_id);

CREATE POLICY "Users can delete their own trust marks"
  ON trust_marks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = truster_id);

-- Create function to update trust_count
CREATE OR REPLACE FUNCTION update_trust_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles
    SET trust_count = trust_count + 1
    WHERE id = NEW.trusted_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles
    SET trust_count = trust_count - 1
    WHERE id = OLD.trusted_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for trust_count updates
CREATE TRIGGER trust_mark_added
  AFTER INSERT ON trust_marks
  FOR EACH ROW
  EXECUTE FUNCTION update_trust_count();

CREATE TRIGGER trust_mark_removed
  AFTER DELETE ON trust_marks
  FOR EACH ROW
  EXECUTE FUNCTION update_trust_count();