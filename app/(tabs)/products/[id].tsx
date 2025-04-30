import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Linking, Modal, Alert } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, MessageCircle, Clock, X, Edit, Trash, CheckCircle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import ImageViewer from 'react-native-image-zoom-viewer';

type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  user_id: string;
  status: 'available' | 'sold';
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
  const [showImageViewer, setShowImageViewer] = useState(false);

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
          user_id: product.user_id, // Send to product owner
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

  const handleMarkAsSold = async () => {
    if (!product || !user) return;

    Alert.alert(
      'Mark as Sold',
      'Are you sure you want to mark this product as sold? It will be removed from the catalog.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Mark as Sold',
          style: 'default',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('products')
                .update({ status: 'sold' })
                .eq('id', product.id)
                .eq('user_id', user.id);

              if (error) throw error;
              
              Alert.alert('Success', 'Product marked as sold');
              router.back();
            } catch (error) {
              console.error('Error marking product as sold:', error);
              Alert.alert('Error', 'Failed to mark product as sold');
            }
          }
        }
      ]
    );
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
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <Stack.Screen
        options={{
          headerStyle: {
            backgroundColor: '#0E2657',
          },
          headerTintColor: '#fff',
          headerTitle: 'Product',
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerShadowVisible: false,
        }}
      />
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{product.title}</Text>
        {isOwner && (
          <View style={styles.ownerActions}>
            <TouchableOpacity onPress={handleMarkAsSold} style={[styles.actionButton, styles.soldButton]}>
              <CheckCircle size={20} color="#4CAF50" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleEditPress} style={styles.actionButton}>
              <Edit size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDeletePress} style={[styles.actionButton, styles.deleteButton]}>
              <Trash size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity 
          style={styles.imageContainer}
          onPress={() => setShowImageViewer(true)}
        >
          <Image source={{ uri: product.image_url }} style={styles.image} />
        </TouchableOpacity>

        <View style={styles.detailsContainer}>
          <View style={styles.priceSection}>
            <View style={styles.priceRow}>
              <Text style={styles.category}>{product.category}</Text>
              <Text style={styles.price}>${product.price?.toLocaleString()}</Text>
            </View>
          </View>

          {product.details && (
            <View style={styles.specsContainer}>
              <Text style={styles.sectionTitle}>Specifications</Text>
              <View style={styles.specsGrid}>
                {product.details.weight && (
                  <View style={styles.specItem}>
                    <Text style={styles.specLabel}>Weight</Text>
                    <Text style={styles.specValue}>{product.details.weight} ct</Text>
                  </View>
                )}
                {product.details.size && (
                  <View style={styles.specItem}>
                    <Text style={styles.specLabel}>Size</Text>
                    <Text style={styles.specValue}>{product.details.size}</Text>
                  </View>
                )}
                {product.details.clarity && (
                  <View style={styles.specItem}>
                    <Text style={styles.specLabel}>Clarity</Text>
                    <Text style={styles.specValue}>{product.details.clarity}</Text>
                  </View>
                )}
                {product.details.color && (
                  <View style={styles.specItem}>
                    <Text style={styles.specLabel}>Color</Text>
                    <Text style={styles.specValue}>{product.details.color}</Text>
                  </View>
                )}
              </View>
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
                <Text style={styles.sellerLabel}>Seller</Text>
                <Text style={styles.sellerName}>{product.profiles.full_name}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {product.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{product.description}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {!isOwner && (
        <View style={styles.bottomButtonsContainer}>
          <View style={styles.bottomButtons}>
            <TouchableOpacity 
              style={styles.holdButton} 
              onPress={() => setShowHoldModal(true)}
            >
              <Clock size={24} color="#fff" strokeWidth={2.5} />
              <Text style={styles.holdButtonText}>Hold Product</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.contactButton}
              onPress={handleContactPress}
            >
              <MessageCircle size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.contactButtonText}>Contact via WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

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
                <X size={24} color="#0E2657" />
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

      {/* Image Viewer Modal */}
      <Modal visible={showImageViewer} transparent={true}>
        <View style={styles.imageViewerContainer}>
          <ImageViewer
            imageUrls={[{ url: product?.image_url || '' }]}
            enableSwipeDown
            onSwipeDown={() => setShowImageViewer(false)}
            backgroundColor="rgba(0, 0, 0, 0.9)"
            renderHeader={() => (
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowImageViewer(false)}
              >
                <X size={24} color="#fff" />
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0E2657',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    marginLeft: 12,
  },
  backButton: {
    padding: 8,
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 8,
  },
  ownerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  soldButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  content: {
    flex: 1,
    backgroundColor: '#F5F8FC',
  },
  contentContainer: {
    paddingBottom: 16,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#fff',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  detailsContainer: {
    padding: 16,
  },
  priceSection: {
    marginBottom: 24,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    color: '#0E2657',
    fontSize: 24,
    fontFamily: 'Montserrat-Bold',
  },
  category: {
    color: '#7B8CA6',
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
  },
  sectionTitle: {
    color: '#0E2657',
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    marginBottom: 4,
  },
  specsContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#0E2657',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  specsGrid: {
    gap: 12,
  },
  specItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  specLabel: {
    color: '#7B8CA6',
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
  },
  specValue: {
    color: '#0E2657',
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
  },
  sellerContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#0E2657',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
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
    backgroundColor: '#E3EAF3',
  },
  sellerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  sellerLabel: {
    fontSize: 16,
    color: '#0E2657',
    fontFamily: 'Montserrat-Bold',
    marginBottom: 2,
  },
  sellerName: {
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
    color: '#0E2657',
  },
  descriptionContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#0E2657',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  description: {
    color: '#0E2657',
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
    lineHeight: 24,
  },
  bottomButtonsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E3EAF3',
    paddingTop: 12,
    paddingBottom: 32,
    paddingHorizontal: 16,
  },
  bottomButtons: {
    gap: 12,
  },
  holdButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C5CE7',
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  holdButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C5CE7',
    borderRadius: 16,
    padding: 16,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(14, 38, 87, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
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
    borderBottomColor: '#E3EAF3',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Montserrat-Bold',
    color: '#0E2657',
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
    backgroundColor: '#F5F8FC',
    borderWidth: 1,
    borderColor: '#E3EAF3',
  },
  durationOptionSelected: {
    backgroundColor: '#6C5CE7',
    borderColor: '#6C5CE7',
  },
  durationOptionText: {
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
    color: '#0E2657',
  },
  durationOptionTextSelected: {
    color: '#fff',
    fontFamily: 'Montserrat-Bold',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E3EAF3',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#E3EAF3',
  },
  modalConfirmButton: {
    backgroundColor: '#6C5CE7',
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalButtonText: {
    color: '#0E2657',
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F8FC',
  },
  loadingText: {
    color: '#0E2657',
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F8FC',
  },
  errorText: {
    color: '#0E2657',
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
  },
  imageViewerContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
    padding: 8,
  },
}); 