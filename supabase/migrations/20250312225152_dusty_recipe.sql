/*
  # Add website field and fix storage policies

  1. Changes
    - Add website column to profiles table
    - Create avatars bucket if not exists
    - Add storage policies with existence checks
*/

-- Add website column
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS website text;

-- Create storage bucket for avatars if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Add storage policies with existence checks
DO $$ 
BEGIN
    -- Check and create public access policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Public Access for avatars'
    ) THEN
        CREATE POLICY "Public Access for avatars"
        ON storage.objects FOR SELECT
        TO public
        USING (bucket_id = 'avatars');
    END IF;

    -- Check and create upload policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Authenticated users can upload avatars'
    ) THEN
        CREATE POLICY "Authenticated users can upload avatars"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'avatars');
    END IF;

    -- Check and create update policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Users can update own avatars'
    ) THEN
        CREATE POLICY "Users can update own avatars"
        ON storage.objects FOR UPDATE
        TO authenticated
        USING (
            bucket_id = 'avatars' 
            AND (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;

    -- Check and create delete policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Users can delete own avatars'
    ) THEN
        CREATE POLICY "Users can delete own avatars"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (
            bucket_id = 'avatars'
            AND (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;
END $$;