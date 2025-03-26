/*
  # Update Notification Preferences Structure

  1. Changes
    - Add specific_filters array to notification_preferences table
    - Each filter contains exact diamond specifications
    - Add indexes for better query performance

  2. Security
    - Maintain existing RLS policies
*/

ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS specific_filters jsonb[] DEFAULT '{}';

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_notification_preferences_specific_filters 
ON notification_preferences USING gin(specific_filters);

-- Update function to match specific filters
CREATE OR REPLACE FUNCTION matches_saved_search(
  product_data jsonb,
  specific_filters jsonb[]
) RETURNS boolean AS $$
DECLARE
  filter jsonb;
BEGIN
  IF specific_filters IS NULL OR array_length(specific_filters, 1) = 0 THEN
    RETURN false;
  END IF;

  FOR filter IN SELECT unnest(specific_filters)
  LOOP
    IF (
      (filter->>'cut' IS NULL OR filter->>'cut' = product_data->'details'->>'cut') AND
      (filter->>'clarity' IS NULL OR filter->>'clarity' = product_data->'details'->>'clarity') AND
      (filter->>'color' IS NULL OR filter->>'color' = product_data->'details'->>'color') AND
      (filter->>'weight' IS NULL OR filter->>'weight' = product_data->'details'->>'weight')
    ) THEN
      RETURN true;
    END IF;
  END LOOP;

  RETURN false;
END;
$$ LANGUAGE plpgsql;