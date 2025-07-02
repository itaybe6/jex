import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, Alert, Modal, Linking } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
// import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

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
  status?: string;
};

type ProductsByCategory = {
  [key: string]: Product[];
};

export default function UserProfileScreen() {
  const params = useLocalSearchParams();
  const userId = typeof params.id === 'string' ? params.id : '';
  const { user, accessToken } = useAuth();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [productsByCategory, setProductsByCategory] = useState<ProductsByCategory>({});
  const [loading, setLoading] = useState(true);
  const [hasTrusted, setHasTrusted] = useState(false);
  const [trustLoading, setTrustLoading] = useState(false);
  const [showTrustMarks, setShowTrustMarks] = useState(false);
  const [loadingTrustMarks, setLoadingTrustMarks] = useState(false);
  const [trustMarks, setTrustMarks] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'catalog' | 'requests'>('catalog');
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [soldCount, setSoldCount] = useState<number>(0);
  const [hasExchangeCertificate, setHasExchangeCertificate] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchProfile();
      fetchProducts();
      fetchUserRequests();
      fetchTrustMarks();
      if (user) {
        checkTrustStatus();
      }
      fetchSoldCount();
      checkExchangeCertificate(userId);
    }
  }, [userId, user]);

  const fetchProfile = async () => {
    try {
      // שלב 1: שלוף את הפרופיל
      const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*`, {
        headers: {
          apikey: SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      if (!profileRes.ok) throw new Error(await profileRes.text());
      const profileArr = await profileRes.json();
      if (!profileArr || !profileArr[0]) throw new Error('Profile not found');
      const profileData = profileArr[0];

      // שלב 2: שלוף את כמות העסקאות שהושלמו
      const txRes = await fetch(`${SUPABASE_URL}/rest/v1/transactions?select=id&or=(seller_id.eq.${userId},buyer_id.eq.${userId})&status=eq.completed`, {
        headers: {
          apikey: SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      let sold_count = 0;
      if (txRes.ok) {
        const txArr = await txRes.json();
        sold_count = Array.isArray(txArr) ? txArr.length : 0;
      }
      setProfile({ ...profileData, sold_count });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const checkTrustStatus = async () => {
    try {
      if (!user) return;
      const res = await fetch(`${SUPABASE_URL}/rest/v1/trust_marks?select=id&truster_id=eq.${user.id}&trusted_id=eq.${userId}`, {
        headers: {
          apikey: SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setHasTrusted(Array.isArray(data) && data.length > 0);
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
        // מחיקת trust mark
        const res = await fetch(`${SUPABASE_URL}/rest/v1/trust_marks?truster_id=eq.${user.id}&trusted_id=eq.${userId}`, {
          method: 'DELETE',
          headers: {
            apikey: SUPABASE_ANON_KEY!,
            Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
        });
        if (!res.ok) throw new Error(await res.text());
        setHasTrusted(false);
      } else {
        // יצירת trust mark
        const res = await fetch(`${SUPABASE_URL}/rest/v1/trust_marks`, {
          method: 'POST',
          headers: {
            apikey: SUPABASE_ANON_KEY!,
            Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
          },
          body: JSON.stringify({
            truster_id: user.id,
            trusted_id: userId
          })
        });
        if (!res.ok) throw new Error(await res.text());
        setHasTrusted(true);

        // הוספת התראה למשתמש שקיבל את ה-Trusted (כולל שם ותמונה של השולח)
        let fromUserName = user?.user_metadata?.full_name || user?.email || null;
        let fromUserAvatar = user?.avatar_url || user?.user_metadata?.avatar_url || null;
        if (!fromUserAvatar && profile && user.id === profile.id && profile.avatar_url) {
          fromUserAvatar = profile.avatar_url;
        }
        if (!fromUserAvatar) {
          fromUserAvatar = 'https://ui-avatars.com/api/?background=0E2657&color=fff&name=' + encodeURIComponent(fromUserName || 'User');
        }
        // debug
        console.log('DEBUG TRUSTMARK NOTIFICATION:');
        console.log('user:', user);
        console.log('user.user_metadata:', user?.user_metadata);
        console.log('user.avatar_url:', user?.avatar_url);
        console.log('profile:', profile);
        console.log('fromUserName:', fromUserName);
        console.log('fromUserAvatar:', fromUserAvatar);
        try {
          await fetch(`${SUPABASE_URL}/rest/v1/notifications`, {
            method: 'POST',
            headers: {
              apikey: SUPABASE_ANON_KEY!,
              Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
              Prefer: 'return=representation',
            },
            body: JSON.stringify({
              user_id: userId,
              type: 'trustmark',
              read: false,
              is_action_done: false,
              data: {
                message: `${fromUserName || 'Someone'} marked you as Trusted!`,
                from_user_id: user.id,
                from_user_name: fromUserName,
                from_user_avatar: fromUserAvatar
              },
              product_id: null
            })
          });
        } catch (e) {
          // אפשר להוסיף טיפול בשגיאה אם תרצה
        }
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
    router.push({ pathname: '/user/[id]', params: { id: userId } });
  };

  const fetchTrustMarks = async () => {
    try {
      setLoadingTrustMarks(true);
      const res = await fetch(`${SUPABASE_URL}/rest/v1/trust_marks?select=id,created_at,truster:truster_id(id,full_name,avatar_url,title)&trusted_id=eq.${userId}&order=created_at.desc`, {
        headers: {
          apikey: SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setTrustMarks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching trust marks:', error);
      Alert.alert('Error', 'Failed to load trust marks');
    } finally {
      setLoadingTrustMarks(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/products?select=id,title,price,category,status,product_images(image_url)&user_id=eq.${userId}&order=created_at.desc`, {
        headers: {
          apikey: SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      // Filter only products with status 'available' or 'hold'
      const filtered = (data || []).filter((product: any) => product.status === 'available' || product.status === 'hold');
      // קיבוץ לפי קטגוריה, עם תמונה ראשית מהמוצר
      const grouped = filtered.reduce((acc: ProductsByCategory, product: any) => {
        const image_url = product.product_images?.[0]?.image_url || null;
        const productWithImage = { ...product, image_url };
        if (!acc[product.category]) acc[product.category] = [];
        acc[product.category].push(productWithImage);
        return acc;
      }, {} as ProductsByCategory);
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
      const res = await fetch(`${SUPABASE_URL}/rest/v1/requests?user_id=eq.${userId}&order=created_at.desc`, {
        headers: {
          apikey: SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setRequests([]);
    } finally {
      setLoadingRequests(false);
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
      onPress={() => router.push({ pathname: '/(tabs)/products/[id]', params: { id: product.id, userId } })}
    >
      <Image 
        source={{ uri: product.image_url || 'https://via.placeholder.com/150?text=No+Image' }} 
        style={styles.gridImage}
        resizeMode="cover"
      />
      {product.status === 'hold' && (
        <View style={styles.holdOverlay}>
          <Text style={styles.holdText}>HOLD</Text>
        </View>
      )}
      <View style={styles.gridItemOverlay}>
        <Text style={styles.gridItemTitle} numberOfLines={1}>{product.title}</Text>
        <Text style={styles.gridItemPrice}>${product.price.toLocaleString()}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderCategorySection = (category: string, products: Product[]) => (
    <View key={category} style={styles.categorySection}>
      <View style={styles.categoryTitleRow}>
        <Text style={styles.categoryTitle}>{category}</Text>
        <Text style={styles.itemsCount}>{products.length}</Text>
      </View>
      <View style={styles.gridContainer}>
        {products.slice(0, 3).map(product => renderProductItem(product))}
      </View>
      {products.length > 3 && (
        <TouchableOpacity
          onPress={() => {
            let backPath = '';
            if (userId === user?.id) {
              backPath = '/(tabs)/profile';
            } else {
              backPath = `/user/${userId}`;
            }
            router.push({
              pathname: '/(tabs)/category-products',
              params: { category, userId, backPath }
            });
          }}
          style={styles.showMoreButton}
        >
          <Text style={styles.showMoreText}>Show More</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const fetchSoldCount = async () => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/transactions?select=id&or=(seller_id.eq.${userId},buyer_id.eq.${userId})&status=eq.completed`, {
        headers: {
          apikey: SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setSoldCount(Array.isArray(data) ? data.length : 0);
    } catch (error) {
      setSoldCount(0);
      console.error('Error fetching sold count:', error);
    }
  };

  const checkExchangeCertificate = async (profileId: string) => {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/exchange_certificates?select=status&profile_id=eq.${profileId}`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY!,
            Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setHasExchangeCertificate(
        Array.isArray(data) && data.some((row) => row.status === 'completed' || row.status === 'הושלם')
      );
    } catch (error) {
      setHasExchangeCertificate(false);
    }
  };

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
        <View style={styles.profileCard}>
          <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
            {profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.defaultAvatar]}>
                <Ionicons name="person" size={50} color="#666" />
              </View>
            )}
            {hasExchangeCertificate && (
              <View style={styles.certificateBadge}>
                <Image
                  source={require('../../../assets/images/exchange.png')}
                  style={styles.certificateBadgeImage}
                />
              </View>
            )}
          </View>
          <Text style={styles.name}>{profile?.full_name}</Text>
          {profile?.title && <Text style={styles.title}>{profile.title}</Text>}
          {user?.id !== userId && (
            <TouchableOpacity
              style={styles.trustedBadgeBelow}
              onPress={handleTrustMark}
              disabled={trustLoading}
              activeOpacity={0.8}
            >
              <Ionicons name="shield-checkmark-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.trustedBadgeText}>{hasTrusted ? 'Trusted' : 'Mark as Trusted'}</Text>
            </TouchableOpacity>
          )}
          <View style={styles.websiteRow}>
            {profile?.website && (
              <Text style={styles.websiteText}>{profile.website}</Text>
            )}
          </View>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalProducts}</Text>
              <Text style={styles.statLabel}>Products</Text>
            </View>
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => setShowTrustMarks(true)}
            >
              <Text style={[styles.statValue, { textDecorationLine: 'underline' }]}>{trustMarks.length}</Text>
              <Text style={styles.statLabel}>TrustMark</Text>
            </TouchableOpacity>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{soldCount}</Text>
              <Text style={styles.statLabel}>Transactions</Text>
            </View>
          </View>
          <View style={styles.actionsContainer}>
            {profile?.phone && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.whatsappButton]}
                onPress={handleWhatsAppPress}
              >
                <Ionicons name="chatbubble-outline" size={20} color="#fff" />
                <Text style={[styles.actionButtonText, styles.whatsappButtonText]}>
                  WhatsApp
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}
        </View>
      </View>
      <View style={styles.catalogSection}>
        <View style={styles.tabButtonsRow}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'catalog' && styles.tabButtonActive]}
            onPress={() => setActiveTab('catalog')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'catalog' && styles.tabButtonTextActive]}>Catalog</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'requests' && styles.tabButtonActive]}
            onPress={() => setActiveTab('requests')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'requests' && styles.tabButtonTextActive]}>Requests</Text>
          </TouchableOpacity>
        </View>
        {activeTab === 'catalog' && (
          totalProducts === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No products in catalog</Text>
            </View>
          ) : (
            <View style={styles.categoriesContainer}>
              {Object.entries(productsByCategory).map(([category, products]) => 
                renderCategorySection(category, products)
              )}
            </View>
          )
        )}
        {activeTab === 'requests' && (
          <View style={styles.requestsSection}>
            {loadingRequests ? (
              <Text style={styles.loadingText}>Loading requests...</Text>
            ) : requests.length === 0 ? (
              <Text style={styles.emptyText}>No requests found</Text>
            ) : (
              requests.map((req) => (
                <View key={req.id} style={styles.requestCardImproved}>
                  <View style={styles.requestHeaderImproved}>
                    <Ionicons name="list-outline" size={22} color="#6C5CE7" style={{ marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.requestTitleImproved}>{req.cut} {req.min_weight}-{req.max_weight || req.min_weight}ct, {req.clarity}, Color {req.color}</Text>
                      {req.price && (
                        <Text style={styles.requestPriceImproved}>Budget: {req.price} ₪</Text>
                      )}
                    </View>
                    <View style={[styles.requestStatusPill, req.status === 'active' ? styles.statusActive : styles.statusOther]}>
                      <Text style={styles.requestStatusText}>{req.status === 'active' ? 'Active' : req.status}</Text>
                    </View>
                  </View>
                  <View style={styles.requestFooterImproved}>
                    <Text style={styles.requestDateImproved}>{new Date(req.created_at).toLocaleDateString()}</Text>
                  </View>
                </View>
              ))
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
                <Ionicons name="close" size={24} color="#000" />
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
    backgroundColor: '#F5F8FC',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F8FC',
  },
  loadingText: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Heebo-Regular',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
    backgroundColor: 'transparent',
    marginTop: 32,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginHorizontal: 24,
    marginTop: 32,
    paddingHorizontal: 0,
    paddingVertical: 24,
    alignItems: 'center',
    shadowColor: '#0E2657',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
    position: 'relative',
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: '#fff',
    backgroundColor: '#F5F8FC',
    marginTop: -60,
    marginBottom: 8,
  },
  name: {
    fontSize: 22,
    fontFamily: 'Montserrat-Bold',
    color: '#0E2657',
    marginTop: 4,
    marginBottom: 2,
    textAlign: 'center',
  },
  title: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 15,
    color: '#6C5CE7',
    marginBottom: 10,
    textAlign: 'center',
  },
  websiteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    justifyContent: 'center',
  },
  websiteText: {
    color: '#0E2657',
    fontFamily: 'Montserrat-Medium',
    fontSize: 15,
    textDecorationLine: 'underline',
    marginRight: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
    marginBottom: 0,
    paddingHorizontal: 24,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    color: '#0E2657',
  },
  statLabel: {
    fontSize: 14,
    color: '#7B8CA6',
    fontFamily: 'Montserrat-Regular',
  },
  actionsContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#E3EAF3',
    marginHorizontal: 4,
  },
  actionButtonActive: {
    backgroundColor: '#0E2657',
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    color: '#0E2657',
  },
  actionButtonTextActive: {
    color: '#fff',
  },
  catalogSection: {
    paddingHorizontal: 16,
    paddingTop: 0,
    marginTop: 20,
    borderTopWidth: 0,
    borderTopColor: 'transparent',
    backgroundColor: 'transparent',
  },
  tabButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
    gap: 8,
    paddingHorizontal: 20,
    width: '100%',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#E3EAF3',
    borderRadius: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#0E2657',
  },
  tabButtonText: {
    color: '#0E2657',
    fontFamily: 'Montserrat-Medium',
    fontSize: 16,
  },
  tabButtonTextActive: {
    color: '#fff',
    fontFamily: 'Montserrat-Bold',
  },
  requestsSection: {
    paddingHorizontal: 20,
    marginTop: 12,
  },
  requestCardImproved: {
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
  requestHeaderImproved: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requestTitleImproved: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  requestPriceImproved: {
    color: '#6C5CE7',
    fontSize: 15,
    marginBottom: 2,
    fontWeight: '500',
  },
  requestStatusPill: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginLeft: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  statusActive: {
    backgroundColor: '#4CAF50',
  },
  statusOther: {
    backgroundColor: '#888',
  },
  requestStatusText: {
    color: '#fff',
    fontSize: 13,
  },
  requestFooterImproved: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  requestDateImproved: {
    color: '#aaa',
    fontSize: 12,
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
    marginBottom: 28,
    marginTop: 0,
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 0,
    paddingHorizontal: 2,
  },
  categoryTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    color: '#0E2657',
    marginBottom: 0,
  },
  itemsCount: {
    fontSize: 13,
    color: '#7B8CA6',
    fontFamily: 'Montserrat-Medium',
    marginLeft: 8,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridItem: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
    shadowColor: '#0E2657',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  gridItemOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(14,38,87,0.85)',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  gridItemTitle: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Montserrat-Bold',
    marginBottom: 2,
  },
  gridItemPrice: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Montserrat-Medium',
  },
  showMoreButton: {
    padding: 8,
    backgroundColor: '#0E2657',
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    width: 120,
    alignSelf: 'center',
  },
  showMoreText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Montserrat-Medium',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
    marginHorizontal: 0,
    marginTop: 16,
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
  holdOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    zIndex: 5,
  },
  holdText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Heebo-Bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    overflow: 'hidden',
  },
  trustedBadgeBelow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E2657',
    borderRadius: 18,
    paddingVertical: 4,
    paddingHorizontal: 14,
    marginTop: 8,
    marginBottom: 14,
    alignSelf: 'center',
  },
  trustedBadgeText: {
    color: '#fff',
    fontFamily: 'Montserrat-Bold',
    fontSize: 12,
    marginLeft: 2,
  },
  certificateBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 10,
  },
  certificateBadgeImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
    resizeMode: 'contain',
  },
});