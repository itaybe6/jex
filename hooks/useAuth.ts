import { useEffect, useState } from 'react';
import { getToken } from '../lib/secureStorage';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const token = await getToken('access_token');
        if (!token) {
          setUser(null);
          setLoading(false);
          return;
        }
        const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
          },
        });
        if (!response.ok) {
          setUser(null);
        } else {
          const data = await response.json();
          setUser(data);
        }
      } catch (e) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  return { user, loading };
}