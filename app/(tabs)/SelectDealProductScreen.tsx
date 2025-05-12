import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, TextInput, SectionList, Modal, Alert } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabaseApi';
import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';

interface Product {
  id: string;
  title: string;
  description?: string;
  category: string;
  price: number;
  product_images?: { product_id: string; image_url: string }[];
  status: string;
}

interface Section {
  title: string;
  data: Product[];
}

const categoryToProductType: Record<string, string> = {
  bracelet: 'bracelet',
  earring: 'earring',
  gem: 'gems',
  loose_diamonds: 'loose_diamonds',
  necklace: 'necklace',
  ring: 'ring',
  rough_diamond: 'rough_diamond',
  specialpieces: 'specialpieces',
  watch: 'watches',
};

const SelectDealProductScreen: React.FC = () => {
  const { user, accessToken } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [dealMessage, setDealMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    if (user) fetchProducts();
  }, [user]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const query = '*,product_images:product_images(product_id,image_url)';
      const url = `${SUPABASE_URL}/rest/v1/products?user_id=eq.${user?.id}&select=${encodeURIComponent(query)}&order=created_at.desc`;
      const res = await fetch(url, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
        },
      });
      if (!res.ok) throw new Error('Error fetching products');
      const data = await res.json();
      setProducts(data || []);
    } catch (e) {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter only products with status 'available' or 'hold'
  const availableProducts = products.filter(
    (item) => item.status === 'available' || item.status === 'hold'
  );

  // Filter and group products by category
  const filteredProducts = availableProducts.filter(
    (item) =>
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(search.toLowerCase()))
  );

  const grouped: Section[] = Object.entries(
    filteredProducts.reduce((acc: Record<string, Product[]>, product) => {
      if (!acc[product.category]) acc[product.category] = [];
      acc[product.category].push(product);
      return acc;
    }, {})
  ).map(([category, data]) => ({ title: category, data }));

  const handleProductPress = (product: Product) => {
    // Navigate to CreateDealStoryScreen with product info
    router.push({
      pathname: '/CreateDealStoryScreen',
      params: { productId: product.id }
    });
  };

  const handleUploadDeal = async () => {
    if (!user || !selectedProduct) return;
    setUploading(true);
    try {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      // Infer product_type: use selectedProduct.type if exists, else use selectedProduct.category (lowercase, no spaces)
      const productType = (selectedProduct as any).type
        ? (selectedProduct as any).type
        : selectedProduct.category.toLowerCase().replace(/\s/g, '');
      const body = {
        user_id: user.id,
        product_id: selectedProduct.id,
        product_type: productType,
        message: dealMessage,
        expires_at: expiresAt,
      };
      const res = await fetch(`${SUPABASE_URL}/rest/v1/deal_of_the_day`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to upload deal');
      setSelectedProduct(null);
      setDealMessage('');
      setSuccessModal(true);
    } catch (e) {
      Alert.alert('Error', 'Failed to add product to Deal of the Day');
    } finally {
      setUploading(false);
    }
  };

  const handleSuccessOk = () => {
    setSuccessModal(false);
    // Navigate to home page
    router.push('/');
  };

  const renderItem = ({ item }: { item: Product }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleProductPress(item)}>
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: item.product_images?.[0]?.image_url || 'https://via.placeholder.com/150' }}
          style={styles.image}
          resizeMode="cover"
        />
        {item.status === 'hold' && (
          <View style={styles.holdBadge}>
            <Text style={styles.holdBadgeText}>HOLD</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.category}>{item.category}</Text>
        <Text style={styles.price}>₪{item.price.toLocaleString()}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section }: { section: Section }) => (
    <Text style={styles.sectionHeader}>{section.title}</Text>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Select a product for Deal of the Day</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Search by title or description"
        value={search}
        onChangeText={setSearch}
        placeholderTextColor="#7B8CA6"
      />
      {loading ? (
        <ActivityIndicator size="large" color="#6C5CE7" style={{ marginTop: 40 }} />
      ) : (
        <SectionList
          sections={grouped}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>No products found</Text>}
        />
      )}
      {/* Modal for deal confirmation */}
      <Modal
        visible={!!selectedProduct}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedProduct(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedProduct && (
              <>
                <Image
                  source={{ uri: selectedProduct.product_images?.[0]?.image_url || 'https://via.placeholder.com/150' }}
                  style={styles.modalImage}
                  resizeMode="cover"
                />
                <Text style={styles.modalTitle}>{selectedProduct.title}</Text>
                <Text style={styles.modalPrice}>₪{selectedProduct.price.toLocaleString()}</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Add a short marketing message (optional)"
                  value={dealMessage}
                  onChangeText={setDealMessage}
                  maxLength={80}
                  placeholderTextColor="#7B8CA6"
                />
                <View style={styles.modalButtonsRow}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalCancel]}
                    onPress={() => setSelectedProduct(null)}
                    disabled={uploading}
                  >
                    <Text style={styles.modalButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalConfirm]}
                    onPress={handleUploadDeal}
                    disabled={uploading}
                  >
                    <Text style={styles.modalButtonText}>{uploading ? 'Uploading...' : 'Confirm & Upload'}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
      {/* Success Modal */}
      <Modal
        visible={successModal}
        transparent
        animationType="fade"
        onRequestClose={handleSuccessOk}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModalContent}>
            <Text style={styles.successText}>Product added to Deal of the Day successfully!</Text>
            <TouchableOpacity style={styles.successButton} onPress={handleSuccessOk}>
              <Text style={styles.successButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FC',
    paddingTop: 24,
    paddingHorizontal: 16,
  },
  header: {
    fontSize: 20,
    fontFamily: 'Montserrat-Bold',
    color: '#0E2657',
    marginBottom: 16,
    textAlign: 'center',
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: 'Montserrat-Regular',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E3EAF3',
    color: '#0E2657',
  },
  listContent: {
    paddingBottom: 32,
  },
  sectionHeader: {
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
    color: '#6C5CE7',
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    padding: 12,
    shadowColor: '#0E2657',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 14,
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#E3EAF3',
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
    color: '#0E2657',
    marginBottom: 2,
  },
  category: {
    fontSize: 13,
    color: '#6C5CE7',
    fontFamily: 'Montserrat-Medium',
    marginBottom: 2,
  },
  price: {
    fontSize: 15,
    color: '#0E2657',
    fontFamily: 'Montserrat-Bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#7B8CA6',
    fontFamily: 'Montserrat-Regular',
    fontSize: 16,
    marginTop: 40,
  },
  holdBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FFA500',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    zIndex: 2,
    minWidth: 36,
    alignItems: 'center',
  },
  holdBadgeText: {
    color: '#fff',
    fontFamily: 'Montserrat-Bold',
    fontSize: 12,
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: 320,
    alignItems: 'center',
    shadowColor: '#0E2657',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  modalImage: {
    width: 90,
    height: 90,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: '#E3EAF3',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    color: '#0E2657',
    marginBottom: 4,
    textAlign: 'center',
  },
  modalPrice: {
    fontSize: 16,
    color: '#6C5CE7',
    fontFamily: 'Montserrat-Bold',
    marginBottom: 12,
  },
  modalInput: {
    width: '100%',
    backgroundColor: '#F5F8FC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: 'Montserrat-Regular',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E3EAF3',
    color: '#0E2657',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCancel: {
    backgroundColor: '#E3EAF3',
  },
  modalConfirm: {
    backgroundColor: '#6C5CE7',
  },
  modalButtonText: {
    color: '#fff',
    fontFamily: 'Montserrat-Bold',
    fontSize: 15,
  },
  successModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    width: 320,
    alignItems: 'center',
    shadowColor: '#0E2657',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  successText: {
    fontSize: 18,
    color: '#0E2657',
    fontFamily: 'Montserrat-Bold',
    marginBottom: 18,
    textAlign: 'center',
  },
  successButton: {
    backgroundColor: '#6C5CE7',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  successButtonText: {
    color: '#fff',
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
  },
});

export default SelectDealProductScreen; 