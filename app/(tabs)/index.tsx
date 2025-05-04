import React from 'react';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, Alert, Modal, SafeAreaView } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabaseApi';
import { Ionicons } from '@expo/vector-icons';
import { RefreshControl } from 'react-native';

import FilterModal from '../../components/FilterModal';
import { StatusBar } from 'expo-status-bar';
import { useProductFilter } from '@/hooks/useProductFilter';
import { Product, ProductsByCategory } from '@/types/product';
import { DiamondRequest } from '@/types/diamond';
import { Profile } from '@/types/profile';
import { FilterParams } from '@/types/filter';
import { Product as ProductType } from '@/types/product';
import { useAuth } from '@/hooks/useAuth';

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

type RingSpecs = {
  product_id: string;
  subcategory: string;
  diamond_size_from: number | null;
  diamond_size_to: number | null;
  color: string | null;
  clarity: string | null;
  gold_color: string;
  material: string;
  gold_karat: string;
  side_stones: boolean;
  cut_grade: string | null;
  certification: string | null;
};
type NecklaceSpecs = {
  product_id: string;
  subcategory: string;
  material: string;
  gold_color: string;
  gold_karat: string;
  length: string;
};

type EarringSpecs = {
  product_id: string;
  subcategory: string;
  material: string;
  gold_color: string;
  gold_karat: string;
  clarity: string | null;
  color: string | null;
  certification: string | null;
};

type BraceletSpecs = {
  product_id: string;
  subcategory: string;
  material: string;
  gold_color: string;
  gold_karat: string;
  length: string;
  clarity: string | null;
  color: string | null;
};

type SpecialPieceSpecs = {
  product_id: string;
  subcategory: string;
  material: string;
  gold_color: string;
  gold_karat: string;
  description: string;
};

type WatchSpecs = {
  product_id: string;
  brand: string;
  model: string;
  diameter: string;
  movement: string;
  material: string;
  gold_color: string | null;
  gold_karat: string | null;
};

type DiamondSpecs = {
  product_id: string;
  weight: string;
  color: string;
  clarity: string;
  cut_grade: string;
  certificate: string;
};

type GemSpecs = {
  product_id: string;
  type: string;
  weight: string;
  color: string;
  clarity: string;
  certificate: string | null;
};

type ProductFormState = {
  title: string;
  description: string;
  price: string;
  category: string;
  image_url: string;
  specs: {
    [key: string]: any;
  };
};

type ValidationRules = {
  [key: string]: {
    required: boolean;
    min?: number;
    max?: number;
    pattern?: RegExp;
  };
};

const validationRulesByCategory: { [key: string]: ValidationRules } = {
  Ring: {
    subcategory: { required: true },
    material: { required: true },
    gold_color: { required: true },
    gold_karat: { required: true },
  },
  Necklace: {
    subcategory: { required: true },
    material: { required: true },
    length: { required: true },
  },
  Earrings: {
    subcategory: { required: true },
    material: { required: true },
  },
  Bracelet: {
    subcategory: { required: true },
    material: { required: true },
    length: { required: true },
  },
  "Special Pieces": {
    subcategory: { required: true },
    material: { required: true },
  },
  Watches: {
    brand: { required: true },
    model: { required: true },
    diameter: { required: true },
    movement: { required: true },
    material: { required: true },
  },
  "Loose Diamond": {
    weight: { required: true },
    color: { required: true },
    clarity: { required: true },
    cut_grade: { required: true },
    certificate: { required: true },
  },
  Gems: {
    type: { required: true },
    weight: { required: true },
    color: { required: true },
    clarity: { required: true },
  },
};

