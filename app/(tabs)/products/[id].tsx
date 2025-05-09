import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Linking, Modal, Alert } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
// import { supabase } from '@/lib/supabase'; // Removed, migrate to fetch-based API
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import ImageViewer from 'react-native-image-zoom-viewer';
import { Product } from '@/types/product';
import { showAlert } from '@/utils/alert';
import { format } from 'date-fns';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

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

// Map category to specs table name
const CATEGORY_TO_SPECS_TABLE: { [key: string]: string } = {
  'ring': 'ring_specs',
  'necklace': 'necklace_specs',
  'bracelet': 'bracelet_specs',
  'earring': 'earring_specs',
  'watch': 'watch_specs',
  'watches': 'watch_specs',
  'gem': 'gem_specs',
  'gems': 'gem_specs',
  'special_piece': 'special_piece_specs',
  'special pieces': 'special_piece_specs',
  'loose diamond': 'loose_diamonds_specs',
  'loose diamonds': 'loose_diamonds_specs',
  'rough diamond': 'rough_diamond_specs',
};

// Helper function to render a spec item if value is valid
const renderSpecItem = (label: string, value: any, suffix?: string) => {
  if (value === null || value === undefined || value === '') return null;
  return (
    <View style={styles.specRow}>
      <Text style={styles.specLabel}>{label}:</Text>
      <Text style={styles.specValue}>{String(value)}{suffix ? ` ${suffix}` : ''}</Text>
    </View>
  );
};

