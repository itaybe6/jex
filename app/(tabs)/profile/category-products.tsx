import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabaseApi';
import { useAuth } from '@/hooks/useAuth';

const PAGE_SIZE = 20;

export default function CategoryProductsScreen() {
  const params = useLocalSearchParams();
  const category = typeof params.category === 'string' ? params.category : '';
  const userId = typeof params.userId === 'string' ? params.userId : '';
  const { accessToken } = useAuth();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const fetchProducts = useCallback(async (reset = false) => {
    if (!userId || !category) return;
    if (!reset && loadingMore) return;
    if (!reset && !hasMore) return;
    if (reset) {
      setLoading(true);
      setPage(0);
    } else {
      setLoadingMore(true);
    }
    const from = reset ? 0 : page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    try {
      const headers = {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };
      const url = `${SUPABASE_URL}/rest/v1/products?user_id=eq.${userId}&category=eq.${encodeURIComponent(category)}&status=eq.available&select=*,product_images(id,image_url),profiles!products_user_id_fkey(id,full_name,avatar_url)&order=created_at.desc&offset=${from}&limit=${PAGE_SIZE}`;
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      if (reset) {
        setProducts(data || []);
        setHasMore((data?.length || 0) === PAGE_SIZE);
      } else {
        setProducts(prev => [...prev, ...(data || [])]);
        setHasMore((data?.length || 0) === PAGE_SIZE);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      if (reset) setProducts([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      if (reset) setPage(1);
      else setPage(prev => prev + 1);
    }
  }, [userId, category, page, loadingMore, hasMore, accessToken]);

  useEffect(() => {
    fetchProducts(true);
  }, [userId, category]);

  const handleBack = () => {
    // אם userId קיים ➔ חזור ל-/user/[id], אחרת ל-/tabs/profile
    if (userId && typeof userId === 'string') {
      router.replace({ pathname: '/user/[id]', params: { id: userId } });
    } else {
      router.replace({ pathname: '/(tabs)/profile' });
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const imageUrl = item.product_images?.[0]?.image_url || 'https://via.placeholder.com/60';
    
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => router.push({
          pathname: '/profile/product/' + item.id,
          params: { userId }
        })}
      >
        <Image source={{ uri: imageUrl }} style={styles.productImage} />
        <View style={{ flex: 1, marginLeft: 14, justifyContent: 'center' }}>
          <Text style={styles.productTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.price}>${item.price}</Text>
          <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
     
      {loading ? (
        <ActivityIndicator color="#6C5CE7" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={products}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 40 }}
          onEndReached={() => {
            if (hasMore && !loadingMore) fetchProducts();
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMore ? <ActivityIndicator color="#6C5CE7" /> : null}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    backgroundColor: '#1a1a1a',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Heebo-Bold',
    flex: 1,
    color: '#fff',
  },
  card: {
    backgroundColor: '#23232b',
    borderRadius: 14,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: '#292929',
  },
  productImage: {
    width: 54,
    height: 54,
    borderRadius: 8,
    backgroundColor: '#333',
    marginRight: 0,
  },
  productTitle: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Heebo-Bold',
  },
  price: {
    fontSize: 14,
    color: '#6C5CE7',
    fontFamily: 'Heebo-Medium',
  },
  date: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'Heebo-Regular',
  },
}); 