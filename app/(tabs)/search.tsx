import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

type Profile = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  title: string | null;
};

type Product = {
  id: string;
  title: string;
  price: number;
  image_url: string | null;
  category: string;
  product_images?: { image_url: string }[];
  watch_specs?: { brand?: string; model?: string };
  gem_specs?: { type?: string };
  specs?: { subcategory?: string };
};

const SEARCH_MODES = {
  USERS: 'users',
  PRODUCTS: 'products',
} as const;

type SearchMode = typeof SEARCH_MODES[keyof typeof SEARCH_MODES];

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>(SEARCH_MODES.USERS);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!debouncedQuery) {
      setProfiles([]);
      setProducts([]);
      return;
    }
    if (searchMode === SEARCH_MODES.USERS) {
      searchProfiles();
    } else {
      searchProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, searchMode]);

  const searchProfiles = async () => {
    try {
      setLoading(true);
      if (!debouncedQuery.trim()) {
        setProfiles([]);
        setLoading(false);
        return;
      }
      const url = `${SUPABASE_URL}/rest/v1/profiles?select=id,full_name,avatar_url,title&full_name=ilike.*${debouncedQuery.trim()}*&limit=20`;
      const res = await fetch(url, {
        headers: {
          apikey: SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      const text = await res.text();
      const data = JSON.parse(text);
      console.log('Profiles response:', data);
      if (!res.ok) throw new Error(text);
      setProfiles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error searching profiles:', error);
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  const searchProducts = async () => {
    try {
      setLoading(true);
      const query = encodeURIComponent(`or=(
        category.ilike.*${debouncedQuery}*,
        specs.subcategory.ilike.*${debouncedQuery}*,
        ring_specs.subcategory.ilike.*${debouncedQuery}*,
        necklace_specs.subcategory.ilike.*${debouncedQuery}*,
        bracelet_specs.subcategory.ilike.*${debouncedQuery}*,
        earring_specs.subcategory.ilike.*${debouncedQuery}*,
        special_piece_specs.subcategory.ilike.*${debouncedQuery}*,
        watch_specs.brand.ilike.*${debouncedQuery}*,
        watch_specs.model.ilike.*${debouncedQuery}*,
        gem_specs.type.ilike.*${debouncedQuery}*
      )`);
      const url = `${SUPABASE_URL}/rest/v1/products?${query}&select=*,product_images(image_url),watch_specs(*),gem_specs(*),ring_specs(*),necklace_specs(*),bracelet_specs(*),earring_specs(*),special_piece_specs(*)&limit=20`;
      const res = await fetch(url, {
        headers: {
          apikey: SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error searching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePress = (profileId: string) => {
    router.push(`/user/${profileId}`);
  };

  const handleProductPress = (productId: string) => {
    router.push(`/products/${productId}`);
  };

  const renderProfileItem = ({ item }: { item: Profile }) => (
    <TouchableOpacity 
      style={styles.profileItem}
      onPress={() => handleProfilePress(item.id)}
    >
      <Image
        source={{ 
          uri: item.avatar_url || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=800&auto=format&fit=crop&q=60'
        }}
        style={styles.avatar}
      />
      <View style={styles.profileInfo}>
        <Text style={styles.profileName}>{item.full_name}</Text>
        {item.title && (
          <Text style={styles.profileTitle}>{item.title}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderProductItem = ({ item }: { item: Product }) => {
    const imageUrl = item.product_images?.[0]?.image_url || item.image_url || 'https://via.placeholder.com/150';
    return (
      <TouchableOpacity
        style={styles.productItem}
        onPress={() => handleProductPress(item.id)}
      >
        <Image source={{ uri: imageUrl }} style={styles.productImage} />
        <View style={styles.productInfoBox}>
          <Text style={styles.productTitleText} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.productCategory}>{item.category}</Text>
          <Text style={styles.productPrice}>₪{item.price?.toLocaleString()}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        
        <View style={styles.switcherContainer}>
          <TouchableOpacity
            style={[styles.switcherButton, searchMode === SEARCH_MODES.USERS && styles.switcherButtonActive]}
            onPress={() => setSearchMode(SEARCH_MODES.USERS)}
          >
            <Text style={[styles.switcherText, searchMode === SEARCH_MODES.USERS && styles.switcherTextActive]}>Users</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.switcherButton, searchMode === SEARCH_MODES.PRODUCTS && styles.switcherButtonActive]}
            onPress={() => setSearchMode(SEARCH_MODES.PRODUCTS)}
          >
            <Text style={[styles.switcherText, searchMode === SEARCH_MODES.PRODUCTS && styles.switcherTextActive]}>Products</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={searchMode === SEARCH_MODES.USERS ? "Search users by name..." : "Search products by keyword..."}
            value={searchQuery}
            onChangeText={setSearchQuery}
            textAlign="left"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <Ionicons name="close" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : searchMode === SEARCH_MODES.USERS ? (
        profiles.length > 0 ? (
          <FlatList
            data={profiles}
            renderItem={renderProfileItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : searchQuery.length > 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="person" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No users found</Text>
            <Text style={styles.emptySubtext}>Try searching for something else</Text>
          </View>
        ) : (
          <View style={styles.initialContainer}>
            <Ionicons name="search" size={48} color="#ccc" />
            <Text style={styles.initialText}>Find Users</Text>
            <Text style={styles.initialSubtext}>Enter a name to start searching</Text>
          </View>
        )
      ) : (
        products.length > 0 ? (
          <FlatList
            data={products}
            renderItem={renderProductItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : searchQuery.length > 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No products found</Text>
            <Text style={styles.emptySubtext}>Try searching for something else</Text>
          </View>
        ) : (
          <View style={styles.initialContainer}>
            <Ionicons name="search" size={48} color="#ccc" />
            <Text style={styles.initialText}>Find Products</Text>
            <Text style={styles.initialSubtext}>Enter a keyword to start searching</Text>
          </View>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Heebo-Bold',
    marginBottom: 16,
    color: '#fff',
  },
  switcherContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#232323',
    borderRadius: 8,
    alignSelf: 'center',
  },
  switcherButton: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  switcherButtonActive: {
    backgroundColor: '#fff',
  },
  switcherText: {
    color: '#888',
    fontFamily: 'Heebo-Medium',
    fontSize: 16,
  },
  switcherTextActive: {
    color: '#232323',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Heebo-Regular',
    paddingVertical: 8,
    color: '#fff',
  },
  clearButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontFamily: 'Heebo-Medium',
    marginBottom: 2,
    color: '#fff',
  },
  profileTitle: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'Heebo-Regular',
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  productImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#222',
  },
  productInfoBox: {
    flex: 1,
  },
  productTitleText: {
    fontSize: 16,
    fontFamily: 'Heebo-Medium',
    color: '#fff',
    marginBottom: 2,
  },
  productCategory: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'Heebo-Regular',
    marginBottom: 2,
  },
  productPrice: {
    fontSize: 14,
    color: '#6C5CE7',
    fontFamily: 'Heebo-Bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Heebo-Bold',
    color: '#fff',
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Heebo-Regular',
    color: '#888',
  },
  initialContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialText: {
    fontSize: 18,
    fontFamily: 'Heebo-Bold',
    color: '#fff',
  },
  initialSubtext: {
    fontSize: 14,
    fontFamily: 'Heebo-Regular',
    color: '#888',
  },
});