export default function ProductScreen() {
  console.log('PRODUCT PAGE LOADED: app/(tabs)/products/[id].tsx');
  const { id } = useLocalSearchParams();
  const { user, accessToken } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [holdInfo, setHoldInfo] = useState<{ end_time: string } | null>(null);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  useEffect(() => {
    // Fetch hold info if product is loaded and status is 'hold'
    const fetchHoldInfo = async () => {
      if (!product || product.status !== 'hold') {
        setHoldInfo(null);
        return;
      }
      try {
        const now = new Date().toISOString();
        const res = await fetch(`${SUPABASE_URL}/rest/v1/hold_requests?product_id=eq.${product.id}&status=eq.approved&end_time=gt.${now}&select=end_time&order=end_time.desc`, {
          headers: {
            apikey: SUPABASE_ANON_KEY!,
            Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
        });
        if (!res.ok) throw new Error(await res.text());
        const arr = await res.json();
        if (arr && arr[0] && arr[0].end_time) {
          setHoldInfo({ end_time: arr[0].end_time });
        } else {
          setHoldInfo(null);
        }
      } catch (e) {
        setHoldInfo(null);
      }
    };
    fetchHoldInfo();
  }, [product]);

  const fetchProduct = async () => {
    try {
      // שלב 1: שלוף את המוצר עם joins (שימוש ב-profiles!products_user_id_fkey)
      const res = await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${id}&select=*,profiles!products_user_id_fkey(id,full_name,avatar_url,phone),product_images(image_url),ring_specs(*),necklace_specs(*),bracelet_specs(*),earring_specs(*),watch_specs(*),gem_specs(*),special_piece_specs(*),loose_diamonds_specs(*),rough_diamond_specs(*)`, {
        headers: {
          apikey: SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) {
        const err = await res.text();
        console.error('Fetch error:', err);
        throw new Error(err);
      }
      const arr = await res.json();
      if (!arr || !arr[0]) {
        showAlert('שגיאה', 'המוצר לא נמצא');
        setProduct(null);
        return;
      }
      const productData = arr[0];
      console.log('productData:', productData);
      const category = (productData.category || '').toLowerCase();
      console.log('category:', productData.category, '->', category);
      const specsTable = CATEGORY_TO_SPECS_TABLE[category];
      console.log('specsTable:', specsTable);
      console.log('productData[specsTable]:', productData[specsTable]);
      // Always treat as array
      const specsArray = Array.isArray(productData[specsTable])
        ? productData[specsTable]
        : (productData[specsTable] ? [productData[specsTable]] : []);
      if (!specsTable || specsArray.length === 0) {
        console.log('[ProductSpecs] No specs found:', { category, specsTable, hasSpecsArray: !!productData[specsTable], specsArrayLength: specsArray.length });
        setProduct({ ...productData, specs: null } as Product);
      } else {
        const specs = specsArray[0];
        console.log('[ProductSpecs] Loaded specs:', { category, specsTable, found: !!specs, specs });
        setProduct({ ...productData, specs } as Product);
      }
      // שלב 3: קבע תמונות
      const images = productData.product_images || [];
      const imageUrls = images.map((img: { image_url: string }) => img.image_url);
      if (imageUrls.length === 0 && productData.image_url) {
        imageUrls.push(productData.image_url);
      }
      setProductImages(imageUrls);
    } catch (error) {
      console.error('Error fetching product:', error);
      showAlert('שגיאה', 'אירעה שגיאה בטעינת פרטי המוצר');
      setProduct(null);
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
    } else {
      Alert.alert('שגיאה', 'מספר טלפון לא זמין');
    }
  };

  const handleBackPress = () => {
    router.back();
  };

  const handleMarkAsSold = async () => {
    if (!product) return;
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${product.id}`, {
        method: 'PATCH',
        headers: {
          apikey: SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({ status: 'sold' })
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchProduct();
    } catch (error) {
      console.error('Error marking product as sold:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה בעדכון סטטוס המוצר');
    }
  };

  const handleEditPress = () => {
    router.push(`/profile/product/${product?.id}`);
  };

  const handleDeletePress = async () => {
    if (!product) return;
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${product.id}`, {
        method: 'DELETE',
        headers: {
          apikey: SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error(await res.text());
      router.back();
    } catch (error) {
      console.error('Error deleting product:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה במחיקת המוצר');
    }
  };

  const renderSpecs = () => {
    if (!product) return null;
    if (!product.specs) {
      return (
        <View style={styles.specsContainer}>
          <Text style={[styles.specLabel, { textAlign: 'center', color: '#888', fontStyle: 'italic' }]}>No details available for this product</Text>
        </View>
      );
    }
    const specs = product.specs as any;
    const render = (label: string, value: any, suffix?: string) => {
      if (value === null || value === undefined || value === '') return null;
      return (
        <View style={styles.specRow}>
          <Text style={styles.specLabel}>{label}:</Text>
          <Text style={styles.specValue}>{String(value)}{suffix ? ` ${suffix}` : ''}</Text>
        </View>
      );
    };
    // Debug: print all specs
    console.log('specs:', specs);
    return (
      <View style={styles.specsContainer}>
        {render('Weight', specs.weight, 'ct')}
        {render('Material', specs.material)}
        {render('Subcategory', specs.subcategory)}
        {/* ...rest of the fields... */}
        {render('Brand', specs.brand)}
        {render('Model', specs.model)}
        {render('Diameter', specs.diameter)}
        {render('Color', specs.color)}
        {render('Clarity', specs.clarity)}
        {render('Cut Grade', specs.cut_grade)}
        {render('Origin', specs.origin)}
        {render('Type', specs.type)}
        {render('Certification', specs.certification)}
        {/* שדות זהב */}
        {specs.material === 'gold' && render('Gold Karat', specs.gold_karat)}
        {specs.material === 'gold' && render('Gold Color', specs.gold_color)}
        {/* אבני צד */}
        {specs.side_stones === true && render('Side Stones', 'Yes')}
        {specs.side_stones === true && render('Side Stones Details', specs.side_stones_details)}
        {/* יהלומים */}
        {specs.has_diamond === true && render('Diamond Weight', specs.diamond_weight, 'ct')}
        {specs.has_diamond === true && render('Cut Grade', specs.cut_grade)}
        {specs.has_diamond === true && render('Certification', specs.certification)}
        {/* שדות נוספים אם יש */}
        {render('Certificate', specs.certificate)}
        {render('Lab Grown Type', specs.lab_grown_type)}
        {render('Treatment Type', specs.treatment_type)}
        {render('Diamond Size From', specs.diamond_size_from)}
        {render('Diamond Size To', specs.diamond_size_to)}
        {/* שדות ייחודיים ל-loose diamonds */}
        {render('Shape', specs.shape)}
        {render('Fluorescence', specs.fluorescence)}
        {render('Polish', specs.polish)}
        {render('Symmetry', specs.symmetry)}
        {render('Origin Type', specs.origin_type)}
      </View>
    );
  };

  const handleHoldRequest = async () => {
    if (!product || !selectedDuration || !user) return;
    setIsSubmitting(true);
    try {
      // בדוק שאין בקשה פתוחה
      const resCheck = await fetch(
        `${SUPABASE_URL}/rest/v1/hold_requests?product_id=eq.${product.id}&status=in.(pending,approved)&end_time=gt.${new Date().toISOString()}`
      );
      const arr = await resCheck.json();
      if (arr.length > 0) {
        Alert.alert('שגיאה', 'כבר קיימת בקשה פעילה על מוצר זה');
        setIsSubmitting(false);
        return;
      }

      // שלוף את פרטי הפרופיל של המשתמש הנוכחי
      let buyerProfile = { full_name: '', avatar_url: '' };
      try {
        const profileRes = await fetch(
          `${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=full_name,avatar_url`,
          {
            headers: {
              apikey: SUPABASE_ANON_KEY!,
              Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
            },
          }
        );
        const profileArr = await profileRes.json();
        if (profileArr && profileArr[0]) {
          buyerProfile = {
            full_name: profileArr[0].full_name || '',
            avatar_url: profileArr[0].avatar_url || '',
          };
        }
      } catch (e) {
        // אפשר להתעלם משגיאה, פשוט לא יהיה שם/תמונה
      }

      // צור בקשת Hold
      const now = new Date();
      const end_time = new Date(now.getTime() + selectedDuration * 60 * 60 * 1000);
      const holdRes = await fetch(`${SUPABASE_URL}/rest/v1/hold_requests`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          product_id: product.id,
          user_id: user.id,
          owner_id: product.user_id,
          duration_hours: selectedDuration,
          start_time: now.toISOString(),
          end_time: end_time.toISOString(),
          status: 'pending'
        })
      });
      if (!holdRes.ok) throw new Error(await holdRes.text());
      const [holdRequest] = await holdRes.json();

      // צור התראה למוכר עם שם ותמונה של הקונה
      await fetch(`${SUPABASE_URL}/rest/v1/notifications`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          user_id: product.user_id, // המוכר
          type: 'hold_request',
          product_id: product.id,
          data: {
            hold_request_id: holdRequest.id,
            buyer_id: user.id,
            buyer_name: buyerProfile.full_name,
            buyer_avatar_url: buyerProfile.avatar_url,
            product_title: product.title || '',
            product_image_url: productImages[0] || product.image_url || '',
            message: `Request Hold ${selectedDuration} Hours`
          },
          read: false,
          is_action_done: false
        })
      });

      setShowHoldModal(false);
      setSelectedDuration(null);
      Alert.alert('הבקשה נשלחה', 'הבקשה להחזקה נשלחה למוכר. המתן לאישור.');
      await fetchProduct();
    } catch (error) {
      Alert.alert('שגיאה', 'לא ניתן לשלוח בקשה להחזקה');
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
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <Stack.Screen
        options={{
          headerStyle: {
            backgroundColor: '#F5F8FC',
          },
          headerTintColor: '#0E2657',
          headerTitle: '',
          headerTitleStyle: {
            fontWeight: '600',
            color: '#0E2657',
          },
          headerShadowVisible: false,
        }}
      />
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0E2657" />
        </TouchableOpacity>
        <Text style={styles.productTitle}>{product.title}</Text>
        {isOwner && (
          <View style={styles.ownerActions}>
            <TouchableOpacity onPress={handleMarkAsSold} style={[styles.actionButton, styles.soldButton]}>
              <Ionicons name="checkmark-circle-outline" size={24} color="#4CAF50" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleEditPress} style={styles.actionButton}>
              <Ionicons name="create-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDeletePress} style={[styles.actionButton, styles.deleteButton]}>
              <Ionicons name="trash-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {productImages.length > 0 && (
          <TouchableOpacity 
            style={styles.imageContainer}
            onPress={() => {
              setSelectedImageIndex(0);
              setShowImageViewer(true);
            }}
          >
            <Image source={{ uri: productImages[0] }} style={styles.image} />
            {productImages.length > 1 && (
              <View style={styles.imageCounter}>
                <Text style={styles.imageCounterText}>
                  +{productImages.length - 1}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        <View style={styles.detailsContainer}>
          <View style={styles.priceSection}>
            <View style={styles.priceRow}>
              <Text style={styles.category}>{product.category}</Text>
              <Text style={styles.price}>${product.price?.toLocaleString()}</Text>
            </View>
          </View>

          {renderSpecs()}

          <View style={styles.sellerContainer}>
            <TouchableOpacity 
              style={styles.sellerContent}
              onPress={() => product.profiles?.id && router.push(`/user/${product.profiles.id}`)}
            >
              <Image
                source={{ uri: product.profiles?.avatar_url || 'https://www.gravatar.com/avatar/?d=mp' }}
                style={styles.sellerAvatar}
              />
              <View style={styles.sellerInfo}>
                <Text style={styles.sellerLabel}>Seller</Text>
                <Text style={styles.sellerName}>{product.profiles?.full_name || ''}</Text>
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

      {!isOwner && product.status !== 'hold' && (
        <View style={styles.bottomButtonsContainer}>
          <View style={styles.bottomButtons}>
            <TouchableOpacity 
              style={styles.holdButton} 
              onPress={() => setShowHoldModal(true)}
            >
              <Ionicons name="time-outline" size={24} color="#fff" strokeWidth={2.5} />
              <Text style={styles.holdButtonText}>Hold Product</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.contactButton}
              onPress={handleContactPress}
            >
              <Ionicons name="chatbubble-outline" size={24} color="#fff" style={{ marginRight: 8 }} />
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
                <Ionicons name="close" size={24} color="#0E2657" />
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
            imageUrls={productImages.map(url => ({ url }))}
            index={selectedImageIndex}
            enableSwipeDown
            onSwipeDown={() => setShowImageViewer(false)}
            backgroundColor="rgba(0, 0, 0, 0.9)"
            renderHeader={() => (
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowImageViewer(false)}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {/* HOLD BADGE AT BOTTOM */}
      {product.status === 'hold' && holdInfo && (
        <View style={styles.holdBadgeBottom}>
          <Text style={styles.holdBadgeText}>
            HOLD until {format(new Date(holdInfo.end_time), 'HH:mm')}
          </Text>
        </View>
      )}
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
    backgroundColor: '#F5F8FC',
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
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  specLabel: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: '#888',
  },
  specValue: {
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
    color: '#0E2657',
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
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E3EAF3',
    paddingTop: 8,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  bottomButtons: {
    gap: 12,
  },
  holdButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0E2657',
    padding: 10,
    borderRadius: 10,
    gap: 6,
  },
  holdButtonText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Montserrat-Bold',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0E2657',
    borderRadius: 10,
    padding: 10,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 15,
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
    backgroundColor: '#0E2657',
    borderColor: '#0E2657',
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
    backgroundColor: '#0E2657',
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
  imageCounter: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 6,
    paddingHorizontal: 10,
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Montserrat-Bold',
  },
  productTitle: {
    fontSize: 22,
    fontFamily: 'Montserrat-Bold',
    color: '#0E2657',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  holdBadge: {
    position: 'absolute',
    top: 10,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    zIndex: 20,
    alignSelf: 'flex-start',
  },
  holdBadgeBottom: {
    marginTop: 24,
    marginBottom: 8,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  holdBadgeText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Montserrat-Bold',
    letterSpacing: 1,
  },
}); 