/*
  # Add phone field to profiles table

  1. Changes
    - Add phone column to profiles table for storing user phone numbers
    - Make the column optional to maintain compatibility with existing profiles
    - Add phone field to user metadata during registration

  2. Security
    - Maintains existing RLS policies
*/

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS phone text;