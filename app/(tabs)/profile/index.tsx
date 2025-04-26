import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, Modal } from 'react-native';
import { Settings, Plus, Link as LinkIcon, X, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { AvatarGroup } from '@/components/AvatarGroup';
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

type Category = {
  id: string;
  name: string;
  products: Product[];
};

export default function ProfileScreen() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [productsByCategory, setProductsByCategory] = useState<ProductsByCategory>({});
  const [loading, setLoading] = useState(true);
  const [showTrustMarks, setShowTrustMarks] = useState(false);
  const [trustMarks, setTrustMarks] = useState<TrustMark[]>([]);
  const [loadingTrustMarks, setLoadingTrustMarks] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState<Record<string, boolean>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchProducts();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
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

  const fetchTrustMarks = async () => {
    try {
      if (!user) return;
      
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
        .eq('trusted_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
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

  const handleAddProduct = () => {
    router.push('/profile/add-product');
  };

  const handleProductPress = (productId: string) => {
    router.push(`/profile/product/${productId}`);
  };

  const handleWebsitePress = async () => {
    if (profile?.website) {
      const url = profile.website.startsWith('http') ? profile.website : `https://${profile.website}`;
      window.open(url, '_blank');
    }
  };

  const handleSettingsPress = () => {
    router.push('/(tabs)/settings');
  };

  const fetchUserProducts = async () => {
    if (!user) return;

    const { data: userProducts, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        price,
        images,
        category_id,
        profiles (
          id,
          full_name
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      return;
    }

    // Group products by category
    const { data: categoriesData } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (categoriesData) {
      const groupedProducts = categoriesData.map(category => ({
        ...category,
        products: userProducts?.filter(product => product.category_id === category.id) || []
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
          image_url: '',
          category: '',
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
            <View key={rowIndex} style={styles.gridRow}>
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
        {products.length > 3 && !showAll && (
          <TouchableOpacity onPress={() => setShowAllCategories(prev => ({ ...prev, [category]: true }))} style={styles.showMoreButton}>
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
              <X size={24} color="#fff" />
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}> </Text>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={handleSettingsPress}
        >
          <Settings size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{ 
                uri: profile.avatar_url || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=800&auto=format&fit=crop&q=60'
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
          
          <View style={styles.bioWebsiteContainer}>
            {profile.bio ? (
              <Text style={styles.bio}>{profile.bio}</Text>
            ) : null}

            {profile.website ? (
              <TouchableOpacity 
                style={styles.websiteButton}
                onPress={handleWebsitePress}
              >
                <LinkIcon size={16} color="#fff" />
                <Text style={styles.websiteText}>{profile.website}</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {user && <AvatarGroup userId={user.id} />}

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
          <View style={styles.catalogHeader}>
            <Text style={styles.catalogTitle}>My Catalog</Text>
          </View>

          {totalProducts === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No products in catalog</Text>
              <Text style={styles.emptySubtext}>Click 'Add Product' to get started</Text>
            </View>
          ) : (
            <View style={styles.categoriesContainer}>
              {Object.entries(productsByCategory).map(([category, products]) => (
                <View key={category}>
                  {renderCategorySection(category, products)}
                  <View style={styles.categoryDivider} />
                </View>
              ))}
            </View>
          )}
        </View>

        <FlatList
          data={categories}
          renderItem={({ item: category }) => (
            <View key={category.id}>
              <View style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryTitle}>{category.name}</Text>
                  {category.products.length > 3 && (
                    <TouchableOpacity 
                      style={styles.showMoreButton}
                      onPress={() => toggleCategory(category.id)}
                    >
                      <Text style={styles.showMoreText}>
                        {expandedCategories.has(category.id) ? 'הצג פחות' : 'הצג עוד'}
                      </Text>
                      <ChevronRight 
                        size={16} 
                        color="#6C5CE7" 
                        style={[
                          styles.showMoreIcon,
                          expandedCategories.has(category.id) && styles.showMoreIconRotated
                        ]} 
                      />
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.gridContainer}>
                  {expandedCategories.has(category.id) ? (
                    category.products.map(renderProductItem)
                  ) : (
                    category.products.slice(0, 3).map(renderProductItem)
                  )}
                </View>
              </View>
              <View style={styles.categoryDivider} />
            </View>
          )}
          keyExtractor={item => item.id}
          scrollEnabled={false}
          ListEmptyComponent={null}
        />
      </ScrollView>

      <TrustMarksModal />
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
    fontFamily: 'Heebo-Regular',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Heebo-Bold',
    color: '#fff',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
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
  editButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    marginBottom: 12,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Heebo-Medium',
  },
  userName: {
    fontSize: 24,
    fontFamily: 'Heebo-Bold',
    marginBottom: 2,
    textAlign: 'center',
    color: '#fff',
  },
  userTitle: {
    fontSize: 16,
    color: '#888',
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
    color: '#888',
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
    backgroundColor: '#2a2a2a',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  websiteText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Heebo-Regular',
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
    color: '#6C5CE7',
  },
  statLabel: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'Heebo-Regular',
  },
  statNumberClickable: {
    textDecorationLine: 'underline',
    color: '#6C5CE7',
  },
  statLabelClickable: {
    color: '#6C5CE7',
  },
  catalogSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  catalogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  catalogTitle: {
    fontSize: 24,
    fontFamily: 'Heebo-Bold',
    color: '#fff',
  },
  categoriesContainer: {
    gap: 24,
  },
  categorySection: {
    paddingHorizontal: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 20,
    fontFamily: 'Heebo-Bold',
    color: '#fff',
  },
  categoryCount: {
    fontSize: 14,
    fontFamily: 'Heebo-Regular',
    color: '#888',
  },
  categoryDivider: {
    height: 1,
    backgroundColor: '#2a2a2a',
    marginTop: 24,
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
    fontFamily: 'Heebo-Bold',
    color: '#fff',
  },
  gridItemPrice: {
    fontSize: 12,
    fontFamily: 'Heebo-Regular',
    color: '#fff',
  },
  emptyContainer: {
    margin: 20,
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#444',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Heebo-Bold',
    marginBottom: 8,
    color: '#fff',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'Heebo-Regular',
    textAlign: 'center',
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
    color: '#888',
    fontFamily: 'Heebo-Regular',
  },
  modalEmptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  modalEmptyText: {
    fontSize: 16,
    color: '#888',
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
    color: '#888',
    fontFamily: 'Heebo-Regular',
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  showMoreText: {
    fontSize: 14,
    fontFamily: 'Heebo-Medium',
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
});