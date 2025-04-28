import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, Alert, Modal, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Package, Search, Filter, X } from 'lucide-react-native';
import { Link } from 'expo-router';
import { RefreshControl } from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import FilterModal from '../../components/FilterModal';
import { StatusBar } from 'expo-status-bar';

const GRID_SPACING = 2;
const NUM_COLUMNS = 3;
const screenWidth = Dimensions.get('window').width;
const ITEM_WIDTH = (screenWidth - 40 - (GRID_SPACING * (NUM_COLUMNS - 1))) / NUM_COLUMNS;

const PRODUCT_CATEGORIES = [
  'Rings',
  'Necklaces',
  'Earrings',
  'Bracelets',
  'Loose Diamonds',
] as const;

const DIAMOND_SIZES = [
  '0.3-0.5',
  '0.5-1.0',
  '1.0-2.0',
  '2.0-3.0',
  '3.0+',
] as const;

const DIAMOND_COLORS = [
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
] as const;

const DIAMOND_CLARITY = [
  'FL',
  'IF',
  'VVS1',
  'VVS2',
  'VS1',
  'VS2',
] as const;

type Product = {
  id: string;
  title: string;
  description: string;
  category: string;
  created_at: string;
  image_url: string;
  price: number;
  profiles: {
    full_name: string;
    avatar_url: string;
  };
  details?: {
    weight?: string;
    color?: string;
    clarity?: string;
    cut?: string;
  };
};

type DiamondRequest = {
  id: string;
  user_id: string;
  cut: string;
  min_weight: number;
  max_weight: number;
  clarity: string;
  color: string;
  price: number | null;
  status: string;
  created_at: string;
  expires_at: string;
  profiles: {
    full_name: string;
    avatar_url: string;
  };
};

type ProductsByCategory = {
  [key: string]: Product[];
};

type Profile = {
    id: string;
    full_name: string;
    avatar_url: string | null;
  trust_count: number;
};

