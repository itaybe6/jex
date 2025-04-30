import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Linking, Modal, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, MessageCircle, Clock, X, Edit, Trash } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';

type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  user_id: string;
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

const HOLD_DURATIONS = [
  { value: 1, label: '1 Hour' },
  { value: 2, label: '2 Hours' },
  { value: 3, label: '3 Hours' },
  { value: 4, label: '4 Hours' },
  { value: 5, label: '5 Hours' },
  { value: 6, label: '6 Hours' },
  { value: 7, label: '7 Hours' },
  { value: 8, label: '8 Hours' },
  { value: 9, label: '9 Hours' },
  { value: 10, label: '10 Hours' },
  { value: 11, label: '11 Hours' },
  { value: 12, label: '12 Hours' },
];

export default function ProductScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const message = `היי, אני מעוניין במוצר "${product.title}" שפרסמת ב-Brilliant`;
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      Linking.openURL(whatsappUrl);
    }
  };

  const handleBackPress = () => {
    router.back();
  };

  const handleEditPress = () => {
    if (!product) return;
    router.push({
      pathname: "/profile/product/[id]",
      params: { id: product.id }
    });
  };

  const handleDeletePress = async () => {
    if (!product || !user) return;

    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', product.id)
                .eq('user_id', user.id);

              if (error) throw error;
              router.back();
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('Error', 'Failed to delete product');
            }
          }
        }
      ]
    );
  };

  const handleHoldRequest = async () => {
    if (!user || !product || !selectedDuration) return;
    
    setIsSubmitting(true);
    try {
      // Get user profile for notification
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Create notification for product owner
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: product.profiles.id,
          type: 'hold_request',
          data: {
            product_id: product.id,
            product_title: product.title,
            product_image_url: product.image_url,
            requester_id: user.id,
            requester_name: userProfile.full_name,
            requester_avatar: userProfile.avatar_url,
            duration_hours: selectedDuration,
            message: `${userProfile.full_name} ביקש לשמור את המוצר '${product.title}' למשך ${selectedDuration} שעות.`
          },
          is_read: false
        });

      if (notificationError) throw notificationError;

      setShowHoldModal(false);
      setSelectedDuration(null);
      alert('Hold request sent successfully');
    } catch (error) {
      console.error('Error sending hold request:', error);
      alert('Failed to send hold request. Please try again.');
    } finally {
      setIsSubmitting(false);
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

  const isOwner = user?.id === product.user_id;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{product.title}</Text>
        {isOwner && (
          <View style={styles.ownerActions}>
            <TouchableOpacity onPress={handleEditPress} style={styles.actionButton}>
              <Edit size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDeletePress} style={[styles.actionButton, styles.deleteButton]}>
              <Trash size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        )}
      </View>
      
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

          {product.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionTitle}>Description</Text>
              <Text style={styles.descriptionText}>{product.description}</Text>
            </View>
          )}

          {!isOwner && (
            <TouchableOpacity 
              style={styles.contactButton}
              onPress={handleContactPress}
            >
              <MessageCircle size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.contactButtonText}>Contact via WhatsApp</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

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
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    zIndex: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
  },
  ownerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
  },
  deleteButton: {
    backgroundColor: '#2a2a2a',
  },
  content: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  image: {
    width: '100%',
    height: 300,
    backgroundColor: '#2a2a2a',
  },
  detailsContainer: {
    padding: 16,
  },
  price: {
    color: '#fff',
    fontSize: 24,
    fontFamily: 'Montserrat-Bold',
    marginBottom: 8,
  },
  category: {
    color: '#888',
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
    marginBottom: 16,
  },
  specsContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  specItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  specLabel: {
    color: '#888',
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
  },
  specValue: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
  },
  descriptionContainer: {
    marginTop: 16,
  },
  descriptionTitle: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    marginBottom: 8,
  },
  descriptionText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C5CE7',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
  }
}); 