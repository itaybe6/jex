import { supabase } from '@/lib/supabase';

export type Product = {
  id: string;
  type: string;
  category?: string;
  [key: string]: any;
};

export type Filter = {
  id: string;
  user_id: string;
  type: string;
  filter_type: string;
  [key: string]: any;
};

/**
 * בודק אם מוצר מתאים לסינון (כולל טווחים)
 */
export function isMatch(filter: any, product: any): boolean {
  for (const key in filter) {
    if ([
      'id',
      'type',
      'filter_type',
      'user_id',
      'created_at',
      'updated_at',
    ].includes(key)) continue;

    // תמיכה בטווחים
    if (key.endsWith('_from')) {
      const baseKey = key.replace('_from', '');
      if (product[baseKey] === undefined || product[baseKey] < filter[key]) {
        console.log(`FAILED: product[${baseKey}] < filter[${key}] (${product[baseKey]} < ${filter[key]})`);
        return false;
      }
      continue;
    }
    if (key.endsWith('_to')) {
      const baseKey = key.replace('_to', '');
      if (product[baseKey] === undefined || product[baseKey] > filter[key]) {
        console.log(`FAILED: product[${baseKey}] > filter[${key}] (${product[baseKey]} > ${filter[key]})`);
        return false;
      }
      continue;
    }

    const filterValue = filter[key];
    const productValue = product[key];
    // Normalize for case-insensitive and trim
    const norm = (v: any) => typeof v === 'string' ? v.trim().toLowerCase() : v;
    if (Array.isArray(filterValue)) {
      const match = filterValue.map(norm).includes(norm(productValue));
      console.log(`Comparing (array) filter[${key}]=${filterValue} to product[${key}]=${productValue} => ${match}`);
      if (!match) return false;
    } else if (filterValue !== undefined && filterValue !== null && filterValue !== '') {
      const match = norm(filterValue) === norm(productValue);
      console.log(`Comparing filter[${key}]=${filterValue} to product[${key}]=${productValue} => ${match}`);
      if (!match) return false;
    }
  }
  return true;
}

/**
 * מאתר משתמשים עם סינון תואם למוצר חדש, ויוצר עבורם התראה בטבלת notifications
 */
export async function notifyMatchingUsersOnNewProduct(newProduct: Product) {
  console.log('notifyMatchingUsersOnNewProduct called with:', newProduct);
  const { data: filters, error } = await supabase
    .from('notification_preferences')
    .select('*');

  if (error) {
    console.error('Error fetching filters:', error);
    return;
  }
  if (!filters) {
    console.log('No filters found!');
    return;
  }

  console.log('RAW filters:', filters);
  console.log('All notification_preferences:', filters);

  // שליפת שם ותמונת פרופיל של המוכר
  let sellerName = 'Unknown User';
  let sellerAvatar = null;
  if (newProduct.user_id) {
    const { data: sellerProfile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', newProduct.user_id)
      .single();
    if (sellerProfile && sellerProfile.full_name) {
      sellerName = sellerProfile.full_name;
    }
    if (sellerProfile && sellerProfile.avatar_url) {
      sellerAvatar = sellerProfile.avatar_url;
    }
  }

  // שליפת כתובת התמונה הראשית של המוצר מה-DB
  let productImage = null;
  const { data: productImages, error: imgError } = await supabase
    .from('product_images')
    .select('image_url')
    .eq('product_id', newProduct.id)
    .order('id', { ascending: true })
    .limit(1);
  if (productImages && productImages.length > 0) {
    productImage = productImages[0].image_url;
  }
  console.log('productImage:', productImage);

  for (const pref of filters) {
    console.log('User:', pref.user_id, 'Filters:', pref.specific_filters);
    console.log('Raw specific_filters:', pref.specific_filters, 'Type:', typeof pref.specific_filters, 'JSON:', JSON.stringify(pref.specific_filters));
    for (const filter of pref.specific_filters || []) {
      if (filter.filter_type !== 'new_product') continue;
      if (!isMatch(filter, newProduct)) continue;

      console.log('Creating notification for user:', pref.user_id, 'for product:', newProduct);
      const { error: notifError } = await supabase.from('notifications').insert({
        user_id: pref.user_id,
        type: 'new_product',
        product_id: newProduct.id,
        data: {
          message: `New product match: ${newProduct.brand || ''} ${newProduct.model || ''} just listed!`,
          product: newProduct,
          seller_name: sellerName,
          seller_avatar_url: sellerAvatar,
          product_image_url: productImage,
        },
        read: false,
      });
      if (notifError) {
        console.error('Error inserting notification:', notifError, notifError?.message, notifError?.details);
      }
    }
  }
} 