import { Database } from './supabase';

type Tables = Database['public']['Tables'];
type ProductRow = Tables['products']['Row'];
type WatchSpecsRow = Tables['watch_specs']['Row'];
type DiamondSpecsRow = Tables['diamond_specs']['Row'];
type GemSpecsRow = Tables['gem_specs']['Row'];
type JewelrySpecsRow = Tables['jewelry_specs']['Row'];
type ProfileRow = Tables['profiles']['Row'];

type ProductImage = {
  image_url: string;
  order?: number;
};

type SpecsType = 
  | Omit<WatchSpecsRow, 'product_id' | 'created_at' | 'updated_at'>
  | Omit<DiamondSpecsRow, 'product_id' | 'created_at' | 'updated_at'>
  | Omit<GemSpecsRow, 'product_id' | 'created_at' | 'updated_at'>
  | Omit<JewelrySpecsRow, 'product_id' | 'created_at' | 'updated_at'>;

export type Product = Omit<ProductRow, 'created_at' | 'updated_at'> & {
  created_at: string;
  updated_at?: string;
  thumbnail_url?: string | null;
  profiles: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    phone: string | null;
  };
  specs?: SpecsType | null;
  product_images?: ProductImage[];
};

export type ProductsByCategory = {
  [key: string]: Product[];
};

export type ProductFormState = Omit<Product, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'profiles' | 'specs' | 'product_images'> & {
  specs?: SpecsType | null;
  product_images?: ProductImage[];
}; 