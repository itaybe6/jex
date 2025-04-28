import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, Alert, Modal, Linking } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Link as LinkIcon, Shield, X, MessageCircle, ClipboardList } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';

const GRID_SPACING = 2;
const NUM_COLUMNS = 3;
const screenWidth = Dimensions.get('window').width;
const ITEM_WIDTH = (screenWidth - 40 - (GRID_SPACING * (NUM_COLUMNS - 1))) / NUM_COLUMNS;

type Profile = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  title: string | null;
  bio: string | null;
  website: string | null;
  phone: string | null;
  trust_count: number;
  sold_count: number;
};

type TrustMark = {
  id: string;
  created_at: string;
  truster: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    title: string | null;
  };
};

type Product = {
  id: string;
  title: string;
  price: number;
  image_url: string;
  category: string;
};

type ProductsByCategory = {
  [key: string]: Product[];
};

export default function UserProfileScreen() {
  const params = useLocalSearchParams();
  const userId = typeof params.id === 'string' ? params.id : '';
  const { user } = useAuth();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [productsByCategory, setProductsByCategory] = useState<ProductsByCategory>({});
  const [loading, setLoading] = useState(true);
  const [hasTrusted, setHasTrusted] = useState(false);
  const [trustLoading, setTrustLoading] = useState(false);
  const [showTrustMarks, setShowTrustMarks] = useState(false);
  const [trustMarks, setTrustMarks] = useState<TrustMark[]>([]);
  const [loadingTrustMarks, setLoadingTrustMarks] = useState(false);
  const [activeTab, setActiveTab] = useState<'catalog' | 'requests'>('catalog');
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchProfile();
      fetchProducts();
      fetchUserRequests();
      if (user) {
        checkTrustStatus();
      }
    }
  }, [userId, user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const checkTrustStatus = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('trust_marks')
        .select('id')
        .eq('truster_id', user.id)
        .eq('trusted_id', userId)
        .maybeSingle();

      if (error) throw error;
      setHasTrusted(!!data);
    } catch (error) {
      console.error('Error checking trust status:', error);
    }
  };

  const fetchTrustMarks = async () => {
    try {
      setLoadingTrustMarks(true);
      const { data, error } = await supabase
        .from('trust_marks')
        .select(`
          id,
          created_at,
          truster:profiles!trust_marks_truster_id_fkey (
            id,
            full_name,
            avatar_url,
            title
          )
        `)
        .eq('trusted_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTrustMarks(data || []);
    } catch (error) {
      console.error('Error fetching trust marks:', error);
      Alert.alert('Error', 'Failed to load trust marks');
    } finally {
      setLoadingTrustMarks(false);
    }
  };

  const handleTrustMark = async () => {
    try {
      if (!user) {
        Alert.alert('Error', 'Please sign in to mark users as trusted');
        return;
      }

      if (user.id === userId) {
        Alert.alert('Error', 'You cannot mark yourself as trusted');
        return;
      }

      setTrustLoading(true);

      if (hasTrusted) {
        const { error: deleteError } = await supabase
          .from('trust_marks')
          .delete()
          .eq('truster_id', user.id)
          .eq('trusted_id', userId);

        if (deleteError) throw deleteError;
        setHasTrusted(false);
        setProfile(prev => prev ? {
          ...prev,
          trust_count: Math.max(0, prev.trust_count - 1)
        } : null);
      } else {
        const { error: insertError } = await supabase
          .from('trust_marks')
          .insert({
            truster_id: user.id,
            trusted_id: userId
          });

        if (insertError) throw insertError;
        setHasTrusted(true);
        setProfile(prev => prev ? {
          ...prev,
          trust_count: prev.trust_count + 1
        } : null);
      }
    } catch (error) {
      console.error('Error updating trust mark:', error);
      Alert.alert('Error', 'Failed to update trust mark. Please try again.');
    } finally {
      setTrustLoading(false);
    }
  };

  const handleShowTrustMarks = () => {
    setShowTrustMarks(true);
    fetchTrustMarks();
  };

  const handleUserPress = (userId: string) => {
    setShowTrustMarks(false);
    router.push(`/user/${userId}`);
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const grouped = (data || []).reduce<ProductsByCategory>((acc, product) => {
        if (!acc[product.category]) {
          acc[product.category] = [];
        }
        acc[product.category].push(product);
        return acc;
      }, {});

      setProductsByCategory(grouped);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRequests = async () => {
    setLoadingRequests(true);
    try {
      const { data, error } = await supabase
        .from('diamond_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      setRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleWebsitePress = async () => {
    if (profile?.website) {
      const url = profile.website.startsWith('http') ? profile.website : `https://${profile.website}`;
      window.open(url, '_blank');
    }
  };

  const handleWhatsAppPress = () => {
    if (profile?.phone) {
      const phoneNumber = profile.phone.replace(/\D/g, '');
      const whatsappUrl = `https://wa.me/${phoneNumber}`;
      
      Linking.canOpenURL(whatsappUrl)
        .then(supported => {
          if (supported) {
            return Linking.openURL(whatsappUrl);
          } else {
            Alert.alert(
              'Error',
              'WhatsApp is not installed on your device'
            );
          }
        })
        .catch(err => {
          console.error('Error opening WhatsApp:', err);
          Alert.alert(
            'Error',
            'Could not open WhatsApp'
          );
        });
    }
  };

  const handleProductPress = (productId: string) => {
    router.push(`/profile/product/${productId}`);
  };

  const renderProductItem = (product: Product) => (
    <TouchableOpacity 
      key={product.id}
      style={styles.productItem}
      onPress={() => handleProductPress(product.id)}
    >
      <Image 
        source={{ uri: product.image_url }} 
        style={styles.productImage}
        resizeMode="cover"
      />
      <View style={styles.productDetails}>
        <Text style={styles.productTitle} numberOfLines={1}>{product.title}</Text>
        <Text style={styles.productPrice}>${product.price.toLocaleString()}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderCategorySection = (category: string, products: Product[]) => (
    <View key={category} style={styles.categorySection}>
      <Text style={styles.categoryTitle}>{category}</Text>
      <View style={styles.productsGrid}>
        {products.map(product => renderProductItem(product))}
      </View>
    </View>
  );

  const TrustMarksModal = () => (
    <Modal
      visible={showTrustMarks}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowTrustMarks(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Trusted By</Text>
            <TouchableOpacity 
              onPress={() => setShowTrustMarks(false)}
              style={styles.closeButton}
            >
              <X size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {loadingTrustMarks ? (
            <View style={styles.trustMarksList}>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : trustMarks.length > 0 ? (
            <ScrollView style={styles.trustMarksList}>
              {trustMarks.map(mark => (
                <TouchableOpacity
                  key={mark.id}
                  style={styles.trustMarkItem}
                  onPress={() => handleUserPress(mark.truster.id)}
                >
                  <Image
                    source={{
                      uri: mark.truster.avatar_url || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=800&auto=format&fit=crop&q=60'
                    }}
                    style={styles.trustMarkAvatar}
                  />
                  <View style={styles.trustMarkInfo}>
                    <Text style={styles.trustMarkName}>{mark.truster.full_name}</Text>
                    {mark.truster.title && (
                      <Text style={styles.trustMarkTitle}>{mark.truster.title}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.trustMarksList}>
              <Text style={styles.emptyText}>No trust marks yet</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  if (loading || !profile) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  const totalProducts = Object.values(productsByCategory).reduce(
    (sum, products) => sum + products.length, 
    0
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileSection}>
        <View style={styles.profileImageContainer}>
          <Image
            source={{ 
              uri: profile?.avatar_url || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=800&auto=format&fit=crop&q=60'
            }}
            style={styles.profileImage}
          />
        </View>

        <Text style={styles.userName}>{profile?.full_name}</Text>
        {profile?.title ? <Text style={styles.userTitle}>{profile.title}</Text> : null}
        
        <View style={styles.bioWebsiteContainer}>
          {profile?.bio ? (
            <Text style={styles.bio}>{profile.bio}</Text>
          ) : null}

          {profile?.website ? (
            <TouchableOpacity 
              style={styles.websiteButton}
              onPress={handleWebsitePress}
            >
              <LinkIcon size={16} color="#6C5CE7" />
              <Text style={styles.websiteText}>{profile.website}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {user && user.id !== userId && (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[
                styles.trustButton,
                hasTrusted && styles.trustButtonActive,
                trustLoading && styles.trustButtonDisabled
              ]}
              onPress={handleTrustMark}
              disabled={trustLoading}
            >
              <Shield size={16} color={hasTrusted ? '#fff' : '#6C5CE7'} />
              <Text style={[
                styles.trustButtonText,
                hasTrusted && styles.trustButtonTextActive
              ]}>
                {hasTrusted ? 'Trusted' : 'Mark as Trusted'}
              </Text>
            </TouchableOpacity>

            {profile?.phone && (
              <TouchableOpacity 
                style={styles.whatsappButton}
                onPress={handleWhatsAppPress}
              >
                <MessageCircle size={16} color="#25D366" />
                <Text style={styles.whatsappButtonText}>Contact</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalProducts}</Text>
            <Text style={styles.statLabel}>Products</Text>
          </View>
          <TouchableOpacity 
            style={styles.statItem}
            onPress={handleShowTrustMarks}
          >
            <Text style={[styles.statNumber, styles.statNumberClickable]}>
              {profile.trust_count}
            </Text>
            <Text style={[styles.statLabel, styles.statLabelClickable]}>
              TrustMarks
            </Text>
          </TouchableOpacity>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile.sold_count}</Text>
            <Text style={styles.statLabel}>Transactions</Text>
          </View>
        </View>
      </View>

      <View style={styles.tabButtonsRowUser}>
        <TouchableOpacity
          style={[styles.tabButtonUser, activeTab === 'catalog' && styles.tabButtonActiveUser]}
          onPress={() => setActiveTab('catalog')}
        >
          <Text style={[styles.tabButtonTextUser, activeTab === 'catalog' && styles.tabButtonTextActiveUser]}>Catalog</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButtonUser, activeTab === 'requests' && styles.tabButtonActiveUser]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabButtonTextUser, activeTab === 'requests' && styles.tabButtonTextActiveUser]}>Requests</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.catalogSection}>
        {activeTab === 'catalog' && (
          <>
            {totalProducts === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No products in catalog</Text>
              </View>
            ) : (
              <View style={styles.categoriesContainer}>
                {Object.entries(productsByCategory).map(([category, products]) => 
                  renderCategorySection(category, products)
                )}
              </View>
            )}
          </>
        )}
        {activeTab === 'requests' && (
          <View style={styles.requestsSectionUser}>
            {loadingRequests ? (
              <Text style={styles.loadingText}>Loading requests...</Text>
            ) : requests.length === 0 ? (
              <Text style={styles.emptyText}>No requests found</Text>
            ) : (
              requests.map((req) => (
                <View key={req.id} style={styles.requestCardUser}>
                  <View style={styles.requestHeaderUser}>
                    <ClipboardList size={22} color="#6C5CE7" style={{ marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.requestTitleUser}>{req.cut} {req.min_weight}-{req.max_weight || req.min_weight}ct, {req.clarity}, Color {req.color}</Text>
                      {req.price && (
                        <Text style={styles.requestPriceUser}>Budget: {req.price} ₪</Text>
                      )}
                    </View>
                    <View style={[styles.requestStatusPillUser, req.status === 'active' ? styles.statusActiveUser : styles.statusOtherUser]}>
                      <Text style={styles.requestStatusTextUser}>{req.status === 'active' ? 'Active' : req.status}</Text>
                    </View>
                  </View>
                  <View style={styles.requestFooterUser}>
                    <Text style={styles.requestDateUser}>{new Date(req.created_at).toLocaleDateString()}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </View>

      <TrustMarksModal />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  loadingText: {
    fontSize: 16,
    color: '#888',
    fontFamily: 'Heebo-Regular',
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 4,
    backgroundColor: '#121212',
  },
  profileImageContainer: {
    marginBottom: 12,
    backgroundColor: '#2a2a2a',
    padding: 4,
    borderRadius: 64,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#2a2a2a',
  },
  userName: {
    fontSize: 24,
    fontFamily: 'Heebo-Bold',
    marginBottom: 2,
    textAlign: 'center',
    color: '#fff',
  },
  userTitle: {
    fontSize: 16,
    color: '#888',
    fontFamily: 'Heebo-Regular',
    marginBottom: 6,
    textAlign: 'center',
  },
  bioWebsiteContainer: {
    alignItems: 'center',
    gap: 2,
  },
  bio: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'Heebo-Regular',
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
    flexGrow: 0,
    flexShrink: 1,
  },
  websiteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2a2a2a',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  websiteText: {
    color: '#6C5CE7',
    fontSize: 14,
    fontFamily: 'Heebo-Regular',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  trustButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
  },
  trustButtonActive: {
    backgroundColor: '#6C5CE7',
  },
  trustButtonDisabled: {
    opacity: 0.6,
  },
  trustButtonText: {
    fontSize: 14,
    fontFamily: 'Heebo-Medium',
    color: '#6C5CE7',
  },
  trustButtonTextActive: {
    color: '#fff',
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
  },
  whatsappButtonText: {
    fontSize: 14,
    fontFamily: 'Heebo-Medium',
    color: '#25D366',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginVertical: 24,
    paddingVertical: 16,
    backgroundColor: '#1a1a1a',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  statNumber: {
    fontSize: 20,
    fontFamily: 'Heebo-Bold',
    color: '#6C5CE7',
  },
  statNumberClickable: {
    textDecorationLine: 'underline',
  },
  statLabel: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'Heebo-Regular',
  },
  statLabelClickable: {
    color: '#6C5CE7',
  },
  catalogSection: {
    paddingHorizontal: 20,
    backgroundColor: '#121212',
  },
  tabButtonsRowUser: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
    gap: 8,
  },
  tabButtonUser: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#23232b',
    borderRadius: 16,
    marginHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  tabButtonActiveUser: {
    backgroundColor: '#6C5CE7',
    borderColor: '#6C5CE7',
  },
  tabButtonTextUser: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Heebo-Medium',
  },
  tabButtonTextActiveUser: {
    color: '#fff',
    fontWeight: 'bold',
  },
  requestsSectionUser: {
    paddingHorizontal: 20,
    marginTop: 12,
  },
  requestCardUser: {
    backgroundColor: '#23232b',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#444',
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  requestHeaderUser: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requestTitleUser: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  requestPriceUser: {
    color: '#6C5CE7',
    fontSize: 15,
    marginBottom: 2,
    fontWeight: '500',
  },
  requestStatusPillUser: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginLeft: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  statusActiveUser: {
    backgroundColor: '#4CAF50',
  },
  statusOtherUser: {
    backgroundColor: '#888',
  },
  requestStatusTextUser: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  requestFooterUser: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  requestDateUser: {
    color: '#888',
    fontSize: 13,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    fontFamily: 'Heebo-Regular',
  },
  categoriesContainer: {
    gap: 24,
  },
  categorySection: {
    gap: 12,
  },
  categoryTitle: {
    fontSize: 18,
    fontFamily: 'Heebo-Bold',
    color: '#fff',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_SPACING,
  },
  productItem: {
    width: ITEM_WIDTH,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: undefined,
    aspectRatio: 1,
    backgroundColor: '#2a2a2a',
  },
  productDetails: {
    padding: 8,
  },
  productTitle: {
    fontSize: 14,
    fontFamily: 'Heebo-Medium',
    color: '#fff',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    fontFamily: 'Heebo-Bold',
    color: '#6C5CE7',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
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
  closeButton: {
    padding: 8,
  },
  trustMarksList: {
    padding: 20,
  },
  trustMarkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 12,
  },
  trustMarkAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1a1a1a',
  },
  trustMarkInfo: {
    flex: 1,
  },
  trustMarkName: {
    fontSize: 16,
    fontFamily: 'Heebo-Medium',
    color: '#fff',
    marginBottom: 2,
  },
  trustMarkTitle: {
    fontSize: 14,
    fontFamily: 'Heebo-Regular',
    color: '#888',
  },
  trustMarkDate: {
    fontSize: 12,
    fontFamily: 'Heebo-Regular',
    color: '#888',
  },
});