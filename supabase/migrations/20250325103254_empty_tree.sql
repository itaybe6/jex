/*
  # Add Diamond Requests Feature

  1. New Tables
    - `diamond_requests`
      - Stores user requests for specific diamonds
      - Includes cut, weight, clarity, and color preferences
      - Links to user profiles
    - Enable RLS with appropriate policies

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create diamond_requests table
CREATE TABLE IF NOT EXISTS diamond_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  cut text NOT NULL,
  min_weight numeric NOT NULL,
  max_weight numeric NOT NULL,
  clarity text NOT NULL,
  color text NOT NULL,
  status text DEFAULT 'active',
  expires_at timestamptz DEFAULT (now() + interval '30 days')
);

-- Enable RLS
ALTER TABLE diamond_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view diamond requests"
  ON diamond_requests
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own requests"
  ON diamond_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own requests"
  ON diamond_requests
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own requests"
  ON diamond_requests
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

/*
  # Schema Updates

  1. Updates
    - Add phone field to profiles table
    - Links to user profiles
*/

-- Add phone field to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;