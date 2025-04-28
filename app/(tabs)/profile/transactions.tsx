import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { router, useLocalSearchParams } from 'expo-router';

export default function TransactionsScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const userId = typeof params.userId === 'string' ? params.userId : user?.id;
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) fetchTransactions();
  }, [userId]);

  const fetchTransactions = async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`*, products(*), profiles:seller_id(full_name, avatar_url), buyer:buyer_id(full_name, avatar_url)`)
        .or(`seller_id.eq.${userId},buyer_id.eq.${userId}`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setTransactions(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const renderStatus = (status: string) => {
    if (status === 'approved') return <Text style={[styles.status, { color: '#4CAF50' }]}>Approved</Text>;
    if (status === 'rejected') return <Text style={[styles.status, { color: '#FF3B30' }]}>Rejected</Text>;
    return <Text style={[styles.status, { color: '#FFA500' }]}>Pending</Text>;
  };

  const renderItem = ({ item }: { item: any }) => {
    if (!user) return null;
    const isSeller = item.seller_id === user.id;
    const otherUser = isSeller ? item.buyer : item.profiles;
    const product = item.products;
    return (
      <View style={styles.card}>
        <View style={styles.row}>
          <Image source={{ uri: product?.image_url || 'https://via.placeholder.com/60' }} style={styles.productImage} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.productTitle}>{product?.title || 'Product'}</Text>
            <Text style={styles.price}>${item.price}</Text>
            <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
          </View>
        </View>
        <View style={styles.row}>
          <Image source={{ uri: otherUser?.avatar_url || 'https://via.placeholder.com/40' }} style={styles.avatar} />
          <Text style={styles.userName}>{otherUser?.full_name || ''}</Text>
          <Text style={styles.role}>{isSeller ? 'Buyer' : 'Seller'}</Text>
          {renderStatus(item.status)}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator color="#6C5CE7" style={{ marginTop: 40 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : transactions.length === 0 ? (
        <Text style={styles.empty}>No transactions found.</Text>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
      <TouchableOpacity style={styles.backButton} onPress={() => {
        if (params.userId) {
          router.replace(`/user/${params.userId}`);
        } else {
          router.replace('/profile');
        }
      }}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingTop: 40,
    paddingHorizontal: 16,
  },
  header: {
    fontSize: 24,
    fontFamily: 'Heebo-Bold',
    color: '#fff',
    marginBottom: 24,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  productTitle: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Heebo-Bold',
  },
  price: {
    fontSize: 14,
    color: '#6C5CE7',
    fontFamily: 'Heebo-Medium',
  },
  date: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'Heebo-Regular',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    marginRight: 8,
  },
  userName: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'Heebo-Medium',
    marginRight: 8,
  },
  role: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'Heebo-Regular',
    marginRight: 8,
  },
  status: {
    fontSize: 14,
    fontFamily: 'Heebo-Bold',
    marginLeft: 'auto',
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginTop: 40,
  },
  empty: {
    color: '#888',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  backButton: {
    marginTop: 16,
    alignSelf: 'center',
    backgroundColor: '#6C5CE7',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Heebo-Medium',
  },
}); 