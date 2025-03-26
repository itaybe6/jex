/*
  # Fix profiles table RLS policies

  1. Changes
    - Add INSERT policy for authenticated users to create their initial profile
    - Ensure users can only create their own profile (id must match auth.uid())

  2. Security
    - Maintains existing RLS policies
    - Adds specific policy for profile creation
*/

-- Add policy to allow authenticated users to create their own profile
CREATE POLICY "Users can create their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);