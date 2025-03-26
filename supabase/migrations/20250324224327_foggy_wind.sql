/*
  # Add Trust System with Safe Policy Creation

  1. Changes
    - Add trust_count column to profiles table
    - Create trust_marks table for tracking trust relationships
    - Add RLS policies with existence checks
    - Add triggers for automatic trust_count updates

  2. Security
    - Enable RLS on trust_marks table
    - Add policies for viewing, creating, and deleting trust marks
    - Ensure proper user authorization checks
*/

-- Add trust_count to profiles if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'trust_count'
  ) THEN
    ALTER TABLE profiles ADD COLUMN trust_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Create trust_marks table if not exists
CREATE TABLE IF NOT EXISTS trust_marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  truster_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  trusted_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE(truster_id, trusted_id)
);

-- Enable RLS
ALTER TABLE trust_marks ENABLE ROW LEVEL SECURITY;

-- Safely create policies
DO $$ 
BEGIN
  -- Check and create select policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'trust_marks' 
    AND policyname = 'Users can view trust marks'
  ) THEN
    CREATE POLICY "Users can view trust marks"
      ON trust_marks
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  -- Check and create insert policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'trust_marks' 
    AND policyname = 'Users can create trust marks'
  ) THEN
    CREATE POLICY "Users can create trust marks"
      ON trust_marks
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = truster_id);
  END IF;

  -- Check and create delete policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'trust_marks' 
    AND policyname = 'Users can delete their own trust marks'
  ) THEN
    CREATE POLICY "Users can delete their own trust marks"
      ON trust_marks
      FOR DELETE
      TO authenticated
      USING (auth.uid() = truster_id);
  END IF;
END $$;

-- Create or replace function to update trust_count
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

-- Safely create triggers
DO $$
BEGIN
  -- Drop existing triggers if they exist
  DROP TRIGGER IF EXISTS trust_mark_added ON trust_marks;
  DROP TRIGGER IF EXISTS trust_mark_removed ON trust_marks;

  -- Create new triggers
  CREATE TRIGGER trust_mark_added
    AFTER INSERT ON trust_marks
    FOR EACH ROW
    EXECUTE FUNCTION update_trust_count();

  CREATE TRIGGER trust_mark_removed
    AFTER DELETE ON trust_marks
    FOR EACH ROW
    EXECUTE FUNCTION update_trust_count();
END $$;