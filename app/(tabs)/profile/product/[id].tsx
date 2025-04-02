import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { ChevronRight } from 'lucide-react-native';

type ProductDetails = {
  id: string;
  title: string;
  price: number;
  image_url: string;
  description: string;
  user_id: string;
  details: {
    weight?: string;
    clarity?: string;
    color?: string;
    cut?: string;
    [key: string]: string | undefined;
  } | null;
  category: string;
};

export default function ProductScreen() {
  const params = useLocalSearchParams();
  const productId = typeof params.id === 'string' ? params.id : '';
  const { user } = useAuth();
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAsSold, setMarkingAsSold] = useState(false);

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('מוצר לא נמצא');

      setProduct(data);
    } catch (error: any) {
      console.error('Error fetching product:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsSold = async () => {
    if (!product || !user) return;

    try {
      setMarkingAsSold(true);

      const { data: soldData, error: soldError } = await supabase
        .from('sold_products')
        .insert([{
          product_id: product.id,
          seller_id: user.id,
          price: product.price
        }])
        .select()
        .single();

      if (soldError) {
        console.error('Error marking product as sold:', soldError);
        throw new Error('אירעה שגיאה בסימון המוצר כנמכר');
      }

      if (!soldData) {
        throw new Error('לא הצלחנו לסמן את המוצר כנמכר');
      }

      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id)
        .eq('user_id', user.id);

      if (deleteError) {
        await supabase
          .from('sold_products')
          .delete()
          .eq('id', soldData.id);
          
        throw new Error('אירעה שגיאה במחיקת המוצר מהקטלוג');
      }

      Alert.alert(
        'הצלחה',
        'המוצר סומן כנמכר והוסר מהקטלוג',
        [
          {
            text: 'אישור',
            onPress: () => router.replace(`/(tabs)/profile`)
          }
        ]
      );
    } catch (error: any) {
      console.error('Error in handleMarkAsSold:', error);
      Alert.alert('שגיאה', error.message || 'אירעה שגיאה בסימון המוצר כנמכר');
    } finally {
      setMarkingAsSold(false);
    }
  };

  const confirmMarkAsSold = () => {
    if (!product || !user) return;
    
    Alert.alert(
      'סימון מוצר כנמכר',
      'האם אתה בטוח שברצונך לסמן מוצר זה כנמכר? פעולה זו תסיר את המוצר מהקטלוג.',
      [
        {
          text: 'ביטול',
          style: 'cancel'
        },
        {
          text: 'אישור',
          onPress: handleMarkAsSold,
          style: 'destructive'
        }
      ]
    );
  };

  const handleBackToSeller = () => {
    if (product) {
      router.push(`/user/${product.user_id}`);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'מוצר לא נמצא'}</Text>
      </View>
    );
  }

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString()}`;
  };

  const renderDetails = () => {
    if (!product.details) return null;

    const detailsToShow = [
      { label: 'משקל', value: product.details.weight ? `${product.details.weight} קראט` : undefined },
      { label: 'ניקיון', value: product.details.clarity },
      { label: 'צבע', value: product.details.color },
      { label: 'חיתוך', value: product.details.cut },
    ].filter(detail => detail.value);

    if (detailsToShow.length === 0) return null;

    return (
      <View style={styles.detailsContainer}>
        <Text style={styles.detailsTitle}>מפרט טכני</Text>
        <View style={styles.detailsGrid}>
          {detailsToShow.map((detail, index) => (
            <View key={index} style={styles.detailItem}>
              <Text style={styles.detailLabel}>{detail.label}</Text>
              <Text style={styles.detailValue}>{detail.value}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const isOwner = user?.id === product.user_id;

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: product.image_url }} style={styles.image} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{product.title}</Text>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
        </View>

        <View style={styles.categoryContainer}>
          <Text style={styles.categoryLabel}>קטגוריה:</Text>
          <Text style={styles.categoryValue}>{product.category}</Text>
        </View>

        <Text style={styles.description}>{product.description}</Text>

        {renderDetails()}

        {isOwner && (
          <TouchableOpacity
            style={[styles.soldButton, markingAsSold && styles.soldButtonDisabled]}
            onPress={confirmMarkAsSold}
            disabled={markingAsSold}
          >
            <Text style={styles.soldButtonText}>
              {markingAsSold ? 'מסמן כנמכר...' : 'סמן כנמכר'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

// Add navigation options to hide the header
ProductScreen.getNavigation = () => {
  return (
    <Stack.Screen
      options={{
        headerShown: false
      }}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    fontFamily: 'Heebo-Regular',
  },
  image: {
    width: '100%',
    height: 300,
    backgroundColor: '#2a2a2a',
  },
  content: {
    padding: 20,
    backgroundColor: '#1a1a1a',
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Heebo-Bold',
    marginBottom: 8,
    textAlign: 'right',
    color: '#fff',
  },
  price: {
    fontSize: 20,
    color: '#007AFF',
    fontFamily: 'Heebo-Bold',
    textAlign: 'right',
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 16,
    backgroundColor: '#2a2a2a',
    padding: 8,
    borderRadius: 8,
  },
  categoryLabel: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'Heebo-Regular',
    marginLeft: 8,
  },
  categoryValue: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'Heebo-Medium',
  },
  description: {
    fontSize: 16,
    color: '#888',
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'right',
    fontFamily: 'Heebo-Regular',
  },
  detailsContainer: {
    marginBottom: 24,
  },
  detailsTitle: {
    fontSize: 18,
    fontFamily: 'Heebo-Bold',
    marginBottom: 16,
    textAlign: 'right',
    color: '#fff',
  },
  detailsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 16,
  },
  detailItem: {
    width: '45%',
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 8,
    alignItems: 'flex-end',
  },
  detailLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
    fontFamily: 'Heebo-Regular',
  },
  detailValue: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Heebo-Medium',
  },
  soldButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  soldButtonDisabled: {
    opacity: 0.6,
  },
  soldButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Heebo-Medium',
  },
});