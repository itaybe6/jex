import { createClient } from '@supabase/supabase-js';

export const getDealsByCategory = async (productType: string) => {
  try {
    const response = await fetch(`https://yjmppxihvkfcnptdvevi.supabase.co/rest/v1/deals?product_type=eq.${productType}`, {
      headers: {
        apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', // שים את ה-ANON KEY שלך
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', // אותו הדבר
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch deals');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching deals by category:', error);
    return [];
  }
};

export const supabase = createClient(
  'https://yjmppxihvkfcnptdvevi.supabase.co', // כתובת ה-Supabase שלך
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqbXBweGlodmtmY25wdGR2ZXZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3NjYzNTgsImV4cCI6MjA1NzM0MjM1OH0.6r_Io46qV2xhDX7Oy1MxEPhsxwqn_-AqEMUNSO6_Wbs' // המפתח שלך
);