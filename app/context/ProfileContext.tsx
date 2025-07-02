import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabaseApi';

export type Profile = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  title: string | null;
  bio: string | null;
  website: string | null;
  trust_count: number;
  sold_count: number;
  sold_count_aggregate?: { count: number }[];
};

export type Product = {
  id: string;
  title: string;
  price: number;
  category: string;
  product_images?: {
    id: string;
    image_url: string;
  }[];
  status?: string;
};

export type ProductsByCategory = {
  [key: string]: Product[];
};

interface ProfileContextType {
  profile: Profile | null;
  productsByCategory: ProductsByCategory;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType>({
  profile: null,
  productsByCategory: {},
  loading: true,
  refreshProfile: async () => {},
});

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, accessToken } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [productsByCategory, setProductsByCategory] = useState<ProductsByCategory>({});
  const [loading, setLoading] = useState(true);

  const fetchProfileAndProducts = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setProductsByCategory({});
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Fetch profile
      const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=*`, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
        },
      });
      if (!profileRes.ok) throw new Error('Error fetching profile');
      const profileArr = await profileRes.json();
      const profileData = profileArr[0];

      // Fetch completed transactions count
      const txRes = await fetch(`${SUPABASE_URL}/rest/v1/transactions?or=(seller_id.eq.${user.id},buyer_id.eq.${user.id})&status=eq.completed&select=id`, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
        },
      });
      if (!txRes.ok) throw new Error('Error fetching transactions');
      const transactionsCount = await txRes.json();

      setProfile({
        ...profileData,
        sold_count: transactionsCount.length,
        trust_count: typeof profileData.trust_count === 'number' ? profileData.trust_count : 0,
      });

      // Fetch products
      const query = '*,product_images:product_images_product_id_fkey(id,image_url)';
      const url = `${SUPABASE_URL}/rest/v1/products?user_id=eq.${user.id}&select=${encodeURIComponent(query)}&order=created_at.desc`;
      const res = await fetch(url, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
        },
      });
      if (!res.ok) throw new Error('Error fetching products');
      const data = await res.json();
      // Only show products with status 'available' or 'hold'
      const filtered = (data || []).filter((product: Product) => product.status === 'available' || product.status === 'hold');
      // Group products by category
      const grouped = filtered.reduce((acc: ProductsByCategory, product: Product) => {
        if (!acc[product.category]) {
          acc[product.category] = [];
        }
        acc[product.category].push(product);
        return acc;
      }, {} as ProductsByCategory);
      setProductsByCategory(grouped);
    } catch (error) {
      setProfile(null);
      setProductsByCategory({});
    } finally {
      setLoading(false);
    }
  }, [user, accessToken]);

  useEffect(() => {
    if (user) {
      fetchProfileAndProducts();
    } else {
      setProfile(null);
      setProductsByCategory({});
      setLoading(false);
    }
  }, [user, fetchProfileAndProducts]);

  return (
    <ProfileContext.Provider value={{ profile, productsByCategory, loading, refreshProfile: fetchProfileAndProducts }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => useContext(ProfileContext); 