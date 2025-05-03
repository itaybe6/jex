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

export async function createProduct(data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create product');
  return res.json();
}

export async function signUp(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, password }),
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