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
        return false;
      }
      continue;
    }
    if (key.endsWith('_to')) {
      const baseKey = key.replace('_to', '');
      if (product[baseKey] === undefined || product[baseKey] > filter[key]) {
        return false;
      }
      continue;
    }

    // ערך בודד או מערך
    const filterValue = filter[key];
    const productValue = product[key];
    if (Array.isArray(filterValue)) {
      if (!filterValue.includes(productValue)) return false;
    } else if (filterValue !== undefined && filterValue !== null && filterValue !== '') {
      if (filterValue !== productValue) return false;
    }
  }
  return true;
}

/**
 * מאתר משתמשים עם סינון תואם למוצר חדש, ויוצר עבורם התראה בטבלת notifications
 */
export async function notifyMatchingUsersOnNewProduct(newProduct: Product) {
  const { data: filters, error } = await supabase
    .from('notification_preferences')
    .select('user_id, specific_filters');

  if (error) {
    console.error('Error fetching filters:', error);
    return;
  }
  if (!filters) return;

  for (const pref of filters) {
    const userId = pref.user_id;
    for (const filter of pref.specific_filters || []) {
      if (filter.filter_type !== 'new_product') continue;
      if (!isMatch(filter, newProduct)) continue;

      const message = `New product match: ${newProduct.brand || ''} ${newProduct.model || ''} just listed!`;
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'new_product',
        product_id: newProduct.id,
        data: {
          message,
          product: newProduct,
        },
        read: false,
      });
    }
  }
} 