import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabaseApi';

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
  console.log('--- isMatch called ---');
  console.log('Filter:', JSON.stringify(filter));
  console.log('Product:', JSON.stringify(product));
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
      console.log(`Comparing (array) filter[${key}]=${JSON.stringify(filterValue)} to product[${key}]=${productValue} => ${match}`);
      if (!match) return false;
    } else if (filterValue !== undefined && filterValue !== null && filterValue !== '') {
      const match = norm(filterValue) === norm(productValue);
      console.log(`Comparing filter[${key}]=${filterValue} to product[${key}]=${productValue} => ${match}`);
      if (!match) return false;
    }
  }
  console.log('MATCHED!');
  return true;
}

/**
 * מאתר משתמשים עם סינון תואם למוצר חדש, ויוצר עבורם התראה בטבלת notifications
 * @param newProduct המוצר החדש
 * @param accessToken הטוקן של המשתמש (ל-RLS)
 */
export async function notifyMatchingUsersOnNewProduct(newProduct: Product, accessToken: string) {
  const filtersRes = await fetch(`${SUPABASE_URL}/rest/v1/notification_preferences`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  const filters = await filtersRes.json();
  if (!filters) {
    console.log('No filters found!');
    return;
  }

  // שליפת שם ותמונת פרופיל של המוכר
  let sellerName = 'Unknown User';
  let sellerAvatar = null;
  if (newProduct.user_id) {
    const sellerProfileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=full_name,avatar_url&eq.id.eq.${newProduct.user_id}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    const sellerProfile = await sellerProfileRes.json();
    if (sellerProfile && sellerProfile.length > 0 && sellerProfile[0].full_name) {
      sellerName = sellerProfile[0].full_name;
    }
    if (sellerProfile && sellerProfile.length > 0 && sellerProfile[0].avatar_url) {
      sellerAvatar = sellerProfile[0].avatar_url;
    }
  }

  // שליפת כתובת התמונה הראשית של המוצר מה-DB
  let productImage = null;
  const productImagesRes = await fetch(`${SUPABASE_URL}/rest/v1/product_images?select=image_url&eq.product_id.eq.${newProduct.id}&order.id.asc&limit.1`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  const productImages = await productImagesRes.json();
  if (productImages && productImages.length > 0) {
    productImage = productImages[0].image_url;
  }

  for (const pref of filters) {
    for (const filter of pref.specific_filters || []) {
      if (filter.filter_type !== 'new_product') continue;
      if (!isMatch(filter, newProduct)) continue;

      console.log('Creating notification for user:', pref.user_id, 'for product:', newProduct);
      const notifRes = await fetch(`${SUPABASE_URL}/rest/v1/notifications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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
        }),
      });
      const notifError = await notifRes.json();
      if (notifError?.error) {
        console.error('Error inserting notification:', notifError, notifError?.message, notifError?.details);
      }
    }
  }
} 