const ROUTES = {
  REQUEST: '/(tabs)/profile/requests' as const,
  PRODUCT: '/(tabs)/profile/products' as const,
} as const;

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDiamondSize, setSelectedDiamondSize] = useState<string | null>(null);
  const [selectedDiamondColor, setSelectedDiamondColor] = useState<string | null>(null);
  const [selectedDiamondClarity, setSelectedDiamondClarity] = useState<string | null>(null);
  const [productsByCategory, setProductsByCategory] = useState<ProductsByCategory>({});
  const [diamondRequests, setDiamondRequests] = useState<DiamondRequest[]>([]);
  const [showRequests, setShowRequests] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<DiamondRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [topSellers, setTopSellers] = useState<Profile[]>([]);

  useEffect(() => {
    fetchProducts();
    fetchRequests();
    fetchTopSellers();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          profiles!products_user_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('status', 'available')
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
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('diamond_requests')
        .select(`
          *,
          profiles!diamond_requests_user_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setDiamondRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const fetchTopSellers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, trust_count')
        .order('trust_count', { ascending: false })
        .limit(10);

      if (error) throw error;
      setTopSellers(data || []);
    } catch (error) {
      console.error('Error fetching top sellers:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchProducts(), fetchRequests()]);
    setRefreshing(false);
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

  const getFilteredProducts = () => {
    let filteredProducts = { ...productsByCategory };

    if (selectedCategory) {
      // Convert category names to match the database
      const dbCategory = selectedCategory === 'Loose Diamonds' ? 'Loose Diamond' : 
                        selectedCategory.slice(0, -1); // Remove 's' from plural
      filteredProducts = {
        [dbCategory]: productsByCategory[dbCategory] || []
      };
    }

    if (selectedDiamondSize) {
      Object.keys(filteredProducts).forEach(category => {
        filteredProducts[category] = filteredProducts[category].filter(product => {
          if (!product.details?.weight) return false;
          const weight = parseFloat(product.details.weight);
          if (selectedDiamondSize === '3.0+') {
            return weight >= 3.0;
          }
          const [min, max] = selectedDiamondSize.split('-').map(parseFloat);
          return weight >= min && weight <= max;
        });
      });
    }

    if (selectedDiamondColor) {
      Object.keys(filteredProducts).forEach(category => {
        filteredProducts[category] = filteredProducts[category].filter(product => 
          product.details?.color === selectedDiamondColor
        );
      });
    }

    if (selectedDiamondClarity) {
      Object.keys(filteredProducts).forEach(category => {
        filteredProducts[category] = filteredProducts[category].filter(product => 
          product.details?.clarity === selectedDiamondClarity
        );
      });
    }

    // Remove empty categories
    Object.keys(filteredProducts).forEach(category => {
      if (filteredProducts[category].length === 0) {
        delete filteredProducts[category];
      }
    });

    return filteredProducts;
  };

  const getFilteredRequests = () => {
    let filtered = [...diamondRequests];

    if (selectedDiamondSize) {
      filtered = filtered.filter(request => {
        if (selectedDiamondSize === '3.0+') {
          return request.min_weight >= 3.0;
        }
        const [min, max] = selectedDiamondSize.split('-').map(parseFloat);
        return request.min_weight >= min && 
               (request.max_weight ? request.max_weight <= max : request.min_weight <= max);
      });
    }

    if (selectedDiamondColor) {
      filtered = filtered.filter(request => 
        request.color === selectedDiamondColor
      );
    }

    if (selectedDiamondClarity) {
      filtered = filtered.filter(request => 
        request.clarity === selectedDiamondClarity
      );
    }

    return filtered;
  };

  const renderProducts = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
          </View>
      );
    }

    const filteredProducts = getFilteredProducts();

    // If no filter is selected, show all products in a single list by date
    const allProducts = Object.values(filteredProducts).flat();
    if (!selectedCategory && !selectedDiamondSize && !selectedDiamondColor && !selectedDiamondClarity) {
      if (allProducts.length === 0) {
        return (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No products found</Text>
          </View>
        );
      }
      // Sort by created_at descending
      const sortedProducts = allProducts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return (
        <View style={styles.itemsGrid}>
          {sortedProducts.map((product) => (
                  <TouchableOpacity
              key={product.id}
              style={styles.gridItem}
              onPress={() => router.push({
                pathname: "/products/[id]",
                params: { id: product.id }
              })}
                  >
              <View style={styles.userInfoContainer}>
                <Image 
                  source={{ 
                    uri: product.profiles.avatar_url 
                      ? product.profiles.avatar_url + `?t=${new Date().getTime()}`
                      : 'https://www.gravatar.com/avatar/default?d=mp' 
                  }} 
                  style={styles.userAvatarSmall} 
                />
                <Text style={styles.userNameSmall} numberOfLines={1}>
                  {product.profiles.full_name}
                    </Text>
                <Text style={styles.gridItemTime}>
                  {formatTimeAgo(product.created_at)}
                </Text>
              </View>
              <Image
                source={{ uri: product.image_url }}
                style={styles.gridItemImage}
              />
              <Text style={styles.gridItemTitle} numberOfLines={2}>
                {product.title}
                    </Text>
              <View style={styles.productDetailsRow}>
                {product.details?.weight && (
                  <Text style={styles.gridItemWeight}>
                    {product.details.weight} ct
                  </Text>
                )}
                <Text style={styles.gridItemPrice}>
                  ${product.price.toLocaleString()}
                </Text>
              </View>
                  </TouchableOpacity>
                ))}
              </View>
      );
    }

    // Otherwise, show grouped by category as before
    if (Object.keys(filteredProducts).length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No products match your filters</Text>
          </View>
      );
    }
    return Object.entries(filteredProducts).map(([category, products]) => (
      <View key={category} style={styles.categorySection}>
        <Text style={styles.categoryTitle}>{category}</Text>
        <View style={styles.itemsGrid}>
          {products.map((product) => (
    <TouchableOpacity 
              key={product.id}
              style={styles.gridItem}
              onPress={() => router.push({
                pathname: "/products/[id]",
                params: { id: product.id }
              })}
            >
              <View style={styles.userInfoContainer}>
            <Image 
              source={{ 
                    uri: product.profiles.avatar_url 
                      ? product.profiles.avatar_url + `?t=${new Date().getTime()}`
                      : 'https://www.gravatar.com/avatar/default?d=mp' 
              }} 
                  style={styles.userAvatarSmall} 
            />
                <Text style={styles.userNameSmall} numberOfLines={1}>
                  {product.profiles.full_name}
                </Text>
                <Text style={styles.gridItemTime}>
                  {formatTimeAgo(product.created_at)}
                </Text>
        </View>
              <Image
                source={{ uri: product.image_url }}
                style={styles.gridItemImage}
              />
              <Text style={styles.gridItemTitle} numberOfLines={2}>
                {product.title}
              </Text>
              <View style={styles.productDetailsRow}>
                {product.details?.weight && (
                  <Text style={styles.gridItemWeight}>
                    {product.details.weight} ct
                  </Text>
                )}
                <Text style={styles.gridItemPrice}>
                  ${product.price.toLocaleString()}
                </Text>
      </View>
    </TouchableOpacity>
          ))}
        </View>
      </View>
    ));
  };

  const handleRequestPress = (requestId: string) => {
    const request = diamondRequests.find(r => r.id === requestId);
    if (!request) return;
    
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const renderDetailsModal = () => {
    if (!selectedRequest) return null;

    return (
      <Modal
        visible={showDetailsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Details</Text>
              <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
                </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.userInfoModal}>
                  <Image 
                    source={{ 
                    uri: selectedRequest.profiles.avatar_url || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'
                    }} 
                  style={styles.avatarModal} 
                  />
                <View>
                  <Text style={styles.userNameModal}>{selectedRequest.profiles.full_name}</Text>
                  <Text style={styles.timeAgoModal}>{formatTimeAgo(selectedRequest.created_at)}</Text>
                  </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>Diamond Specifications</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Weight:</Text>
                  <Text style={styles.detailValue}>
                    {selectedRequest.min_weight}{selectedRequest.max_weight ? `-${selectedRequest.max_weight}` : ''} ct
                  </Text>
                        </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Cut:</Text>
                  <Text style={styles.detailValue}>{selectedRequest.cut}</Text>
                        </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Clarity:</Text>
                  <Text style={styles.detailValue}>{selectedRequest.clarity}</Text>
                        </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Color:</Text>
                  <Text style={styles.detailValue}>{selectedRequest.color}</Text>
                        </View>
                {selectedRequest.price && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Budget:</Text>
                    <Text style={styles.detailValue}>${selectedRequest.price.toLocaleString()}</Text>
                  </View>
                )}
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>Status</Text>
                <View style={[styles.statusBadge, { backgroundColor: selectedRequest.status === 'active' ? '#4CAF50' : '#666' }]}>
                  <Text style={styles.statusText}>{selectedRequest.status}</Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderRequests = () => {
    if (loading) {
  return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
      </View>
      );
    }

    const filteredRequests = getFilteredRequests();

    if (filteredRequests.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No requests match your filters</Text>
        </View>
      );
    }

    return (
      <View style={styles.requestsContainer}>
        {filteredRequests.map((request) => (
          <View key={request.id} style={styles.requestCard}>
            <View style={styles.requestHeader}>
              <View style={styles.userInfo}>
                <Image 
                  source={{ 
                    uri: request.profiles.avatar_url || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'
                  }} 
                  style={styles.avatar} 
                />
                <View>
                  <Text style={styles.userName}>{request.profiles.full_name}</Text>
                  <Text style={styles.timeAgo}>{formatTimeAgo(request.created_at)}</Text>
        </View>
              </View>
              {request.price && (
                <Text style={styles.price}>${request.price.toLocaleString()}</Text>
              )}
            </View>
            
            <Text style={styles.requestTitle}>
              Looking for {request.min_weight}{request.max_weight ? `-${request.max_weight}` : ''} ct Diamond
            </Text>
            
            <View style={styles.specsList}>
              <Text style={styles.specsItem}>{request.min_weight} carat</Text>
              <Text style={styles.specsItem}>{request.clarity}</Text>
              <Text style={styles.specsItem}>Color {request.color}</Text>
            </View>

        <TouchableOpacity 
              style={styles.respondButton}
              onPress={() => handleRequestPress(request.id)}
        >
              <Text style={styles.respondButtonText}>Details</Text>
        </TouchableOpacity>
      </View>
        ))}
      </View>
    );
  };

  const renderTopSellers = () => (
    <View style={styles.topSellersSection}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.topSellersList}
      >
        {topSellers.map((seller) => (
            <TouchableOpacity 
            key={seller.id}
            style={styles.topSellerItem}
            onPress={() => router.push(`/user/${seller.id}`)}
          >
            <View style={styles.topSellerImageContainer}>
              <Image
                source={{ 
                  uri: seller.avatar_url || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'
                }}
                style={styles.topSellerImage}
              />
              <View style={styles.trustBadge}>
                <Text style={styles.trustCount}>{seller.trust_count}</Text>
              </View>
            </View>
            <Text style={styles.topSellerName} numberOfLines={1}>
              {seller.full_name}
            </Text>
            </TouchableOpacity>
        ))}
      </ScrollView>
          </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        {renderTopSellers()}
        <View style={styles.header}>
          <View style={styles.headerButtons}>
            <View style={styles.tabButtons}>
            <TouchableOpacity 
                style={[styles.tabButton, !showRequests && styles.tabButtonActive]}
                onPress={() => setShowRequests(false)}
              >
                <Text style={[styles.tabButtonText, !showRequests && styles.tabButtonTextActive]}>For You</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabButton, showRequests && styles.tabButtonActive]}
                onPress={() => setShowRequests(true)}
            >
                <Text style={[styles.tabButtonText, showRequests && styles.tabButtonTextActive]}>Requests</Text>
            </TouchableOpacity>
          </View>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowFilterModal(true)}
            >
              <Filter size={24} color="#fff" />
            </TouchableOpacity>
      </View>
        </View>
      </SafeAreaView>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        style={styles.scrollView}
      >
        {showRequests ? renderRequests() : renderProducts()}
      </ScrollView>

      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        selectedDiamondSize={selectedDiamondSize}
        onSelectDiamondSize={setSelectedDiamondSize}
        selectedDiamondColor={selectedDiamondColor}
        onSelectDiamondColor={setSelectedDiamondColor}
        selectedDiamondClarity={selectedDiamondClarity}
        onSelectDiamondClarity={setSelectedDiamondClarity}
      />
      {renderDetailsModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  safeArea: {
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: '#121212',
  },
  headerButtons: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabButtons: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 100,
    padding: 4,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
  },
  tabButtonActive: {
    backgroundColor: '#fff',
  },
  tabButtonText: {
    color: '#888',
    fontFamily: 'Heebo-Medium',
    fontSize: 14,
  },
  tabButtonTextActive: {
    color: '#000',
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
    position: 'absolute',
    right: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Heebo-Regular',
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Heebo-Regular',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#121212',
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 22,
    fontFamily: 'Heebo-Bold',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    color: '#fff',
  },
  itemsGrid: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  gridItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  gridItemImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  gridItemContent: {
    padding: 8,
    backgroundColor: '#1a1a1a',
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    justifyContent: 'space-between',
  },
  userAvatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  userNameSmall: {
    fontSize: 13,
    fontFamily: 'Heebo-Medium',
    color: '#fff',
  },
  gridItemTitle: {
    fontSize: 15,
    fontFamily: 'Heebo-Medium',
    color: '#fff',
    marginBottom: 6,
    lineHeight: 20,
  },
  gridItemTime: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'Heebo-Regular',
    marginLeft: 'auto',
  },
  productDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  gridItemWeight: {
    fontSize: 14,
    fontFamily: 'Heebo-Regular',
    color: '#888',
  },
  gridItemPrice: {
    fontSize: 16,
    fontFamily: 'Heebo-Bold',
    color: '#6C5CE7',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    backgroundColor: '#1a1a1a',
    padding: 8,
    borderRadius: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#2a2a2a',
  },
  userName: {
    fontSize: 14,
    fontFamily: 'Heebo-Medium',
    color: '#fff',
    marginBottom: 2,
  },
  timeAgo: {
    fontSize: 12,
    fontFamily: 'Heebo-Regular',
    color: '#888',
  },
  requestsContainer: {
    padding: 16,
  },
  requestCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  price: {
    fontSize: 18,
    color: '#6C5CE7',
    fontFamily: 'Heebo-Bold',
  },
  requestTitle: {
    fontSize: 18,
    color: '#fff',
    fontFamily: 'Heebo-Bold',
    marginBottom: 12,
  },
  specsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  specsItem: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'Heebo-Regular',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  respondButton: {
    backgroundColor: '#6C5CE7',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  respondButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Heebo-Medium',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#111',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Heebo-Bold',
    color: '#fff',
  },
  modalBody: {
    padding: 16,
  },
  userInfoModal: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  avatarModal: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  userNameModal: {
    fontSize: 16,
    fontFamily: 'Heebo-Bold',
    color: '#fff',
    marginBottom: 4,
  },
  timeAgoModal: {
    fontSize: 14,
    fontFamily: 'Heebo-Regular',
    color: '#666',
  },
  detailSection: {
    marginBottom: 24,
  },
  detailTitle: {
    fontSize: 18,
    fontFamily: 'Heebo-Bold',
    color: '#fff',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  detailLabel: {
    fontSize: 16,
    fontFamily: 'Heebo-Regular',
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
    fontFamily: 'Heebo-Medium',
    color: '#fff',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Heebo-Medium',
  },
  topSellersSection: {
    paddingTop: 4,
    paddingBottom: 0,
    backgroundColor: '#121212',
  },
  topSellersList: {
    paddingHorizontal: 16,
    gap: 16,
  },
  topSellerItem: {
    alignItems: 'center',
    width: 72,
  },
  topSellerImageContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  topSellerImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2a2a2a',
    borderWidth: 2,
    borderColor: '#6C5CE7',
  },
  trustBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#6C5CE7',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#121212',
  },
  trustCount: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Heebo-Bold',
  },
  topSellerName: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Heebo-Medium',
    textAlign: 'center',
  },
});