import React from 'react';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, Alert, Modal, SafeAreaView } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabaseApi';
import { Ionicons } from '@expo/vector-icons';
import { RefreshControl } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';

import FilterModal from '../../components/FilterModal';
import { StatusBar } from 'expo-status-bar';
import { useProductFilter } from '@/hooks/useProductFilter';
import { Product, ProductsByCategory } from '@/types/product';
import { DiamondRequest } from '@/types/diamond';
import { Profile } from '@/types/profile';
import { FilterParams } from '@/types/filter';
import { Product as ProductType } from '@/types/product';
import { useAuth } from '@/hooks/useAuth';
import DealOfTheDayIconsRow from '../../components/DealOfTheDayIconsRow';
import { FILTER_FIELDS_BY_CATEGORY, FilterField } from '../../constants/filters';

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

// Helper to normalize category names for mapping
function normalizeCategory(rawCategory: string | undefined): string {
  if (!rawCategory) return 'Loose Diamonds';
  if (rawCategory === 'Loose Diamond') return 'Loose Diamonds';
  if (rawCategory === 'Gem') return 'Gems';
  if (rawCategory === 'Ring') return 'Ring';
  if (rawCategory === 'Necklace') return 'Necklace';
  if (rawCategory === 'Earring' || rawCategory === 'Earrings') return 'Earrings';
  if (rawCategory === 'Bracelet') return 'Bracelet';
  if (rawCategory === 'Special Piece' || rawCategory === 'Special Pieces') return 'Special Pieces';
  if (rawCategory === 'Watch' || rawCategory === 'Watches') return 'Watches';
  // Add more rules as needed
  return rawCategory;
}

// Map request.details fields to the mapped keys for display
const REQUEST_FIELD_MAP: Record<string, string> = {
  weight_from: 'weight',
  weight_to: 'weight',
  cut: 'cut_grade',
  certificate: 'certification',
  gem_type: 'gem_type',
  // Add more mappings as needed
};

function mapRequestDetails(details: any): any {
  if (!details) return {};
  const mapped: Record<string, any> = {};
  for (const [key, value] of Object.entries(details)) {
    const mappedKey = REQUEST_FIELD_MAP[key] || key;
    // Special handling for weight range
    if (mappedKey === 'weight') {
      if (details.weight_from && details.weight_to) {
        mapped['weight'] = `${details.weight_from}-${details.weight_to}`;
      } else if (details.weight_from) {
        mapped['weight'] = details.weight_from;
      } else if (details.weight_to) {
        mapped['weight'] = details.weight_to;
      }
    } else if (!mapped[mappedKey]) {
      mapped[mappedKey] = value;
    }
  }
  return mapped;
}

