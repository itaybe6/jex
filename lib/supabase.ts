import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://yjmppxihvkfcnptdvevi.supabase.co', // כתובת ה-Supabase שלך
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqbXBweGlodmtmY25wdGR2ZXZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3NjYzNTgsImV4cCI6MjA1NzM0MjM1OH0.6r_Io46qV2xhDX7Oy1MxEPhsxwqn_-AqEMUNSO6_Wbs' // המפתח שלך
);