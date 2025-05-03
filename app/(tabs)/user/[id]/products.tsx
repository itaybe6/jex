import { View, Text, StyleSheet, FlatList, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { getToken } from '../../../../lib/secureStorage';

type Product = {
  id: string;
  title: string;
  price: number;
  image_url: string;
  profiles: {
    full_name: string;
    avatar_url: string;
  };
};

const fetchProducts = async (userId: string, from: number = 0, to: number = 10): Promise<Product[]> => {
  try {
    const token = await getToken('access_token');
    if (!token) throw new Error('No access token');

    const response = await fetch(
      `${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/products?user_id=eq.${userId}&status=eq.available&select=*,profiles(id,full_name,avatar_url)&order=created_at.desc&limit=${to - from}&offset=${from}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export default function UserProductsPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const data = await fetchProducts(id);
        setProducts(data);
      } catch (err) {
        setError('Failed to load products');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [id]);

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <Image
        source={{ uri: item.image_url || 'https://via.placeholder.com/150' }}
        style={styles.productImage}
      />
      <View style={styles.productInfo}>
        <Text style={styles.productTitle}>{item.title}</Text>
        <Text style={styles.productPrice}>₪{item.price.toLocaleString()}</Text>
        <Text style={styles.sellerName}>{item.profiles.full_name}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6C5CE7" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  listContainer: {
    padding: 16,
  },
  productCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  productInfo: {
    padding: 16,
  },
  productTitle: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
    marginBottom: 8,
  },
  productPrice: {
    color: '#6C5CE7',
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    marginBottom: 8,
  },
  sellerName: {
    color: '#888',
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
    textAlign: 'center',
  },
}); 