function CategorySpecsDisplay({ category, details }: { category: string; details: any }) {
  const fields: FilterField[] | undefined = FILTER_FIELDS_BY_CATEGORY[category];
  if (!fields) {
    return (
      <View style={{ paddingVertical: 8 }}>
        <Text style={{ color: '#7B8CA6', fontFamily: 'Montserrat-Regular', fontSize: 16 }}>Unknown category</Text>
      </View>
    );
  }
  return (
    <View>
      {fields.map(({ key, label }) => {
        // Hide price field if not present in details (for requests)
        if ((key === 'price' || label === 'Price ($)') && (details?.[key] == null || details?.[key] === '')) {
          return null;
        }
        return (
          <View style={styles.detailRow} key={key}>
            <Text style={styles.detailLabel}>{label}:</Text>
            <Text style={styles.detailValue}>
              {details?.[key] != null && details?.[key] !== '' ? String(details[key]) : 'Not specified'}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// Helper to generate a dynamic request title based on category/type and details
function getRequestTitle(request: any): string {
  const details = request.details || {};
  const category = normalizeCategory(request.category || details.category);
  if (category === 'Loose Diamonds') {
    let weight = '';
    if (details.weight_from && details.weight_to) {
      weight = `${details.weight_from}-${details.weight_to} ct`;
    } else if (details.weight_from) {
      weight = `${details.weight_from} ct`;
    } else if (details.weight_to) {
      weight = `${details.weight_to} ct`;
    }
    return `Looking for${weight ? ' ' + weight : ''} Diamond`;
  }
  if (category === 'Watches') {
    const brand = details.brand || '';
    const model = details.model || '';
    let title = 'Looking for';
    if (brand) title += ` ${brand}`;
    if (model) title += ` ${model}`;
    title += ' Watch';
    return title;
  }
  if (category === 'Gems') {
    const gemType = details.gem_type || details.type || '';
    return `Looking for${gemType ? ' ' + gemType : ''} Gem`;
  }
  // Add more categories as needed
  // Fallback
  return 'Looking for Product';
}

export default function HomeScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
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

  useEffect(() => {
    if (accessToken && isFocused) {
      fetchProducts();
      fetchRequests();
      fetchTopSellers();
    }
  }, [accessToken, isFocused]);

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
                <View style={styles.productTitleRow}>
                  <Text style={styles.productTitle} numberOfLines={2}>{product.title}</Text>
                  <Text style={styles.productPrice}>₪{product.price.toLocaleString()}</Text>
                </View>
                <View style={styles.productMetaRow}>
                  <View style={styles.sellerInfo}>
                    <Image 
                      source={{ uri: product.profiles?.avatar_url || 'https://www.gravatar.com/avatar/?d=mp' }} 
                      style={styles.avatar} 
                    />
                    <Text style={styles.sellerName}>{product.profiles?.full_name}</Text>
                  </View>
                  <Text style={styles.timeAgo}>{formatTimeAgo(product.created_at)}</Text>
                </View>
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

    const category = normalizeCategory(selectedRequest.category || selectedRequest.details?.category);
    const mappedDetails = mapRequestDetails(selectedRequest.details);

    const handleClose = () => {
      setShowDetailsModal(false);
      if (navigation.canGoBack()) navigation.goBack();
    };

    // Navigate to user profile
    const handleUserPress = () => {
      if (selectedRequest.user_id) {
        router.push({ pathname: '/user/[id]', params: { id: selectedRequest.user_id } });
        setShowDetailsModal(false);
      }
    };

    return (
      <Modal
        visible={showDetailsModal}
        transparent
        animationType="slide"
        onRequestClose={handleClose}
      >
        <TouchableOpacity
          style={styles.modalContainer}
          activeOpacity={1}
          onPressOut={handleClose}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Details</Text>
              <TouchableOpacity onPress={handleClose} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
                <Ionicons name="close" size={24} color="#0E2657" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingBottom: 32 }}>
              <TouchableOpacity style={styles.userInfoModal} onPress={handleUserPress} activeOpacity={0.7}>
                <Image
                  source={{
                    uri: selectedRequest.profiles.avatar_url || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
                  }}
                  style={styles.avatarModal}
                />
                <View>
                  <Text style={styles.userNameModal}>{selectedRequest.profiles.full_name}</Text>
                  <Text style={styles.timeAgoModal}>{formatTimeAgo(selectedRequest.created_at)}</Text>
                </View>
              </TouchableOpacity>
              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>Specifications</Text>
                <CategorySpecsDisplay category={category} details={mappedDetails} />
              </View>
            </ScrollView>
          </View>
        </TouchableOpacity>
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
                  <Text style={styles.sellerName}>{request.profiles.full_name}</Text>
                  <Text style={styles.timeAgo}>{formatTimeAgo(request.created_at)}</Text>
                </View>
              </View>
            </View>
            
            <Text style={styles.requestTitle}>
              {getRequestTitle(request)}
            </Text>
            
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
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        {/* Notification icon can be added here if needed */}
      </View>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        style={styles.scrollView}
      >
        {/* Deal of the Day icons row */}
        <DealOfTheDayIconsRow />
        {/* Divider for separation */}
        <View style={{ height: 8 }} />
        {/* For You / Requests tab buttons */}
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
            <Ionicons name="filter" size={24} color="#0E2657" />
          </TouchableOpacity>
        </View>
        {/* Divider for separation */}
        <View style={{ height: 8 }} />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FC',
  },
  safeArea: {
    backgroundColor: '#F5F8FC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: '#F5F8FC',
  },
  headerButtons: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabButtons: {
    flexDirection: 'row',
    backgroundColor: '#E3EAF3',
    borderRadius: 100,
    padding: 4,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: '#E3EAF3',
  },
  tabButtonActive: {
    backgroundColor: '#0E2657',
  },
  tabButtonText: {
    color: '#0E2657',
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
  },
  tabButtonTextActive: {
    color: '#fff',
    fontFamily: 'Montserrat-Bold',
  },
  filterButton: {
    padding: 10,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E3EAF3',
    shadowColor: '#0E2657',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    position: 'absolute',
    right: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F8FC',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
    color: '#0E2657',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F8FC',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
    color: '#0E2657',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F5F8FC',
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
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
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
  avatar: { width: 28, height: 28, borderRadius: 14, marginRight: 8, backgroundColor: '#E3EAF3' },
  sellerName: { fontSize: 13, color: '#0E2657', fontFamily: 'Montserrat-Regular' },
  timeAgo: { fontSize: 12, fontFamily: 'Montserrat-Regular', color: '#7B8CA6' },
  requestsContainer: {
    padding: 16,
  },
  requestCard: {
    backgroundColor: '#fff',
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
    fontFamily: 'Montserrat-Bold',
  },
  requestTitle: {
    fontSize: 18,
    color: '#0E2657',
    fontFamily: 'Montserrat-Bold',
    marginBottom: 12,
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
    fontFamily: 'Montserrat-Medium',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
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
    borderBottomColor: '#E3EAF3',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Montserrat-Bold',
    color: '#0E2657',
  },
  modalBody: {
    padding: 16,
  },
  userInfoModal: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3EAF3',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  avatarModal: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: '#E3EAF3',
  },
  userNameModal: {
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
    color: '#0E2657',
    marginBottom: 4,
  },
  timeAgoModal: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: '#7B8CA6',
  },
  detailSection: {
    marginBottom: 24,
  },
  detailTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    color: '#0E2657',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E3EAF3',
  },
  detailLabel: {
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
    color: '#7B8CA6',
  },
  detailValue: {
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
    color: '#0E2657',
  },
  topSellersSection: {
    paddingTop: 4,
    paddingBottom: 0,
    backgroundColor: '#F5F8FC',
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
    backgroundColor: '#E3EAF3',
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
    borderColor: '#F5F8FC',
  },
  trustCount: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Montserrat-Bold',
  },
  topSellerName: {
    color: '#0E2657',
    fontSize: 12,
    fontFamily: 'Montserrat-Medium',
    textAlign: 'center',
  },
  productsGrid: {
    padding: 16,
  },
  productItem: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
    padding: 0,
  },
  productImage: {
    width: '100%',
    height: 270,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: '#E3EAF3',
  },
  productInfo: {
    padding: 16,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  productTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 6,
  },
  productTitle: {
    fontSize: 17,
    fontFamily: 'Montserrat-Bold',
    color: '#0E2657',
    textAlign: 'left',
    flex: 1,
  },
  productPrice: {
    fontSize: 17,
    fontFamily: 'Montserrat-Bold',
    color: '#0E2657',
    textAlign: 'right',
    marginLeft: 12,
  },
  productMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 2,
    marginBottom: 0,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
});