import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Linking, Modal, Alert } from 'react-native';
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
  status: string;
  user_id: string;
  watch_specs?: {
    brand: string | null;
    model: string | null;
    diameter: number | null;
  } | null;
  diamond_specs?: {
    shape: string | null;
    weight: number | null;
    color: string | null;
    clarity: string | null;
    cut_grade: string | null;
    certificate: string | null;
    origin: string | null;
    lab_grown_type: string | null;
    treatment_type: string | null;
  } | null;
  gem_specs?: {
    type: string | null;
    origin: string | null;
    certification: string | null;
  } | null;
  jewelry_specs?: {
    diamond_size_from: number | null;
    diamond_size_to: number | null;
    color: string | null;
    clarity: string | null;
    gold_color: string | null;
    material: string | null;
    gold_karat: string | null;
    side_stones: boolean | null;
    cut_grade: string | null;
    certification: string | null;
  } | null;
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
          watch_specs (*),
          diamond_specs (*),
          gem_specs (*),
          jewelry_specs (*),
          profiles (
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
      Alert.alert('שגיאה', 'אירעה שגיאה בטעינת פרטי המוצר');
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

  const renderSpecs = () => {
    if (!product) return null;

    switch (product.category) {
      case 'Watch':
        return product.watch_specs ? (
          <View style={styles.specsContainer}>
            <Text style={styles.specsTitle}>מפרט טכני</Text>
            {product.watch_specs.brand && (
              <Text style={styles.specsText}>מותג: {product.watch_specs.brand}</Text>
            )}
            {product.watch_specs.model && (
              <Text style={styles.specsText}>דגם: {product.watch_specs.model}</Text>
            )}
            {product.watch_specs.diameter && (
              <Text style={styles.specsText}>קוטר: {product.watch_specs.diameter} מ"מ</Text>
            )}
          </View>
        ) : null;

      case 'Loose Diamond':
        return product.diamond_specs ? (
          <View style={styles.specsContainer}>
            <Text style={styles.specsTitle}>מפרט טכני</Text>
            {product.diamond_specs.shape && (
              <Text style={styles.specsText}>צורה: {product.diamond_specs.shape}</Text>
            )}
            {product.diamond_specs.weight && (
              <Text style={styles.specsText}>משקל: {product.diamond_specs.weight} קראט</Text>
            )}
            {product.diamond_specs.color && (
              <Text style={styles.specsText}>צבע: {product.diamond_specs.color}</Text>
            )}
            {product.diamond_specs.clarity && (
              <Text style={styles.specsText}>ניקיון: {product.diamond_specs.clarity}</Text>
            )}
            {product.diamond_specs.cut_grade && (
              <Text style={styles.specsText}>חיתוך: {product.diamond_specs.cut_grade}</Text>
            )}
            {product.diamond_specs.certificate && (
              <Text style={styles.specsText}>תעודה: {product.diamond_specs.certificate}</Text>
            )}
            {product.diamond_specs.origin && (
              <Text style={styles.specsText}>מקור: {product.diamond_specs.origin}</Text>
            )}
            {product.diamond_specs.lab_grown_type && (
              <Text style={styles.specsText}>סוג גידול: {product.diamond_specs.lab_grown_type}</Text>
            )}
            {product.diamond_specs.treatment_type && (
              <Text style={styles.specsText}>סוג טיפול: {product.diamond_specs.treatment_type}</Text>
            )}
          </View>
        ) : null;

      case 'Gems':
        return product.gem_specs ? (
          <View style={styles.specsContainer}>
            <Text style={styles.specsTitle}>מפרט טכני</Text>
            {product.gem_specs.type && (
              <Text style={styles.specsText}>סוג אבן: {product.gem_specs.type}</Text>
            )}
            {product.gem_specs.origin && (
              <Text style={styles.specsText}>מקור: {product.gem_specs.origin}</Text>
            )}
            {product.gem_specs.certification && (
              <Text style={styles.specsText}>תעודה: {product.gem_specs.certification}</Text>
            )}
          </View>
        ) : null;

      case 'Ring':
      case 'Necklace':
      case 'Bracelet':
      case 'Earrings':
        return product.jewelry_specs ? (
          <View style={styles.specsContainer}>
            <Text style={styles.specsTitle}>מפרט טכני</Text>
            {(product.jewelry_specs.diamond_size_from || product.jewelry_specs.diamond_size_to) && (
              <Text style={styles.specsText}>
                משקל יהלום: {product.jewelry_specs.diamond_size_from} - {product.jewelry_specs.diamond_size_to} קראט
              </Text>
            )}
            {product.jewelry_specs.color && (
              <Text style={styles.specsText}>צבע: {product.jewelry_specs.color}</Text>
            )}
            {product.jewelry_specs.clarity && (
              <Text style={styles.specsText}>ניקיון: {product.jewelry_specs.clarity}</Text>
            )}
            {product.jewelry_specs.gold_color && (
              <Text style={styles.specsText}>צבע זהב: {product.jewelry_specs.gold_color}</Text>
            )}
            {product.jewelry_specs.material && (
              <Text style={styles.specsText}>חומר: {product.jewelry_specs.material}</Text>
            )}
            {product.jewelry_specs.gold_karat && (
              <Text style={styles.specsText}>קראט: {product.jewelry_specs.gold_karat}</Text>
            )}
            {product.jewelry_specs.side_stones !== null && (
              <Text style={styles.specsText}>
                אבני צד: {product.jewelry_specs.side_stones ? 'כן' : 'לא'}
              </Text>
            )}
            {product.jewelry_specs.cut_grade && (
              <Text style={styles.specsText}>חיתוך: {product.jewelry_specs.cut_grade}</Text>
            )}
            {product.jewelry_specs.certification && (
              <Text style={styles.specsText}>תעודה: {product.jewelry_specs.certification}</Text>
            )}
          </View>
        ) : null;

      default:
        return null;
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

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.imageContainer}>
          <Image source={{ uri: product.image_url }} style={styles.image} />
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.priceSection}>
            <Text style={styles.price}>${product.price?.toLocaleString()}</Text>
            <Text style={styles.category}>{product.category}</Text>
          </View>

          {renderSpecs()}

          <View style={styles.sellerContainer}>
            <Text style={styles.sectionTitle}>Seller</Text>
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
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{product.description}</Text>
            </View>
          )}
          
          {/* Extra padding to prevent content from being hidden behind buttons */}
          <View style={styles.bottomPadding} />
        </View>
      </ScrollView>

      {/* Fixed bottom buttons */}
      <View style={styles.bottomButtonsContainer}>
        <View style={styles.bottomButtons}>
          {user?.id !== product.user_id && (
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
    padding: 8,
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
  contentContainer: {
    paddingBottom: 120, // Extra padding for bottom buttons
  },
  imageContainer: {
    backgroundColor: '#1a1a1a',
    padding: 16,
  },
  image: {
    width: '100%',
    height: undefined,
    aspectRatio: 1,
    resizeMode: 'contain',
    borderRadius: 16,
  },
  detailsContainer: {
    padding: 24,
    backgroundColor: '#121212',
  },
  priceSection: {
    marginBottom: 24,
  },
  price: {
    fontSize: 32,
    fontFamily: 'Heebo-Bold',
    color: '#6C5CE7',
    marginBottom: 8,
  },
  category: {
    fontSize: 18,
    fontFamily: 'Heebo-Medium',
    color: '#888',
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Heebo-Bold',
    color: '#fff',
    marginBottom: 16,
  },
  specsContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  specsTitle: {
    fontSize: 20,
    fontFamily: 'Heebo-Bold',
    color: '#fff',
    marginBottom: 16,
  },
  specsText: {
    fontSize: 16,
    fontFamily: 'Heebo-Regular',
    color: '#fff',
    marginBottom: 8,
  },
  sellerContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  sellerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
    backgroundColor: '#2a2a2a',
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 18,
    fontFamily: 'Heebo-Medium',
    color: '#fff',
  },
  descriptionContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    fontFamily: 'Heebo-Regular',
    color: '#fff',
    lineHeight: 24,
  },
  bottomPadding: {
    height: 32,
  },
  bottomButtonsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(18, 18, 18, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
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
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
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
    borderRadius: 16,
    gap: 8,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
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