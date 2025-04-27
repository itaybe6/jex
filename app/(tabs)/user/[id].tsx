import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, Alert, Modal, Linking } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Link as LinkIcon, Shield, X, MessageCircle, User } from 'lucide-react-native';
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
  trust_count: number;
  sold_count: number;
  phone: string | null;
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
  const [loadingTrustMarks, setLoadingTrustMarks] = useState(false);
  const [trustMarks, setTrustMarks] = useState<any[]>([]);

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

  const handleWebsitePress = async () => {
    if (profile?.website) {
      const url = profile.website.startsWith('http') ? profile.website : `https://${profile.website}`;
      window.open(url, '_blank');
    }
  };

  const handleProductPress = (productId: string) => {
    router.push(`/profile/product/${productId}`);
  };

  const handleTrustMarksPress = () => {
    setShowTrustMarks(true);
    fetchTrustMarks();
  };

  const handleUserPress = (userId: string) => {
    setShowTrustMarks(false);
    router.push(`/profile/${userId}`);
  };

  const fetchTrustMarks = async () => {
    try {
      setLoadingTrustMarks(true);
      const { data, error } = await supabase
        .from('trust_marks')
        .select(`
          id,
          truster:truster_id (
            id,
            full_name,
            avatar_url,
            title
          )
        `)
        .eq('trusted_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTrustMarks(data);
    } catch (error) {
      console.error('Error fetching trust marks:', error);
      Alert.alert('Error', 'Failed to load trust marks');
    } finally {
      setLoadingTrustMarks(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group products by category
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

  const handleWhatsAppPress = () => {
    if (profile?.phone) {
      // נקה את מספר הטלפון מכל תווים שאינם ספרות
      let phoneNumber = profile.phone.replace(/\D/g, '');
      
      // אם המספר מתחיל ב-0, הסר אותו
      if (phoneNumber.startsWith('0')) {
        phoneNumber = phoneNumber.substring(1);
      }
      
      // הוסף את קידומת ישראל
      phoneNumber = '972' + phoneNumber;
      
      // הכן את ההודעה המובנית
      const message = `היי ${profile.full_name}! 👋\nראיתי את המוצרים שלך באפליקציית JEX ואשמח לשמוע פרטים נוספים 💎`;
      
      // קודד את ההודעה ל-URL
      const encodedMessage = encodeURIComponent(message);
      
      // פתח את WhatsApp Web עם המספר וההודעה
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
      
      Linking.openURL(whatsappUrl).catch(err => {
        Alert.alert('שגיאה', 'לא ניתן לפתוח את WhatsApp');
      });
    } else {
      Alert.alert('שגיאה', 'למשתמש זה אין מספר טלפון זמין');
    }
  };

  const renderProductItem = (product: Product) => (
    <TouchableOpacity 
      key={product.id}
      style={styles.gridItem}
      onPress={() => router.push({ pathname: `/products/${product.id}`, params: { userId } })}
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
      <View style={styles.header}>
        {profile?.avatar_url ? (
          <Image
            source={{ uri: profile.avatar_url }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, styles.defaultAvatar]}>
            <User size={50} color="#666" />
        </View>
        )}
        <Text style={styles.name}>{profile?.full_name}</Text>
        {profile?.title && <Text style={styles.title}>{profile.title}</Text>}
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile?.trust_count || 0}</Text>
            <Text style={styles.statLabel}>Trust</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile?.sold_count || 0}</Text>
            <Text style={styles.statLabel}>Sales</Text>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          {user?.id !== userId && (
          <TouchableOpacity 
              style={[styles.actionButton, hasTrusted && styles.actionButtonActive]}
            onPress={handleTrustMark}
            disabled={trustLoading}
          >
              <Shield size={20} color={hasTrusted ? '#fff' : '#007AFF'} />
              <Text style={[styles.actionButtonText, hasTrusted && styles.actionButtonTextActive]}>
              {hasTrusted ? 'Trusted' : 'Mark as Trusted'}
            </Text>
          </TouchableOpacity>
        )}

          {profile?.phone && (
          <TouchableOpacity 
              style={[styles.actionButton, styles.whatsappButton]}
              onPress={handleWhatsAppPress}
          >
              <MessageCircle size={20} color="#fff" />
              <Text style={[styles.actionButtonText, styles.whatsappButtonText]}>
                WhatsApp
            </Text>
          </TouchableOpacity>
          )}

          {profile?.website && (
            <TouchableOpacity style={styles.actionButton} onPress={handleWebsitePress}>
              <LinkIcon size={20} color="#007AFF" />
              <Text style={styles.actionButtonText}>Website</Text>
            </TouchableOpacity>
          )}
        </View>

        {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  loadingText: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Heebo-Regular',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 4,
    backgroundColor: '#121212',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 12,
  },
  name: {
    fontSize: 24,
    fontFamily: 'Heebo-Bold',
    marginBottom: 2,
    textAlign: 'center',
    color: '#fff',
  },
  title: {
    fontSize: 16,
    color: '#aaa',
    fontFamily: 'Heebo-Regular',
    marginBottom: 6,
    textAlign: 'center',
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
  statValue: {
    fontSize: 20,
    fontFamily: 'Heebo-Bold',
    color: '#6C5CE7',
  },
  statLabel: {
    fontSize: 14,
    color: '#aaa',
    fontFamily: 'Heebo-Regular',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
  },
  actionButtonActive: {
    backgroundColor: '#6C5CE7',
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: 'Heebo-Medium',
    color: '#6C5CE7',
  },
  actionButtonTextActive: {
    color: '#fff',
  },
  catalogSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    backgroundColor: '#121212',
  },
  catalogTitle: {
    fontSize: 20,
    fontFamily: 'Heebo-Bold',
    marginBottom: 20,
    color: '#fff',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Heebo-Bold',
    color: '#fff',
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
  whatsappButton: {
    backgroundColor: '#25D366',
    marginHorizontal: 5,
  },
  whatsappButtonText: {
    color: '#fff',
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
  modalBody: {
    padding: 20,
  },
  modalLoadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  modalLoadingText: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Heebo-Regular',
  },
  modalEmptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  modalEmptyText: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Heebo-Regular',
  },
  trustMarkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
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
    color: '#fff',
  },
  trustMarkTitle: {
    fontSize: 14,
    color: '#aaa',
    fontFamily: 'Heebo-Regular',
  },
  defaultAvatar: {
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bio: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Heebo-Regular',
    marginTop: 12,
    textAlign: 'center',
  },
});