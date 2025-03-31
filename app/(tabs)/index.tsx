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
  'All',
  'Loose Diamond',
  'Ring',
  'Necklace',
  'Bracelet',
  'Earrings',
  'Pendant',
] as const;

const DIAMOND_SIZES = [
  'All',
  '0.3-0.5',
  '0.5-1.0',
  '1.0-2.0',
  '2.0-3.0',
  '3.0+',
] as const;

const DIAMOND_CLARITY = [
  'All',
  'FL',
  'IF',
  'VVS1',
  'VVS2',
  'VS1',
  'VS2',
  'SI1',
  'SI2',
] as const;

const DIAMOND_COLORS = [
  'All',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
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

  useEffect(() => {
    fetchProducts();
    fetchRequests();
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

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchProducts(), fetchRequests()]);
    setRefreshing(false);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 30) return `${diffInDays} days ago`;
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths === 1) return '1 month ago';
    return `${diffInMonths} months ago`;
  };

  const renderProducts = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    if (Object.keys(productsByCategory).length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No products available</Text>
        </View>
      );
    }

    return Object.entries(productsByCategory).map(([category, products]) => (
      <View key={category} style={styles.categorySection}>
        <Text style={styles.categoryTitle}>{category}</Text>
        <View style={styles.itemsGrid}>
          {products.map((product) => (
            <TouchableOpacity
              key={product.id}
              onPress={() => router.push(`/products/${product.id}`)}
              style={styles.gridItem}
            >
              <Image source={{ uri: product.image_url }} style={styles.gridImage} />
              <View style={styles.gridItemContent}>
                <Text style={styles.gridItemTitle}>{product.title}</Text>
                <Text style={styles.gridItemPrice}>${product.price.toLocaleString()}</Text>
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

    if (diamondRequests.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No requests available</Text>
        </View>
      );
    }

    return (
      <View style={styles.requestsContainer}>
        {diamondRequests.map((request) => (
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

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.logo}>JEX</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.showRequestsButton}
              onPress={() => setShowRequests(!showRequests)}
            >
              <Text style={styles.showRequestsText}>
                {showRequests ? 'Show Products' : 'Show Requests'}
              </Text>
            </TouchableOpacity>
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
    backgroundColor: '#000',
  },
  safeArea: {
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  logo: {
    fontSize: 24,
    fontFamily: 'Heebo-Bold',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  showRequestsButton: {
    backgroundColor: '#6C5CE7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  showRequestsText: {
    color: '#fff',
    fontFamily: 'Heebo-Medium',
    fontSize: 14,
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Heebo-Regular',
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Heebo-Regular',
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 20,
    fontFamily: 'Heebo-Bold',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  itemsGrid: {
    paddingHorizontal: 16,
  },
  gridItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gridImage: {
    width: '100%',
    height: undefined,
    aspectRatio: 1,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    resizeMode: 'cover'
  },
  gridItemContent: {
    padding: 12,
  },
  gridItemTitle: {
    fontSize: 16,
    fontFamily: 'Heebo-Medium',
    marginBottom: 4,
  },
  gridItemPrice: {
    fontSize: 18,
    fontFamily: 'Heebo-Bold',
    color: '#6C5CE7',
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    backgroundColor: '#f8f8f8',
    padding: 8,
    borderRadius: 8,
    marginTop: 8
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#eee'
  },
  userName: {
    fontSize: 14,
    fontFamily: 'Heebo-Regular',
    color: '#666',
    flex: 1
  },
  timeAgo: {
    fontSize: 12,
    fontFamily: 'Heebo-Regular',
    color: '#999',
  },
  requestsContainer: {
    padding: 16,
  },
  requestCard: {
    backgroundColor: '#111',
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
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    gap: 12,
    marginBottom: 16,
  },
  specsItem: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Heebo-Regular',
    backgroundColor: '#222',
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
});