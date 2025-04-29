import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Linking, Modal } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, MessageCircle, Clock, X } from 'lucide-react-native';
import { TopHeader } from '@/components/TopHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';

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
          user_id: product.profiles.id, // Send to product owner
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

      // Close modal and reset state
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

  return (
    <View style={styles.container}>
      <TopHeader />
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{product.title}</Text>
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

      <View style={styles.bottomButtons}>
        {user?.id !== product.profiles.id && (
          <TouchableOpacity 
            style={styles.holdButton} 
            onPress={() => setShowHoldModal(true)}
          >
            <Clock size={24} color="#fff" strokeWidth={2.5} />
            <Text style={styles.holdButtonText}>Hold Product</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={styles.contactButton} 
          onPress={handleContactPress}
        >
          <MessageCircle size={24} color="#fff" strokeWidth={2.5} />
          <Text style={styles.contactButtonText}>Contact via WhatsApp</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showHoldModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowHoldModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Hold Duration</Text>
              <TouchableOpacity 
                onPress={() => setShowHoldModal(false)}
                style={styles.modalCloseButton}
              >
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.durationList}>
              {HOLD_DURATIONS.map((duration) => (
                <TouchableOpacity
                  key={duration.value}
                  style={[
                    styles.durationOption,
                    selectedDuration === duration.value && styles.durationOptionSelected
                  ]}
                  onPress={() => setSelectedDuration(duration.value)}
                >
                  <Text style={[
                    styles.durationOptionText,
                    selectedDuration === duration.value && styles.durationOptionTextSelected
                  ]}>
                    {duration.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowHoldModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalConfirmButton,
                  (!selectedDuration || isSubmitting) && styles.modalButtonDisabled
                ]}
                onPress={handleHoldRequest}
                disabled={!selectedDuration || isSubmitting}
              >
                <Text style={styles.modalButtonText}>
                  {isSubmitting ? 'Sending...' : 'Confirm'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  bottomButtons: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  holdButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C5CE7',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  holdButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Heebo-Bold',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Heebo-Bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Heebo-Bold',
    color: '#fff',
  },
  modalCloseButton: {
    padding: 4,
  },
  durationList: {
    padding: 20,
  },
  durationOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#444',
  },
  durationOptionSelected: {
    backgroundColor: '#6C5CE7',
    borderColor: '#6C5CE7',
  },
  durationOptionText: {
    fontSize: 16,
    fontFamily: 'Heebo-Medium',
    color: '#fff',
  },
  durationOptionTextSelected: {
    color: '#fff',
    fontFamily: 'Heebo-Bold',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#2a2a2a',
  },
  modalConfirmButton: {
    backgroundColor: '#6C5CE7',
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Heebo-Bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  loadingText: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Heebo-Regular',
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