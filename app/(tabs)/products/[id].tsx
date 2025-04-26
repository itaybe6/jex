import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, MessageCircle } from 'lucide-react-native';
import { TopHeader } from '@/components/TopHeader';
import { SafeAreaView } from 'react-native-safe-area-context';

type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  details?: {
    size?: string;
    clarity?: string;
    color?: string;
    weight?: string;
  };
  profiles: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    phone: string | null;
  };
  created_at: string;
};

export default function ProductScreen() {
  const { id, userId } = useLocalSearchParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          profiles!products_user_id_fkey (
            id,
            full_name,
            avatar_url,
            phone
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setProduct(data);
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContactPress = () => {
    if (product?.profiles?.phone) {
      const phoneNumber = product.profiles.phone.startsWith('0') 
        ? '972' + product.profiles.phone.substring(1) 
        : product.profiles.phone;
      const message = `היי, אני מעוניין במוצר "${product.title}" שפרסמת ב-JEX`;
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      Linking.openURL(whatsappUrl);
    }
  };

  const handleBackPress = () => {
    if (userId) {
      router.push(`/user/${userId}`);
    } else {
      router.back();
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Product not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{product.title}</Text>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.content}>
        <Image source={{ uri: product.image_url }} style={styles.image} />

        <View style={styles.detailsContainer}>
          <Text style={styles.price}>${product.price?.toLocaleString()}</Text>
          <Text style={styles.category}>{product.category}</Text>

          {product.details && (
            <View style={styles.specsContainer}>
              {product.details.weight && (
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Weight:</Text>
                  <Text style={styles.specValue}>{product.details.weight} ct</Text>
                </View>
              )}
              {product.details.size && (
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Size:</Text>
                  <Text style={styles.specValue}>{product.details.size}</Text>
                </View>
              )}
              {product.details.clarity && (
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Clarity:</Text>
                  <Text style={styles.specValue}>{product.details.clarity}</Text>
                </View>
              )}
              {product.details.color && (
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Color:</Text>
                  <Text style={styles.specValue}>{product.details.color}</Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.sellerContainer}>
            <TouchableOpacity 
              style={styles.sellerContent}
              onPress={() => router.push(`/user/${product.profiles.id}`)}
            >
              <Image
                source={{ uri: product.profiles.avatar_url || 'https://www.gravatar.com/avatar/?d=mp' }}
                style={styles.sellerAvatar}
              />
              <View style={styles.sellerInfo}>
                <Text style={styles.sellerName}>{product.profiles.full_name}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {product.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionTitle}>Description</Text>
              <Text style={styles.description}>{product.description}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.contactButton} onPress={handleContactPress}>
        <MessageCircle size={24} color="#fff" strokeWidth={2.5} />
        <Text style={styles.contactButtonText}>Contact via WhatsApp</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  safeArea: {
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    backgroundColor: '#121212',
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
  content: {
    flex: 1,
    backgroundColor: '#121212',
  },
  image: {
    width: '100%',
    height: undefined,
    aspectRatio: 1,
    resizeMode: 'contain',
    backgroundColor: '#1a1a1a',
  },
  detailsContainer: {
    padding: 16,
    backgroundColor: '#121212',
  },
  price: {
    fontSize: 24,
    fontFamily: 'Heebo-Bold',
    color: '#6C5CE7',
    marginBottom: 8,
  },
  category: {
    fontSize: 16,
    fontFamily: 'Heebo-Medium',
    color: '#888',
    marginBottom: 16,
  },
  specsContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  specItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  specLabel: {
    fontSize: 14,
    fontFamily: 'Heebo-Regular',
    color: '#888',
  },
  specValue: {
    fontSize: 14,
    fontFamily: 'Heebo-Medium',
    color: '#fff',
  },
  sellerContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  sellerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: '#2a2a2a',
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontFamily: 'Heebo-Medium',
    color: '#fff',
  },
  descriptionContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  descriptionTitle: {
    fontSize: 18,
    fontFamily: 'Heebo-Bold',
    color: '#fff',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Heebo-Regular',
    color: '#fff',
    lineHeight: 20,
  },
  contactButton: {
    backgroundColor: '#6C5CE7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Heebo-Medium',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Heebo-Regular',
    color: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Heebo-Regular',
    color: '#fff',
  },
}); 