const ROUTES = {
  REQUEST: '/(tabs)/profile/requests' as const,
  PRODUCT: '/(tabs)/profile/products' as const,
} as const;

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
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
  const productFilter = useProductFilter();
  const [searchQuery, setSearchQuery] = useState('');
  const { accessToken, user: authUser } = useAuth();
  const [productForm, setProductForm] = useState<ProductFormState>({
    title: '',
    description: '',
    price: '',
    category: '',
    image_url: '',
    specs: {},
  });

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [filters, setFilters] = useState<FilterParams[]>([]);

  useEffect(() => {
    fetchProducts();
    fetchRequests();
    fetchTopSellers();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchProducts();
      fetchRequests();
      fetchTopSellers();
    }, [])
  );

  const fetchProducts = async () => {
    try {
      const query = [
        '*',
        'profiles!products_user_id_fkey(id,full_name,avatar_url)',
        'product_images(image_url)',
        'ring_specs!ring_specs_product_id_fkey(*)',
        'necklace_specs!necklace_specs_product_id_fkey(*)',
        'earring_specs!earring_specs_product_id_fkey(*)',
        'bracelet_specs!bracelet_specs_product_id_fkey(*)',
        'special_piece_specs!special_piece_specs_product_id_fkey(*)',
        'watch_specs!watch_specs_product_id_fkey(*)',
        'gem_specs!gem_specs_product_id_fkey(*)',
        'loose_diamonds_specs!loose_diamonds_specs_product_id_fkey(weight,clarity,color,shape,cut,origin_type,symmetry,polish,fluorescence)'
      ].join(',');
      const url = `${SUPABASE_URL}/rest/v1/products?select=${encodeURIComponent(query)}&status=eq.available&order=created_at.desc`;
      const res = await fetch(url, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
        },
      });
      if (!res.ok) throw new Error('Error fetching products');
      const products = await res.json();
      // Group products by category
      const grouped = (products || []).reduce((acc: ProductsByCategory, product: Product) => {
        if (!acc[product.category]) {
          acc[product.category] = [];
        }
        acc[product.category].push(product);
        return acc;
      }, {} as ProductsByCategory);
      setProductsByCategory(grouped);
      setLoading(false);
    } catch (error) {
      Alert.alert('שגיאה', 'אירעה שגיאה בטעינת המוצרים');
      setLoading(false);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const query = [
        '*',
        'profiles:user_id(id,full_name,avatar_url)'
      ].join(',');
      const url = `${SUPABASE_URL}/rest/v1/requests?select=${encodeURIComponent(query)}&order=created_at.desc`;
      const res = await fetch(url, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
        },
      });
      if (!res.ok) throw new Error('Error fetching requests');
      const data = await res.json();
      setDiamondRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const fetchTopSellers = async () => {
    try {
      const url = `${SUPABASE_URL}/rest/v1/profiles?select=id,full_name,avatar_url,trust_count&order=trust_count.desc&limit=10`;
      const res = await fetch(url, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
        },
      });
      if (!res.ok) throw new Error('Error fetching top sellers');
      const data = await res.json();
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

  const handleApplyFilters = (filtersArr: FilterParams[]) => {
    setFilters(filtersArr);
    setShowFilterModal(false);
  };

  const getFilteredProducts = () => {
    let products = Object.values(productsByCategory).flat();
    if (filters.length === 0) return products;
    return products.filter(product =>
      filters.some(f => {
        if (f.category && product.category !== f.category) return false;
        return Object.entries(f.filters).every(([key, values]) => {
          if (!values.length) return true;
          const productValue = (product as any)[key];
          if (Array.isArray(productValue)) {
            return productValue.some((v: any) => values.includes(String(v)));
          }
          return values.includes(String(productValue));
        });
      })
    );
  };

  const getFilteredRequests = () => {
    let filtered = [...diamondRequests];

    if (selectedDiamondSize) {
      filtered = filtered.filter(request => {
        if (selectedDiamondSize === '3.0+') {
          return request.details.weight_from >= 3.0;
        }
        const [min, max] = selectedDiamondSize.split('-').map(parseFloat);
        return request.details.weight_from >= min && 
               (request.details.weight_to ? request.details.weight_to <= max : request.details.weight_from <= max);
      });
    }

    if (selectedDiamondColor) {
      filtered = filtered.filter(request => 
        request.details.color === selectedDiamondColor
      );
    }

    if (selectedDiamondClarity) {
      filtered = filtered.filter(request => 
        request.details.clarity === selectedDiamondClarity
      );
    }

    return filtered;
  };

  const renderProducts = () => {
    const filteredProducts = getFilteredProducts();

    return (
      <View style={styles.productsGrid}>
        {Object.values(filteredProducts).flat().map((product: Product) => {
          // Get the first image from product_images, fallback to legacy image_url, or use placeholder
          const imageUrl = product.product_images?.[0]?.image_url || 
                          product.image_url || 
                          'https://via.placeholder.com/150';

          return (
            <TouchableOpacity
              key={product.id}
              style={styles.productItem}
              onPress={() => router.push(`/products/${product.id}`)}
            >
              <Image
                source={{ uri: imageUrl }}
                style={styles.productImage}
                resizeMode="cover"
              />
              <View style={styles.productInfo}>
                <Text style={styles.productTitle} numberOfLines={2}>
                  {product.title}
                </Text>
                <Text style={styles.productPrice}>₪{product.price.toLocaleString()}</Text>
                <View style={styles.sellerInfo}>
                  <Image 
                    source={{ 
                      uri: product.profiles?.avatar_url || 'https://www.gravatar.com/avatar/?d=mp' 
                    }} 
                    style={styles.avatar} 
                  />
                  <Text style={styles.sellerName}>{product.profiles?.full_name}</Text>
                </View>
                <Text style={styles.timeAgo}>
                  {formatTimeAgo(product.created_at)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
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
                <Ionicons name="close" size={24} color="#fff" />
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
                    {selectedRequest.details.weight_from}{selectedRequest.details.weight_to ? `-${selectedRequest.details.weight_to}` : ''} ct
                  </Text>
                        </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Cut:</Text>
                  <Text style={styles.detailValue}>{selectedRequest.details.cut}</Text>
                        </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Clarity:</Text>
                  <Text style={styles.detailValue}>{selectedRequest.details.clarity}</Text>
                        </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Color:</Text>
                  <Text style={styles.detailValue}>{selectedRequest.details.color}</Text>
                        </View>
                {selectedRequest.details.budget && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Budget:</Text>
                    <Text style={styles.detailValue}>${selectedRequest.details.budget.toLocaleString()}</Text>
                  </View>
                )}
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
              {request.details.budget && (
                <Text style={styles.price}>${request.details.budget.toLocaleString()}</Text>
              )}
            </View>
            
            <Text style={styles.requestTitle}>
              Looking for {request.details.weight_from}{request.details.weight_to ? `-${request.details.weight_to}` : ''} ct Diamond
            </Text>
            
            <View style={styles.specsList}>
              <Text style={styles.specsItem}>{request.details.weight_from} carat</Text>
              <Text style={styles.specsItem}>{request.details.clarity}</Text>
              <Text style={styles.specsItem}>Color {request.details.color}</Text>
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

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    const rules = validationRulesByCategory[productForm.category];

    // Validate basic fields
    if (!productForm.title) errors.title = 'Title is required';
    if (!productForm.description) errors.description = 'Description is required';
    if (!productForm.price) errors.price = 'Price is required';
    if (!productForm.category) errors.category = 'Category is required';
    if (!productForm.image_url) errors.image_url = 'Image is required';

    // Validate category-specific fields
    if (rules) {
      Object.entries(rules).forEach(([field, rule]) => {
        if (rule.required && !productForm.specs[field]) {
          errors[field] = `${field} is required`;
        }
        if (rule.min !== undefined && productForm.specs[field] < rule.min) {
          errors[field] = `${field} must be at least ${rule.min}`;
        }
        if (rule.max !== undefined && productForm.specs[field] > rule.max) {
          errors[field] = `${field} must be at most ${rule.max}`;
        }
        if (rule.pattern && !rule.pattern.test(productForm.specs[field])) {
          errors[field] = `${field} format is invalid`;
        }
      });
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddProduct = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      // Insert into products table
      const { data: product, error: productError } = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          title: productForm.title,
          description: productForm.description,
          price: parseFloat(productForm.price),
          image_url: productForm.image_url,
          user_id: authUser?.id,
          category: productForm.category,
          status: 'available'
        })
      })
      .then(res => res.json());

      if (productError) throw productError;

      // Insert into the appropriate specs table
      let specsError = null;
      switch (productForm.category) {
        case 'Ring':
          const { error: ringError } = await fetch(`${SUPABASE_URL}/rest/v1/ring_specs`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              product_id: product.id,
              ...productForm.specs
            })
          })
          .then(res => res.json());
          specsError = ringError;
          break;

        case 'Necklace':
          const { error: necklaceError } = await fetch(`${SUPABASE_URL}/rest/v1/necklace_specs`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              product_id: product.id,
              ...productForm.specs
            })
          })
          .then(res => res.json());
          specsError = necklaceError;
          break;

        case 'Earrings':
          const { error: earringError } = await fetch(`${SUPABASE_URL}/rest/v1/earring_specs`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              product_id: product.id,
              ...productForm.specs
            })
          })
          .then(res => res.json());
          specsError = earringError;
          break;

        case 'Bracelet':
          const { error: braceletError } = await fetch(`${SUPABASE_URL}/rest/v1/bracelet_specs`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              product_id: product.id,
              ...productForm.specs
            })
          })
          .then(res => res.json());
          specsError = braceletError;
          break;

        case 'Special Pieces':
          const { error: specialError } = await fetch(`${SUPABASE_URL}/rest/v1/special_piece_specs`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              product_id: product.id,
              ...productForm.specs
            })
          })
          .then(res => res.json());
          specsError = specialError;
          break;

        case 'Watches':
          const { error: watchError } = await fetch(`${SUPABASE_URL}/rest/v1/watch_specs`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              product_id: product.id,
              ...productForm.specs
            })
          })
          .then(res => res.json());
          specsError = watchError;
          break;

        case 'Loose Diamond':
          const { error: diamondError } = await fetch(`${SUPABASE_URL}/rest/v1/diamond_specs`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              product_id: product.id,
              ...productForm.specs
            })
          })
          .then(res => res.json());
          specsError = diamondError;
          break;

        case 'Gems':
          const { error: gemError } = await fetch(`${SUPABASE_URL}/rest/v1/gem_specs`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              product_id: product.id,
              ...productForm.specs
            })
          })
          .then(res => res.json());
          specsError = gemError;
          break;
      }

      if (specsError) throw specsError;

      Alert.alert('Success', 'Product added successfully');
      setShowAddModal(false);
      fetchProducts();
    } catch (error) {
      Alert.alert('Error', 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
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
              <Ionicons name="filter" size={24} color="#fff" />
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
        onApplyFilters={handleApplyFilters}
        filters={filters}
        onFiltersChange={setFilters}
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
  gridItemSpecs: {
    fontSize: 14,
    fontFamily: 'Heebo-Regular',
    color: '#888',
  },
  gridItemLength: {
    fontSize: 14,
    fontFamily: 'Heebo-Regular',
    color: '#888',
  },
  gridItemColor: {
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
    marginTop: 8,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 6,
  },
  sellerName: {
    fontSize: 12,
    color: '#ccc',
    fontFamily: 'Heebo-Regular',
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
  productsGrid: {
    padding: 16,
  },
  productItem: {
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
  productImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  productInfo: {
    padding: 8,
    backgroundColor: '#1a1a1a',
  },
  productTitle: {
    fontSize: 15,
    fontFamily: 'Heebo-Medium',
    color: '#fff',
    marginBottom: 6,
    lineHeight: 20,
  },
  productPrice: {
    fontSize: 16,
    fontFamily: 'Heebo-Bold',
    color: '#6C5CE7',
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  userName: {
    fontSize: 14,
    fontFamily: 'Heebo-Medium',
    color: '#fff',
  },
});