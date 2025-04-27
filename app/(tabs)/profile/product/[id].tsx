import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator, TouchableOpacity, Alert, Modal, FlatList, TextInput } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { ChevronRight } from 'lucide-react-native';

type ProductDetails = {
  id: string;
  title: string;
  price: number;
  image_url: string;
  description: string;
  user_id: string;
  details: {
    weight?: string;
    clarity?: string;
    color?: string;
    cut?: string;
    [key: string]: string | undefined;
  } | null;
  category: string;
};

export default function ProductScreen() {
  const params = useLocalSearchParams();
  const productId = typeof params.id === 'string' ? params.id : '';
  const { user } = useAuth();
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAsSold, setMarkingAsSold] = useState(false);
  const [buyerModalVisible, setBuyerModalVisible] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState<any | null>(null);
  const [buyerError, setBuyerError] = useState<string | null>(null);
  const [dealLoading, setDealLoading] = useState(false);
  const [dealError, setDealError] = useState<string | null>(null);
  const [dealSuccess, setDealSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Product not found');

      setProduct(data);
    } catch (error: any) {
      console.error('Error fetching product:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsSold = async () => {
    if (!product || !user) return;

    try {
      setMarkingAsSold(true);

      const { data: soldData, error: soldError } = await supabase
        .from('sold_products')
        .insert([{
          product_id: product.id,
          seller_id: user.id,
          price: product.price
        }])
        .select()
        .single();

      if (soldError) {
        console.error('Error marking product as sold:', soldError);
        throw new Error('An error occurred while marking the product as sold');
      }

      if (!soldData) {
        throw new Error('Failed to mark the product as sold');
      }

      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id)
        .eq('user_id', user.id);

      if (deleteError) {
        await supabase
          .from('sold_products')
          .delete()
          .eq('id', soldData.id);
          
        throw new Error('An error occurred while deleting the product from the catalog');
      }

      Alert.alert(
        'Success',
        'The product has been marked as sold and removed from the catalog',
        [
          {
            text: 'OK',
            onPress: () => router.replace(`/(tabs)/profile`)
          }
        ]
      );
    } catch (error: any) {
      console.error('Error in handleMarkAsSold:', error);
      Alert.alert('Error', error.message || 'An error occurred while marking the product as sold');
    } finally {
      setMarkingAsSold(false);
    }
  };

  const loadUsers = async () => {
    if (!user) {
      setBuyerError('You must be logged in to load users');
      setUsersLoading(false);
      return;
    }
    setUsersLoading(true);
    setBuyerError(null);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, title')
        .neq('id', user.id);
      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      setBuyerError('Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  };

  const openBuyerModal = () => {
    loadUsers();
    setBuyerModalVisible(true);
  };
  const closeBuyerModal = () => {
    setBuyerModalVisible(false);
    setSelectedBuyer(null);
  };

  const confirmMarkAsSold = () => {
    if (!product || !user) return;
    openBuyerModal();
  };

  const handleBackToSeller = () => {
    if (product) {
      router.push(`/user/${product.user_id}`);
    }
  };

  const sendDealRequest = async () => {
    if (!product || !user || !selectedBuyer) return;
    setDealLoading(true);
    setDealError(null);
    try {
      // שלוף את הפרופיל של המשתמש השולח
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single();
      // 1. צור רשומה ב-transactions
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          product_id: product.id,
          seller_id: user.id,
          buyer_id: selectedBuyer.id,
          price: product.price,
          status: 'pending',
        })
        .select()
        .single();
      if (transactionError) throw transactionError;
      // 2. שלח notification לקונה
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: selectedBuyer.id,
          type: 'deal_request',
          data: {
            transaction_id: transaction.id,
            product_id: product.id,
            seller_id: user.id,
            price: product.price,
            product_title: product.title,
            sender_id: user.id,
            sender_name: profile?.full_name || user.email || 'User',
            sender_avatar: profile?.avatar_url || null,
          },
          read: false,
        });
      if (notifError) throw notifError;
      setDealSuccess(true);
      setTimeout(() => {
        setDealSuccess(false);
        closeBuyerModal();
      }, 1500);
    } catch (err: any) {
      setDealError(err.message || 'Failed to send deal request');
    } finally {
      setDealLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Product not found'}</Text>
      </View>
    );
  }

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString()}`;
  };

  const renderDetails = () => {
    if (!product.details) return null;

    const detailsToShow = [
      { label: 'Weight', value: product.details.weight ? `${product.details.weight} ct` : undefined },
      { label: 'Clarity', value: product.details.clarity },
      { label: 'Color', value: product.details.color },
      { label: 'Cut', value: product.details.cut },
    ].filter(detail => detail.value);

    if (detailsToShow.length === 0) return null;

    return (
      <View style={styles.detailsContainer}>
        <Text style={styles.detailsTitle}>Specifications</Text>
        <View style={styles.detailsGrid}>
          {detailsToShow.map((detail, index) => (
            <View key={index} style={styles.detailItem}>
              <Text style={styles.detailLabel}>{detail.label}</Text>
              <Text style={styles.detailValue}>{detail.value}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const isOwner = user?.id === product.user_id;

  return (
    <>
      <ScrollView style={styles.container}>
        <Image source={{ uri: product.image_url }} style={styles.image} />
        
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>{product.title}</Text>
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
          </View>

          <View style={styles.categoryContainer}>
            <Text style={styles.categoryLabel}>Category:</Text>
            <Text style={styles.categoryValue}>{product.category}</Text>
          </View>

          <Text style={styles.description}>{product.description}</Text>

          {renderDetails()}

          {isOwner && (
            <TouchableOpacity
              style={[styles.soldButton, markingAsSold && styles.soldButtonDisabled]}
              onPress={confirmMarkAsSold}
              disabled={markingAsSold}
            >
              <Text style={styles.soldButtonText}>
                {markingAsSold ? 'Marking as sold...' : 'Mark as Sold'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
      {/* Buyer Selection Modal */}
      <Modal
        visible={buyerModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeBuyerModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Buyer</Text>
            <View style={{ width: '100%', marginBottom: 12 }}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search users..."
                placeholderTextColor="#aaa"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            {usersLoading ? (
              <ActivityIndicator color="#6C5CE7" />
            ) : buyerError ? (
              <Text style={{ color: 'red' }}>{buyerError}</Text>
            ) : (
              <FlatList
                data={filteredUsers}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.buyerItem,
                      selectedBuyer?.id === item.id && styles.buyerItemSelected
                    ]}
                    onPress={() => setSelectedBuyer(item)}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Image
                        source={{ uri: item.avatar_url || 'https://via.placeholder.com/40' }}
                        style={styles.buyerAvatar}
                      />
                      <Text style={styles.buyerName}>{item.full_name || item.title}</Text>
                    </View>
                  </TouchableOpacity>
                )}
                style={{ maxHeight: 250, marginBottom: 16 }}
              />
            )}
            <View style={styles.buttonRow}>
              <TouchableOpacity onPress={closeBuyerModal} style={styles.cancelButton}> 
                <Text style={styles.soldButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={sendDealRequest}
                style={[styles.sendButton, (!selectedBuyer || dealLoading) && styles.sendButtonDisabled]}
                disabled={!selectedBuyer || dealLoading}
              >
                {dealLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.soldButtonText}>Send Deal Request</Text>
                )}
              </TouchableOpacity>
            </View>
            {dealError && <Text style={{ color: 'red', marginBottom: 8 }}>{dealError}</Text>}
            {dealSuccess && <Text style={{ color: 'green', marginBottom: 8 }}>Deal request sent!</Text>}
          </View>
        </View>
      </Modal>
    </>
  );
}

// Add navigation options to hide the header
ProductScreen.getNavigation = () => {
  return (
    <Stack.Screen
      options={{
        headerShown: false
      }}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    fontFamily: 'Heebo-Regular',
  },
  image: {
    width: '100%',
    height: 300,
    backgroundColor: '#2a2a2a',
  },
  content: {
    padding: 20,
    backgroundColor: '#1a1a1a',
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Heebo-Bold',
    marginBottom: 8,
    textAlign: 'right',
    color: '#fff',
  },
  price: {
    fontSize: 20,
    color: '#007AFF',
    fontFamily: 'Heebo-Bold',
    textAlign: 'right',
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 16,
    backgroundColor: '#2a2a2a',
    padding: 8,
    borderRadius: 8,
  },
  categoryLabel: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'Heebo-Regular',
    marginLeft: 8,
  },
  categoryValue: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'Heebo-Medium',
  },
  description: {
    fontSize: 16,
    color: '#888',
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'right',
    fontFamily: 'Heebo-Regular',
  },
  detailsContainer: {
    marginBottom: 24,
  },
  detailsTitle: {
    fontSize: 18,
    fontFamily: 'Heebo-Bold',
    marginBottom: 16,
    textAlign: 'right',
    color: '#fff',
  },
  detailsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 16,
  },
  detailItem: {
    width: '45%',
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 8,
    alignItems: 'flex-end',
  },
  detailLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
    fontFamily: 'Heebo-Regular',
  },
  detailValue: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Heebo-Medium',
  },
  soldButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  soldButtonDisabled: {
    opacity: 0.6,
  },
  soldButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Heebo-Bold',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#23232b',
    borderRadius: 24,
    padding: 32,
    width: '95%',
    maxWidth: 500,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
  },
  modalTitle: {
    fontSize: 24,
    color: '#fff',
    fontFamily: 'Heebo-Bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  searchInput: {
    width: '100%',
    backgroundColor: '#2a2a2a',
    color: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    fontFamily: 'Heebo-Regular',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  buyerItem: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: '#333',
    marginBottom: 12,
    width: '100%',
    alignItems: 'flex-start',
    flexDirection: 'row',
    alignSelf: 'center',
  },
  buyerItemSelected: {
    backgroundColor: '#6C5CE7',
  },
  buyerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#444',
    marginRight: 14,
    borderWidth: 2,
    borderColor: '#fff',
  },
  buyerName: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Heebo-Medium',
    alignSelf: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 24,
    gap: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#888',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    marginRight: 8,
    elevation: 2,
    justifyContent: 'center',
    minWidth: 120,
  },
  sendButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    marginLeft: 8,
    elevation: 2,
    opacity: 1,
    justifyContent: 'center',
    minWidth: 120,
  },
  sendButtonDisabled: {
    backgroundColor: '#a15a56',
    opacity: 0.7,
  },
});