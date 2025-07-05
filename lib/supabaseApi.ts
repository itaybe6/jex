import { supabase } from './supabase'; // Assuming you have a supabase client export

export const SUPABASE_URL = 'https://yjmppxihvkfcnptdvevi.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqbXBweGlodmtmY25wdGR2ZXZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3NjYzNTgsImV4cCI6MjA1NzM0MjM1OH0.6r_Io46qV2xhDX7Oy1MxEPhsxwqn_-AqEMUNSO6_Wbs';

const headers = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
};

export async function getProducts() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*,product_images(id,image_url),profiles!products_user_id_fkey(id,full_name,avatar_url)&order=created_at.desc`, {
    headers,
  });
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}

export async function createProduct(data, accessToken) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create product');
  return res.json();
}

export async function signUp(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ 
      email, 
      password,
      data: {
        email_confirm: false
      }
    }),
  });
  if (!res.ok) throw new Error('Failed to sign up');
  return res.json();
}

export async function signIn(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error('Failed to sign in');
  return res.json();
}

export async function getProfile(user_id) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${user_id}`, {
    method: 'GET',
    headers,
  });
  if (!res.ok) throw new Error('Failed to fetch profile');
  const data = await res.json();
  return data[0] || null;
}

/**
 * Fetch all products from Supabase, with optional pagination.
 * @param {number} [from=0] - The starting index for pagination.
 * @param {number} [to=19] - The ending index for pagination.
 * @returns {Promise<any[]>} Array of products with images and profile info.
 */
export async function fetchProducts(from = 0, to = 19) {
  const url = `${SUPABASE_URL}/rest/v1/products?select=*,product_images(id,image_url),profiles!products_user_id_fkey(id,full_name,avatar_url)&order=created_at.desc&offset=${from}&limit=${to - from + 1}`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}

/**
 * Fetch deals of the day for a given category that are still valid (expires_at > now()).
 * @param {string} category - The product_type/category to filter by.
 * @returns {Promise<any[]>} Array of deals with product info.
 */
export async function getDealsByCategory(category) {
  const now = new Date().toISOString();
  const url = `${SUPABASE_URL}/rest/v1/deal_of_the_day?product_type=eq.${category}&expires_at=gt.${now}&select=*,products(*,product_images(id,image_url))`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error('Failed to fetch deals');
  return res.json();
}

/**
 * Fetch all deals of the day that are still valid (expires_at > now()).
 * @returns {Promise<any[]>} Array of deals with product info.
 */
export async function getAllDeals() {
  const now = new Date().toISOString();
  const url = `${SUPABASE_URL}/rest/v1/deal_of_the_day?expires_at=gt.${now}&select=*,products(*)`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error('Failed to fetch all deals');
  return res.json();
}

/**
 * Fetch unseen deals of the day for the current user, grouped by product_type.
 * @param {string} userId - The user ID to filter viewers.
 * @param {string} accessToken - The user's access token.
 * @returns {Promise<Record<string, number>>} Object mapping product_type to unseen count.
 */
export async function getUnseenDealsCountByCategory(userId, accessToken) {
  const now = new Date().toISOString();
  const url = `${SUPABASE_URL}/rest/v1/deal_of_the_day?expires_at=gt.${now}&select=id,product_type,viewers`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
    },
  });
  if (!res.ok) throw new Error('Failed to fetch unseen deals');
  const data = await res.json();
  const categoriesWithUnseen = {};
  data.forEach(deal => {
    if (!deal.viewers || !deal.viewers.includes(userId)) {
      if (!categoriesWithUnseen[deal.product_type]) {
        categoriesWithUnseen[deal.product_type] = 0;
      }
      categoriesWithUnseen[deal.product_type]++;
    }
  });
  return categoriesWithUnseen;
}

/**
 * Creates a new notification in the database and immediately triggers a push notification.
 * This is the new, recommended way to send push notifications.
 *
 * @param notificationData The notification data to be inserted.
 * @returns The created notification record.
 */
export async function createAndSendNotification(notificationData: {
  user_id: string;
  type: string;
  data: Record<string, any>;
  product_id?: string;
}) {
  // 1. Insert the notification into the database
  const { data: newNotification, error: insertError } = await supabase
    .from('notifications')
    .insert({
      ...notificationData,
      read: false,
      is_action_done: false,
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error creating notification:', insertError);
    throw new Error('Failed to create notification in the database.');
  }

  if (!newNotification) {
    throw new Error('Failed to get the created notification record back.');
  }

  // 2. Call the RPC function to trigger the push notification for the newly created record.
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('trigger_push_notification', {
      notification_id: newNotification.id,
    });

    if (rpcError) {
      // It's important to handle this error, but we don't re-throw it
      // because the primary action (creating the notification) succeeded.
      // The user will still see the notification in their app's notification center.
      console.error(`Failed to trigger push notification for ${newNotification.id}:`, rpcError.message);
    } else {
      console.log('Push notification trigger successful:', rpcData);
    }
  } catch (e) {
      console.error('An unexpected error occurred while calling the RPC:', e);
  }


  return newNotification;
}

/**
 * Example of how to use the new function.
 * You would call this from your application logic where you previously only inserted into the DB.
 */
async function exampleUsage(userId: string) {
    try {
        await createAndSendNotification({
            user_id: userId,
            type: 'test_notification',
            data: {
                message: 'This is a test notification sent via the new RPC method!',
            },
        });
    } catch (error) {
        // Handle any errors that occurred during the process
        console.error('The notification process failed:', error);
    }
} 