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
  price: number;
  image_url: string;
  category: string;
  details?: {
    size?: string;
    clarity?: string;
    color?: string;
  };
  profiles: {
    full_name: string;
    avatar_url: string | null;
  };
  created_at: string;
};

type Request = {
  id: string;
  title: string;
  description: string;
  category: string;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url: string;
  };
  diamond_size?: string;
  diamond_color?: string;
  diamond_clarity?: string;
};

type ProductsByCategory = {
  [key: string]: Product[];
};

type RequestsByCategory = {
  [key: string]: Request[];
};

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDiamondSize, setSelectedDiamondSize] = useState<string | null>(null);
  const [selectedDiamondColor, setSelectedDiamondColor] = useState<string | null>(null);
  const [selectedDiamondClarity, setSelectedDiamondClarity] = useState<string | null>(null);
  const [productsByCategory, setProductsByCategory] = useState<ProductsByCategory>({});
  const [requestsByCategory, setRequestsByCategory] = useState<RequestsByCategory>({});
  const [showRequests, setShowRequests] = useState(false);

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
            avatar_url,
            phone
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
        .from('requests')
        .select(`
          *,
          profiles!requests_user_id_fkey (
            id,
            full_name,
            avatar_url,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group requests by category
      const grouped = (data || []).reduce<RequestsByCategory>((acc, request) => {
        if (!acc[request.category]) {
          acc[request.category] = [];
        }
        acc[request.category].push(request);
        return acc;
      }, {});

      setRequestsByCategory(grouped);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchProducts(), fetchRequests()]);
    setRefreshing(false);
  };

  const getFilteredItems = () => {
    const items = showRequests ? requestsByCategory : productsByCategory;
    let filteredItems = { ...items };

    if (selectedCategory) {
      filteredItems = {
        [selectedCategory]: items[selectedCategory] || []
      };
    }

    // Apply diamond filters if they are selected
    Object.keys(filteredItems).forEach(category => {
      filteredItems[category] = filteredItems[category].filter(item => {
        const matchesSize = !selectedDiamondSize || item.details?.size === selectedDiamondSize;
        const matchesColor = !selectedDiamondColor || item.details?.color === selectedDiamondColor;
        const matchesClarity = !selectedDiamondClarity || item.details?.clarity === selectedDiamondClarity;
        return matchesSize && matchesColor && matchesClarity;
      });
    });

    return filteredItems;
  };

  const filteredItems = getFilteredItems();
  const hasItems = Object.values(filteredItems).some(items => items.length > 0);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
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

      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>טוען...</Text>
          </View>
        ) : !hasItems ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {showRequests ? 'אין בקשות זמינות' : 'אין מוצרים זמינים'}
            </Text>
          </View>
        ) : (
          <ScrollView
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            style={styles.scrollView}
          >
            {Object.entries(filteredItems).map(([category, items]) => {
              if (items.length === 0) return null;
              return (
                <View key={category} style={styles.categorySection}>
                  <Text style={styles.categoryTitle}>{category}</Text>
                  <View style={styles.itemsGrid}>
                    {items.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => {
                          const route = showRequests ? `/requests/${item.id}` : `/products/${item.id}`;
                          router.push(route);
                        }}
                        style={styles.gridItem}
                      >
                        {!showRequests && (
                          <Image
                            source={{ uri: item.image_url }}
                            style={styles.gridImage}
                            resizeMode="cover"
                          />
                        )}
                        <View style={styles.gridItemOverlay}>
                          <Text style={styles.gridItemTitle} numberOfLines={1}>{item.title}</Text>
                          {!showRequests && (
                            <Text style={styles.gridItemPrice}>${item.price.toLocaleString()}</Text>
                          )}
                          <View style={styles.userInfo}>
                            <Image
                              source={{ uri: item.profiles?.avatar_url || 'https://www.gravatar.com/avatar/?d=mp' }}
                              style={styles.userAvatar}
                            />
                            <Text style={styles.userName}>{item.profiles?.full_name}</Text>
                          </View>
                          {showRequests && (
                            <Text style={styles.timeAgo}>
                              {formatDistanceToNow(new Date(item.created_at), {
                                addSuffix: true,
                                locale: he
                              })}
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}
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
  content: {
    flex: 1,
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
  gridItemOverlay: {
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
});