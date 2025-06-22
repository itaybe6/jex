-- Enable necessary extensions first
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;

-- Grant usage on the vault schema to the postgres role, which runs the trigger
GRANT USAGE ON SCHEMA vault TO postgres, service_role;
-- Grant select on the decrypted_secrets view
GRANT SELECT ON vault.decrypted_secrets TO postgres, service_role;


-- Create or replace the function to handle notification inserts
CREATE OR REPLACE FUNCTION handle_notification_insert()
RETURNS TRIGGER AS $$
DECLARE
  service_key text;
BEGIN
  -- Fetch the service role key from Supabase Vault
  -- This is more secure and the recommended way.
  SELECT decrypted_secret INTO service_key 
  FROM vault.decrypted_secrets -- CORRECTED SCHEMA: from "supabase_vault" to "vault"
  WHERE name = 'SERVICE_ROLE_KEY';

  -- If the key is not found, raise a clear exception
  IF service_key IS NULL THEN
    RAISE EXCEPTION 'Secret not found: SERVICE_ROLE_KEY. Please set it in your project''s Vault settings.';
  END IF;

  -- Ensure you have replaced 'your-project-ref' with your actual project reference
  PERFORM
    net.http_post(
      url := 'https://your-project-ref.supabase.co/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_key
      ),
      body := jsonb_build_object(
        'record', row_to_json(NEW),
        'eventType', TG_OP
      )
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger to ensure it uses the updated function
DROP TRIGGER IF EXISTS notification_insert_trigger ON notifications;
CREATE TRIGGER notification_insert_trigger
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION handle_notification_insert(); 