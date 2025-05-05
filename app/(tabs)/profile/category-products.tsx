import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabaseApi';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;
const NUM_COLUMNS = 3;
const GRID_SPACING = 8;
const ITEM_WIDTH = (screenWidth - 40 - (GRID_SPACING * (NUM_COLUMNS - 1))) / NUM_COLUMNS;

// Map category to specs table for subcategory
const CATEGORY_SPECS_MAP: Record<string, string> = {
  Ring: 'ring_specs',
  Rings: 'ring_specs',
  Necklace: 'necklace_specs',
  Necklaces: 'necklace_specs',
  Bracelet: 'bracelet_specs',
  Bracelets: 'bracelet_specs',
  Earring: 'earring_specs',
  Earrings: 'earring_specs',
  Gems: 'gem_specs',
  Gem: 'gem_specs',
  'Loose Diamond': 'loose_diamonds_specs',
  'Loose Diamonds': 'loose_diamonds_specs',
  'Special pieces': 'special_piece_specs',
  'Special piece': 'special_piece_specs',
  // Add more as needed
};

export default function CategoryProductsScreen() {
  const { category, userId } = useLocalSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!category || !userId) return;
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let query = '*,product_images:product_images_product_id_fkey(id,image_url)';
        if (category === 'Watches') {
          query = '*,watch_specs(brand),product_images:product_images_product_id_fkey(id,image_url)';
        } else if (category === 'Gems' || category === 'Gem') {
          query = '*,gem_specs(type),product_images:product_images_product_id_fkey(id,image_url)';
        } else if (category === 'Loose Diamond' || category === 'Loose Diamonds') {
          query = '*,loose_diamonds_specs(shape),product_images:product_images_product_id_fkey(id,image_url)';
        } else if (category === 'Special pieces' || category === 'Special piece') {
          query = '*,special_piece_specs(subcategory),product_images:product_images_product_id_fkey(id,image_url)';
        } else if (CATEGORY_SPECS_MAP[category as string]) {
          const specsTable = CATEGORY_SPECS_MAP[category as string];
          query = `*,${specsTable}(subcategory),product_images:product_images_product_id_fkey(id,image_url)`;
        }
        const url = `${SUPABASE_URL}/rest/v1/products?user_id=eq.${userId}&category=eq.${category}&select=${encodeURIComponent(query)}&order=created_at.desc`;
        const res = await fetch(url, {
          headers: {
            apikey: SUPABASE_ANON_KEY,
          },
        });
        if (!res.ok) throw new Error('Error fetching products');
        const data = await res.json();
        setProducts(data || []);
      } catch (error) {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [category, userId]);

  const handleProductPress = (productId: string) => {
    router.push({
      pathname: '/profile/product/[id]',
      params: { id: productId }
    });
  };

  // Group products by brand (Watches) or subcategory (from specs if available)
  let groupedProducts: { [key: string]: any[] } = {};
  if (category === 'Watches') {
    products.forEach(product => {
      const brand = product.watch_specs?.brand || 'No Brand';
      if (!groupedProducts[brand]) groupedProducts[brand] = [];
      groupedProducts[brand].push(product);
    });
  } else if (category === 'Gems' || category === 'Gem') {
    products.forEach(product => {
      const type = product.gem_specs?.type || 'No Type';
      if (!groupedProducts[type]) groupedProducts[type] = [];
      groupedProducts[type].push(product);
    });
  } else if (category === 'Loose Diamond' || category === 'Loose Diamonds') {
    products.forEach(product => {
      const shape = product.loose_diamonds_specs?.[0]?.shape || 'No Shape';
      if (!groupedProducts[shape]) groupedProducts[shape] = [];
      groupedProducts[shape].push(product);
    });
  } else if (category === 'Special pieces' || category === 'Special piece') {
    products.forEach(product => {
      const sub = product.special_piece_specs?.subcategory || product.subcategory || 'No Subcategory';
      if (!groupedProducts[sub]) groupedProducts[sub] = [];
      groupedProducts[sub].push(product);
    });
  } else if (CATEGORY_SPECS_MAP[category as string]) {
    const specsTable = CATEGORY_SPECS_MAP[category as string];
    products.forEach(product => {
      const sub = product[specsTable]?.subcategory || product.subcategory || 'No Subcategory';
      if (!groupedProducts[sub]) groupedProducts[sub] = [];
      groupedProducts[sub].push(product);
    });
  } else {
    products.forEach(product => {
      const sub = product.subcategory || 'No Subcategory';
      if (!groupedProducts[sub]) groupedProducts[sub] = [];
      groupedProducts[sub].push(product);
    });
  }

  // Render grid for a group (subcategory or brand)
  const renderGroupGrid = (groupName: string, groupProducts: any[]) => {
    const rows = Math.ceil(groupProducts.length / NUM_COLUMNS);
    const productsToRender = [...groupProducts];
    // Pad to fill last row
    const remainder = groupProducts.length % NUM_COLUMNS;
    if (remainder !== 0) {
      for (let i = 0; i < NUM_COLUMNS - remainder; i++) {
        productsToRender.push({ id: '', title: '', price: '', product_images: [] });
      }
    }
    // Do not show a title if groupName is fallback (empty, 'No Subcategory', 'No Type', 'No Brand', 'No Shape')
    const fallbackTitles = ['No Subcategory', 'No Type', 'No Brand', 'No Shape', '', null, undefined];
    return (
      <View key={groupName} style={{ marginBottom: 32 }}>
        {fallbackTitles.includes(groupName) ? null : (
          <Text style={styles.subcategoryTitle}>{groupName}</Text>
        )}
        <View style={styles.gridContainer}>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <View key={rowIndex} style={styles.gridRow}>
              {productsToRender
                .slice(rowIndex * NUM_COLUMNS, (rowIndex + 1) * NUM_COLUMNS)
                .map((product, colIndex) => (
                  <View key={colIndex} style={styles.gridItem}>
                    {product.id ? (
                      <TouchableOpacity
                        onPress={() => handleProductPress(product.id)}
                        style={{ flex: 1 }}
                      >
                        <Image
                          source={{ uri: product.product_images?.[0]?.image_url || 'https://via.placeholder.com/150' }}
                          style={styles.gridImage}
                          resizeMode="cover"
                        />
                        <View style={styles.gridItemOverlay}>
                          <Text style={styles.gridItemTitle} numberOfLines={1}>{product.title}</Text>
                          <Text style={styles.gridItemPrice}>${product.price?.toLocaleString?.() ?? ''}</Text>
                        </View>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ))}
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F8FC' }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#0E2657" />
          </TouchableOpacity>
          <Text style={styles.header}>{category}</Text>
          <View style={{ width: 24 }} />
        </View>
        {loading ? (
          <Text style={styles.loadingText}>Loading products...</Text>
        ) : products.length === 0 ? (
          <Text style={styles.emptyText}>No products found in this category.</Text>
        ) : (
          Object.entries(groupedProducts).map(([group, groupProducts]) =>
            renderGroupGrid(group, groupProducts)
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  header: {
    flex: 1,
    fontFamily: 'Montserrat-Bold',
    fontSize: 22,
    color: '#0E2657',
    textAlign: 'center',
  },
  subcategoryTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 17,
    color: '#6C5CE7',
    marginBottom: 10,
    marginTop: 8,
    textAlign: 'left',
  },
  loadingText: {
    fontSize: 16,
    color: '#0E2657',
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
    marginTop: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#7B8CA6',
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
    marginTop: 40,
  },
  gridContainer: {
    width: '100%',
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: GRID_SPACING,
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
}); 