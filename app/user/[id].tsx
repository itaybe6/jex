import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, Alert, Modal, Linking } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Link as LinkIcon, Shield, X, MessageCircle } from 'lucide-react-native';
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

  useEffect(() => {
    if (userId) {
      fetchProfile();
      fetchProducts();
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
      style={styles.gridItem}
      onPress={() => handleProductPress(product.id)}
    >
      <Image 
        source={{ uri: product.image_url }} 
        style={styles.gridImage}
        resizeMode="cover"
      />
      <View style={styles.gridItemOverlay}>
        <Text style={styles.gridItemTitle} numberOfLines={1}>{product.title}</Text>
        <Text style={styles.gridItemPrice}>${product.price.toLocaleString()}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderCategorySection = (category: string, products: Product[]) => (
    <View key={category} style={styles.categorySection}>
      <Text style={styles.categoryTitle}>{category}</Text>
      <View style={styles.gridContainer}>
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
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Trusted By</Text>
            <TouchableOpacity 
              onPress={() => setShowTrustMarks(false)}
              style={styles.modalCloseButton}
            >
              <X size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {loadingTrustMarks ? (
            <View style={styles.modalLoadingContainer}>
              <Text style={styles.modalLoadingText}>Loading...</Text>
            </View>
          ) : trustMarks.length > 0 ? (
            <ScrollView style={styles.modalBody}>
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
            <View style={styles.modalEmptyContainer}>
              <Text style={styles.modalEmptyText}>No trust marks yet</Text>
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
              <LinkIcon size={16} color="#007AFF" />
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
              <Shield size={16} color={hasTrusted ? '#fff' : '#007AFF'} />
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

      <View style={styles.catalogSection}>
        <Text style={styles.catalogTitle}>Catalog</Text>
        
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
      </View>

      <TrustMarksModal />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Heebo-Regular',
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 4,
  },
  profileImageContainer: {
    marginBottom: 12,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  userName: {
    fontSize: 24,
    fontFamily: 'Heebo-Bold',
    marginBottom: 2,
    textAlign: 'center',
  },
  userTitle: {
    fontSize: 16,
    color: '#666',
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
    color: '#666',
    textAlign: 'center',
    lineHeight: 14,
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
    backgroundColor: '#f5f5f5',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  websiteText: {
    color: '#007AFF',
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
    backgroundColor: '#f0f9ff',
  },
  trustButtonActive: {
    backgroundColor: '#007AFF',
  },
  trustButtonDisabled: {
    opacity: 0.6,
  },
  trustButtonText: {
    fontSize: 14,
    fontFamily: 'Heebo-Medium',
    color: '#007AFF',
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
    backgroundColor: '#E8F8F0',
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
    marginBottom: 0,
    paddingVertical: 2,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  statNumber: {
    fontSize: 20,
    fontFamily: 'Heebo-Bold',
    color: '#007AFF',
  },
  statNumberClickable: {
    textDecorationLine: 'underline',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Heebo-Regular',
  },
  statLabelClickable: {
    color: '#007AFF',
  },
  catalogSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  catalogTitle: {
    fontSize: 20,
    fontFamily: 'Heebo-Bold',
    marginBottom: 20,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Heebo-Bold',
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
    color: '#333',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_SPACING,
  },
  gridItem: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH,
    marginBottom: GRID_SPACING,
  },
  gridImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  gridItemOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  gridItemTitle: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Heebo-Medium',
  },
  gridItemPrice: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Heebo-Bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Heebo-Bold',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  modalLoadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  modalLoadingText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Heebo-Regular',
  },
  modalEmptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  modalEmptyText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Heebo-Regular',
  },
  trustMarkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  trustMarkAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  trustMarkInfo: {
    flex: 1,
  },
  trustMarkName: {
    fontSize: 16,
    fontFamily: 'Heebo-Medium',
    marginBottom: 2,
  },
  trustMarkTitle: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Heebo-Regular',
  },
});