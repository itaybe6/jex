import React from 'react';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, Modal, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabaseApi';
import { useAuth } from '@/hooks/useAuth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlatList } from 'react-native';

const GRID_SPACING = 8; // Increased spacing between items
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
  sold_count_aggregate?: { count: number }[];
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
  category: string;
  product_images?: {
    id: string;
    image_url: string;
  }[];
  status?: string;
};

type ProductsByCategory = {
  [key: string]: Product[];
};

type Category = {
  id: string;
  name: string;
  products: Product[];
};

export default function ProfileScreen() {
  const { user, accessToken } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [productsByCategory, setProductsByCategory] = useState<ProductsByCategory>({});
  const [loading, setLoading] = useState(true);
  const [showTrustMarks, setShowTrustMarks] = useState(false);
  const [trustMarks, setTrustMarks] = useState<TrustMark[]>([]);
  const [loadingTrustMarks, setLoadingTrustMarks] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState<Record<string, boolean>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'catalog' | 'requests'>('catalog');
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchProducts();
      fetchUserRequests();
    }
  }, [user]);

  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        fetchProfile();
        fetchProducts();
      }
    }, [user])
  );

  const fetchProfile = async () => {
    try {
      if (!user) return;

      // Get profile data
      const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=*`, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
        },
      });
      if (!profileRes.ok) {
        const err = await profileRes.text();
        console.error('Profile fetch error:', err);
        throw new Error('Error fetching profile');
      }
      const profileArr = await profileRes.json();
      const profileData = profileArr[0];

      // Get completed transactions count
      const txRes = await fetch(`${SUPABASE_URL}/rest/v1/transactions?or=(seller_id.eq.${user.id},buyer_id.eq.${user.id})&status=eq.completed&select=id`, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
        },
      });
      if (!txRes.ok) {
        const err = await txRes.text();
        console.error('Transactions fetch error:', err);
        throw new Error('Error fetching transactions');
      }
      const transactionsCount = await txRes.json();

      setProfile({
        ...profileData,
        sold_count: transactionsCount.length
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      if (!user) return;

      const query = '*,product_images:product_images_product_id_fkey(id,image_url)';
      const url = `${SUPABASE_URL}/rest/v1/products?user_id=eq.${user.id}&select=${encodeURIComponent(query)}&order=created_at.desc`;
      const res = await fetch(url, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
        },
      });
      if (!res.ok) throw new Error('Error fetching products');
      const data = await res.json();
      // Only show products with status 'available' or 'hold'
      const filtered = (data || []).filter((product: Product) => product.status === 'available' || product.status === 'hold');
      // Group products by category
      const grouped = filtered.reduce((acc: ProductsByCategory, product: Product) => {
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

  const fetchTrustMarks = async () => {
    try {
      if (!user) return;
      setLoadingTrustMarks(true);
      const query = 'id,created_at,truster:profiles!trust_marks_truster_id_fkey(id,full_name,avatar_url,title)';
      const url = `${SUPABASE_URL}/rest/v1/trust_marks?trusted_id=eq.${user.id}&select=${encodeURIComponent(query)}&order=created_at.desc`;
      const res = await fetch(url, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
        },
      });
      if (!res.ok) throw new Error('Error fetching trust marks');
      const data = await res.json();
      setTrustMarks(data.map((trustMark: any) => ({
        id: trustMark.id,
        created_at: trustMark.created_at,
        truster: trustMark.truster,
      })) || []);
    } catch (error) {
      console.error('Error fetching trust marks:', error);
    } finally {
      setLoadingTrustMarks(false);
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

  const handleEditProfile = () => {
    router.push('/profile/edit');
  };

  const handleProductPress = (productId: string) => {
    router.push({
      pathname: "/profile/product/[id]",
      params: { id: productId }
    });
  };

  const handleWebsitePress = async () => {
    if (profile?.website) {
      const url = profile.website.startsWith('http') ? profile.website : `https://${profile.website}`;
      try {
        await Linking.openURL(url);
      } catch (e) {
        // אפשר להוסיף הודעת שגיאה אם תרצה
      }
    }
  };

  const handleSettingsPress = () => {
    router.push('/(tabs)/settings');
  };

  const fetchUserProducts = async () => {
    if (!user) return;

    const query = 'id,name,price,images,category_id,profiles(id,full_name)';
    const url = `${SUPABASE_URL}/rest/v1/products?user_id=eq.${user.id}&select=${encodeURIComponent(query)}&order=created_at.desc`;
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
      },
    });
    if (!res.ok) {
      console.error('Error fetching products:', await res.text());
      return;
    }
    const userProducts = await res.json();
    // Group products by category
    const catRes = await fetch(`${SUPABASE_URL}/rest/v1/categories?select=*&order=name`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
      },
    });
    const categoriesData = await catRes.json();
    if (categoriesData) {
      const groupedProducts = categoriesData.map((category: any) => ({
        ...category,
        products: userProducts?.filter((product: any) => product.category_id === category.id) || []
      }));
      setCategories(groupedProducts);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const renderProductItem = (product: Product) => {
    const imageUrl = product.product_images?.[0]?.image_url || 'https://via.placeholder.com/150';

    return (
      <TouchableOpacity
        key={product.id}
        style={styles.gridItem}
        onPress={() => handleProductPress(product.id)}
      >
        <Image
          source={{ uri: imageUrl }}
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
  };

  const renderCategorySection = (category: string, products: Product[]) => {
    const showAll = showAllCategories[category] || false;
    const productsToShow = showAll ? products : products.slice(0, 3);

    // Calculate rows based on the number of products
    const rows = Math.ceil(productsToShow.length / NUM_COLUMNS);
    const productsToRender = [...productsToShow];

    // Pad the array with null values to maintain grid structure
    const remainder = productsToShow.length % NUM_COLUMNS;
    if (remainder !== 0) {
      for (let i = 0; i < NUM_COLUMNS - remainder; i++) {
        productsToRender.push({
          id: '',
          title: '',
          price: 0,
          category: '',
          product_images: []
        });
      }
    }

    return (
      <View key={category} style={styles.categorySection}>
        <View style={styles.categoryHeader}>
          <Text style={styles.categoryTitle}>{category}</Text>
          <Text style={styles.categoryCount}>
            {products.length} {products.length === 1 ? 'item' : 'items'}
          </Text>
        </View>
        <View style={styles.gridContainer}>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <View style={styles.gridRow} key={rowIndex}>
              {productsToRender
                .slice(rowIndex * NUM_COLUMNS, (rowIndex + 1) * NUM_COLUMNS)
                .map((product, colIndex) => (
                  <View key={colIndex} style={styles.gridItem}>
                    {product.id ? renderProductItem(product) : null}
                  </View>
                ))}
            </View>
          ))}
        </View>
        {products.length > 3 && (
          <TouchableOpacity
            onPress={() => router.push({
              pathname: '/(tabs)/category-products',
              params: { category, userId: user?.id, backPath: '/(tabs)/profile' }
            })}
            style={styles.showMoreButton}
          >
            <Text style={styles.showMoreText}>Show More</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

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
              <Ionicons name="close" size={24} color="#fff" />
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

  const fetchUserRequests = async () => {
    if (!user) return;
    setLoadingRequests(true);
    try {
      const url = `${SUPABASE_URL}/rest/v1/requests?user_id=eq.${user.id}&select=*&order=created_at.desc`;
      const res = await fetch(url, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
        },
      });
      if (!res.ok) throw new Error('Error fetching requests');
      const data = await res.json();
      setRequests(data || []);
    } catch (err) {
      setRequests([]);
    } finally {
      setLoadingRequests(false);
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F8FC' }} edges={[ 'left', 'right', ]}>
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ paddingBottom: 0 }}
      >
        {/* User Card */}
        <View style={[styles.userCard, { marginTop: 100, paddingTop: 0 }]}>
          <TouchableOpacity onPress={handleSettingsPress} style={styles.settingsIconButton}>
            <Ionicons name="settings-outline" size={28} color="#0E2657" />
          </TouchableOpacity>
          <View style={styles.profileImageWrapper}>
            <Image
              source={{
                uri: profile.avatar_url
                  ? profile.avatar_url + `?t=${new Date().getTime()}`
                  : 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=800&auto=format&fit=crop&q=60'
              }}
              style={styles.profileImage}
            />
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditProfile}
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
          <Text style={styles.userName}>{profile.full_name}</Text>
          {profile.title ? <Text style={styles.userTitle}>{profile.title}</Text> : null}
          {profile.website ? (
            <TouchableOpacity onPress={handleWebsitePress} style={styles.websiteRow}>
              <Text style={styles.websiteText} numberOfLines={1}>
                {profile.website}
              </Text>
              <Ionicons name="link" size={16} color="#007AFF" style={{ marginRight: 4 }} />
            </TouchableOpacity>
          ) : null}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{totalProducts}</Text>
              <Text style={styles.statLabel}>Products</Text>
            </View>
            <TouchableOpacity style={styles.statItem} onPress={handleShowTrustMarks}>
              <Text style={styles.statNumber}>{profile.trust_count}</Text>
              <Text style={styles.statLabel}>TrustMarks</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statItem} onPress={() => router.push({ pathname: '/profile/transactions', params: { fromProfileType: 'self' } })}>
              <Text style={styles.statNumber}>{profile.sold_count}</Text>
              <Text style={styles.statLabel}>Transactions</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={{
              backgroundColor: '#0E2657',
              padding: 12,
              borderRadius: 8,
              marginVertical: 12,
              alignItems: 'center',
            }}
            onPress={() => router.push('/profile/holds')}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>View Holds</Text>
          </TouchableOpacity>
        </View>

        {/* Navigation Tabs */}
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

        {/* Category/Product Cards */}
        {activeTab === 'catalog' && (
          totalProducts > 0 ? (
            <View style={styles.categoriesContainer}>
              {Object.entries(productsByCategory).map(([category, products]) =>
                renderCategorySection(category, products)
              )}
            </View>
          ) : (
            <View style={{ alignItems: 'center', margin: 32 }}>
              <Text style={{ fontFamily: 'Montserrat-Bold', fontSize: 18, color: '#0E2657', marginBottom: 8 }}>No products in catalog</Text>
              <Text style={{ fontFamily: 'Montserrat-Regular', fontSize: 14, color: '#7B8CA6', textAlign: 'center' }}>Click 'Add Product' to get started</Text>
            </View>
          )
        )}
        {activeTab === 'requests' && (
          <View style={styles.requestsSection}>
            {loadingRequests ? (
              <Text style={{ fontFamily: 'Montserrat-Regular', fontSize: 16, color: '#0E2657' }}>Loading requests...</Text>
            ) : requests.length === 0 ? (
              <Text style={{ fontFamily: 'Montserrat-Bold', fontSize: 18, color: '#0E2657', marginTop: 32, textAlign: 'center' }}>No requests found</Text>
            ) : (
              requests.map((req) => (
                <View key={req.id} style={[styles.productCard, { flexDirection: 'column', alignItems: 'flex-start', marginBottom: 16, minWidth: '100%', maxWidth: '100%' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Ionicons name="list" size={22} color="#6C5CE7" style={{ marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: 'Montserrat-Bold', color: '#0E2657', fontSize: 15, marginBottom: 2 }}>{req.details.weight_from}-{req.details.weight_to || req.details.weight_from}ct, {req.details.clarity}, Color {req.details.color}</Text>
                      {req.details.price && (
                        <Text style={{ fontFamily: 'Montserrat-Medium', color: '#6C5CE7', fontSize: 14, marginBottom: 2 }}>Budget: {req.details.price} ₪</Text>
                      )}
                    </View>
                    <View style={{ borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4, alignSelf: 'flex-start', marginLeft: 8, minWidth: 60, alignItems: 'center', backgroundColor: req.details.status === 'active' ? '#4CAF50' : '#888' }}>
                      <Text style={{ color: '#fff', fontFamily: 'Montserrat-Bold', fontSize: 13 }}>{req.details.status === 'active' ? 'Active' : req.details.status}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 6, width: '100%' }}>
                    <Text style={{ color: '#7B8CA6', fontFamily: 'Montserrat-Regular', fontSize: 13 }}>{new Date(req.created_at).toLocaleDateString()}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
        <TrustMarksModal />
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Montserrat-Regular',
  },
  content: {
    flex: 1,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    overflow: 'visible',
    shadowColor: '#0E2657',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  profileImageWrapper: {
    marginTop: -60,
    marginBottom: 8,
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#fff',
    backgroundColor: '#F5F8FC',
    overflow: 'hidden',
    zIndex: 2,
    alignSelf: 'center',
  },
  profileImage: {
    width: 112,
    height: 112,
    borderRadius: 56,
  },
  editButton: {
    backgroundColor: '#0E2657',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
  },
  editButtonText: {
    color: '#fff',
    fontFamily: 'Montserrat-Bold',
    fontSize: 14,
  },
  userName: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 22,
    color: '#0E2657',
    marginTop: 4,
    marginBottom: 2,
    textAlign: 'center',
  },
  userTitle: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 15,
    color: '#6C5CE7',
    marginBottom: 10,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
    marginBottom: 0,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    color: '#0E2657',
  },
  statLabel: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 13,
    color: '#7B8CA6',
  },
  tabButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
    gap: 8,
    paddingHorizontal: 20,
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
  categoriesContainer: {
    gap: 32,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  categorySection: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    color: '#0E2657',
  },
  categoryCount: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 13,
    color: '#7B8CA6',
  },
  productsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    flex: 1,
    alignItems: 'center',
    padding: 10,
    shadowColor: '#0E2657',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    minWidth: 90,
    maxWidth: 110,
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#E3EAF3',
  },
  productTitle: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 13,
    color: '#0E2657',
    textAlign: 'center',
    marginBottom: 2,
  },
  productPrice: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 13,
    color: '#6C5CE7',
    textAlign: 'center',
  },
  requestsSection: {
    paddingHorizontal: 20,
    marginTop: 12,
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
    fontFamily: 'Montserrat-Bold',
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
    color: '#888',
    fontFamily: 'Montserrat-Regular',
  },
  modalEmptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  modalEmptyText: {
    fontSize: 16,
    color: '#888',
    fontFamily: 'Montserrat-Regular',
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
    fontFamily: 'Montserrat-Medium',
    marginBottom: 2,
    color: '#fff',
  },
  trustMarkTitle: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'Montserrat-Regular',
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  showMoreText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    color: '#6C5CE7',
  },
  showMoreIcon: {
    transform: [{ rotate: '0deg' }],
  },
  showMoreIconRotated: {
    transform: [{ rotate: '90deg' }],
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: GRID_SPACING,
  },
  gridContainer: {
    width: '100%',
  },
  gridItem: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH,
    marginBottom: GRID_SPACING,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridItemOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 8,
  },
  gridItemTitle: {
    fontSize: 14,
    fontFamily: 'Montserrat-Bold',
    color: '#fff',
  },
  gridItemPrice: {
    fontSize: 12,
    fontFamily: 'Montserrat-Regular',
    color: '#fff',
  },
  websiteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 2,
    gap: 4,
  },
  websiteText: {
    color: '#007AFF',
    fontSize: 15,
    fontFamily: 'Montserrat-Medium',
    textDecorationLine: 'underline',
    maxWidth: 200,
  },
  settingsIconButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    backgroundColor: 'transparent',
    padding: 4,
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
    fontFamily: 'Montserrat-Bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    overflow: 'hidden',
  },
});