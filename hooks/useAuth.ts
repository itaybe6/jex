import { useEffect, useState } from 'react';
import { getToken } from '../lib/secureStorage';
import { router } from 'expo-router';

type AuthUser = { id: string } & Record<string, any>;

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const token = await getToken('access_token');
        setAccessToken(token);
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

  useEffect(() => {
    if (user && accessToken) {
      // Fetch profile after login
    }
  }, [user, accessToken]);

  return { user, loading, accessToken };
}