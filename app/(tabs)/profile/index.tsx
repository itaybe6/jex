import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, Modal, Linking, Alert, Animated, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlatList } from 'react-native';
import { useProfile } from '../../context/ProfileContext';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabaseApi';
import { useFocusEffect } from '@react-navigation/native';
import { CategorySpecsDisplay } from '../../../components/CategorySpecsDisplay';
import { CATEGORY_ICONS } from '../../../components/CategoryIcons';
const userDefaultImage = require('../../../assets/images/user.jpg');

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
  const { profile, productsByCategory, loading } = useProfile();
  const [showAllCategories, setShowAllCategories] = useState<Record<string, boolean>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'catalog' | 'requests'>('catalog');
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [hasExchangeCertificate, setHasExchangeCertificate] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  React.useEffect(() => {
    if (user?.id) {
      checkExchangeCertificate(user.id);
    }
  }, [user]);

  const checkExchangeCertificate = async (profileId: string) => {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/exchange_certificates?select=status&profile_id=eq.${profileId}`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY!,
            Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          } as HeadersInit,
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

  const handleUserPress = (userId: string) => {
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
    router.push('../settings');
  };

  const fetchUserProducts = async () => {
    if (!user) return;

    const query = 'id,name,price,images,category_id,profiles(id,full_name)';
    const url = `${SUPABASE_URL}/rest/v1/products?user_id=eq.${user.id}&select=${encodeURIComponent(query)}&order=created_at.desc`;
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      } as HeadersInit,
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
        'Content-Type': 'application/json',
      } as HeadersInit,
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
                    {product.id ? renderProductItem(product) : (
                      <AddProductButton onPress={() => router.push('/add')} />
                    )}
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

  const fetchUserRequests = async () => {
    if (!user) return;
    setLoadingRequests(true);
    try {
      const url = `${SUPABASE_URL}/rest/v1/requests?user_id=eq.${user.id}&select=*&order=created_at.desc`;
      const res = await fetch(url, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        } as HeadersInit,
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

  useEffect(() => {
    if (activeTab === 'requests' && user) {
      fetchUserRequests();
    }
  }, [activeTab, user]);

  const handleRequestPress = (req: any) => {
    setSelectedRequest(req);
    setShowDetailsModal(true);
  };

  const handleDeleteRequest = async (requestId: string) => {
    Alert.alert(
      'Delete Request',
      'Are you sure you want to delete this request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await fetch(`${SUPABASE_URL}/rest/v1/requests?id=eq.${requestId}`, {
              method: 'DELETE',
              headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
              },
            });
            fetchUserRequests();
          },
        },
      ]
    );
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
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
              source={
                profile.avatar_url
                  ? { uri: profile.avatar_url + `?t=${new Date().getTime()}` }
                  : userDefaultImage
              }
              style={styles.profileImage}
            />
            {hasExchangeCertificate && (
              <View style={styles.certificateBadge}>
                <Image
                  source={require('../../../assets/images/exchange.png')}
                  style={styles.certificateBadgeImage}
                />
              </View>
            )}
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
            <TouchableOpacity style={styles.statItem} onPress={() => router.push('/profile/trustmarks')}>
              <Text style={styles.statNumber}>{profile.trust_count ?? 0}</Text>
              <Text style={styles.statLabel}>TrustMarks</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statItem} onPress={() => router.push({ pathname: '/profile/transactions', params: { fromProfileType: 'self' } })}>
              <Text style={styles.statNumber}>{profile.sold_count}</Text>
              <Text style={styles.statLabel}>Transactions</Text>
            </TouchableOpacity>
          </View>
          {/* New Holds Button - modern chip style */}
          <TouchableOpacity style={styles.holdsButton} onPress={() => router.push('/profile/holds')}>
            <Ionicons name="lock-closed-outline" size={18} color="#0E2657" style={{ marginRight: 6 }} />
            <Text style={styles.holdsButtonText}>View Holds</Text>
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
                <View key={req.id} style={[styles.productCard, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, minWidth: '100%', maxWidth: '100%' }]}> 
                  <View style={{ marginRight: 12 }}>
                    {CATEGORY_ICONS[req.category] ? CATEGORY_ICONS[req.category]() : null}
                  </View>
                  <TouchableOpacity style={{ flex: 1 }} onPress={() => handleRequestPress(req)}>
                    <Text style={{ color: '#7B8CA6', fontFamily: 'Montserrat-Bold', fontSize: 14, marginBottom: 4 }}>
                      {req.category}
                    </Text>
                    <Text style={{ fontFamily: 'Montserrat-Bold', color: '#0E2657', fontSize: 15, marginBottom: 2 }}>
                      {req.title || 'No Title'}
                    </Text>
                    {req.description && (
                      <Text style={{ fontFamily: 'Montserrat-Regular', color: '#4A5568', fontSize: 14, marginBottom: 2 }}>
                        {req.description}
                      </Text>
                    )}
                    <Text style={{ color: '#7B8CA6', fontFamily: 'Montserrat-Regular', fontSize: 13 }}>
                      {formatTimeAgo(req.created_at)}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteRequest(req.id)} style={{ marginLeft: 12 }}>
                    <Ionicons name="trash" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              ))
            )}
            {/* מודל פרטי בקשה */}
            {showDetailsModal && selectedRequest && (
              <Modal
                visible={showDetailsModal}
                animationType="slide"
                transparent
                onRequestClose={() => setShowDetailsModal(false)}
              >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
                  <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 0, width: '95%', maxHeight: '90%' }}>
                    <TouchableOpacity onPress={() => setShowDetailsModal(false)} style={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}>
                      <Ionicons name="close" size={24} color="#0E2657" />
                    </TouchableOpacity>
                    <ScrollView style={{ marginTop: 24 }} contentContainerStyle={{ paddingBottom: 24, paddingHorizontal: 18 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                        <Image
                          source={{ uri: profile.avatar_url || 'https://www.gravatar.com/avatar/?d=mp' }}
                          style={{ width: 44, height: 44, borderRadius: 22, marginRight: 12 }}
                        />
                        <View>
                          <Text style={{ fontFamily: 'Montserrat-Bold', fontSize: 16, color: '#0E2657' }}>{profile.full_name}</Text>
                          <Text style={{ fontFamily: 'Montserrat-Regular', fontSize: 13, color: '#7B8CA6' }}>{formatTimeAgo(selectedRequest.created_at)}</Text>
                        </View>
                      </View>
                      <Text style={{ fontFamily: 'Montserrat-Bold', fontSize: 18, color: '#0E2657', marginBottom: 4 }}>{selectedRequest.title || 'No Title'}</Text>
                      {selectedRequest.description && (
                        <Text style={{ fontFamily: 'Montserrat-Regular', color: '#4A5568', fontSize: 15, marginBottom: 12 }}>{selectedRequest.description}</Text>
                      )}
                      <Text style={{ fontFamily: 'Montserrat-Bold', fontSize: 16, color: '#0E2657', marginBottom: 8 }}>Specifications</Text>
                      <CategorySpecsDisplay category={selectedRequest.category} details={selectedRequest.details} />
                    </ScrollView>
                  </View>
                </View>
              </Modal>
            )}
          </View>
        )}
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
    overflow: 'visible',
    zIndex: 2,
    alignSelf: 'center',
    position: 'relative',
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
    backgroundColor: '#F5F8FC',
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
  holdsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderColor: '#0E2657',
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginTop: 18,
    marginBottom: 8,
    shadowColor: '#0E2657',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  holdsButtonText: {
    color: '#0E2657',
    fontFamily: 'Montserrat-Bold',
    fontSize: 15,
  },
});

const AddProductButton = ({ onPress }: { onPress: () => void }) => {
  const scale = React.useRef(new Animated.Value(1)).current;
  const [pressed, setPressed] = React.useState(false);

  const handlePressIn = () => {
    setPressed(true);
    Animated.spring(scale, {
      toValue: 0.93,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  };
  const handlePressOut = () => {
    setPressed(false);
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{flex:1, justifyContent:'center', alignItems:'center', width:'100%', height:'100%'}}
    >
      <Animated.View style={{
        backgroundColor: pressed ? '#E3EAF3' : '#F5F8FC',
        borderRadius: 12,
        width: '90%',
        height: '90%',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E3EAF3',
        shadowColor: '#0E2657',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
        transform: [{ scale }],
      }}>
        <View style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: '#fff',
          borderWidth: 1.5,
          borderColor: '#E3EAF3',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 6,
        }}>
          <Ionicons name="add" size={28} color="#B0B8C9" />
        </View>
        <Text style={{fontFamily:'Montserrat-Medium', color:'#B0B8C9', fontSize:13}}>Add Product</Text>
      </Animated.View>
    </Pressable>
  );
};