import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image, TextInput, Modal, Pressable, Platform } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
// @ts-ignore
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TransactionsScreen() {
  const { user, accessToken } = useAuth();
  const params = useLocalSearchParams();
  const fromProfileType = params.fromProfileType;
  const userId = fromProfileType === 'other'
    ? (typeof params.userId === 'string' ? params.userId : null)
    : user?.id;
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation();
  const [activeStatus, setActiveStatus] = useState<'all' | 'pending' | 'completed' | 'rejected' | 'waiting_seller_approval'>('all');
  const [search, setSearch] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [dateRange, setDateRange] = useState<{start: Date | null, end: Date | null}>({ start: null, end: null });
  const [tempDateRange, setTempDateRange] = useState<{start: Date | null, end: Date | null}>({ start: null, end: null });
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useEffect(() => {
    if (userId) fetchTransactions();
  }, [userId]);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => {
        return (
          <TouchableOpacity onPress={() => {
            if (fromProfileType === 'other' && userId) {
              router.replace(`/user/${userId}`);
            } else {
              router.replace('/profile');
            }
          }} style={{ paddingHorizontal: 16 }}>
            <Text style={{ color: '#fff', fontSize: 18 }}>{'‹'}</Text>
          </TouchableOpacity>
        );
      },
    });
  }, [navigation, fromProfileType, userId]);

  const fetchTransactions = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const query = encodeURIComponent(`*,products(*),profiles:seller_id(full_name,avatar_url),buyer:buyer_id(full_name,avatar_url)`);
      const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/transactions?or=(seller_id.eq.${user.id},buyer_id.eq.${user.id})&select=${query}&order=created_at.desc`;
      const res = await fetch(url, {
        headers: {
          apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load transactions');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const renderStatus = (status: string) => {
    if (status === 'approved' || status === 'completed')
      return <Text style={[styles.status, { color: '#4CAF50' }]}>Approved</Text>;
    if (status === 'rejected')
      return <Text style={[styles.status, { color: '#FF3B30' }]}>Rejected</Text>;
    if (status === 'waiting_seller_approval')
      return <Text style={[styles.status, { color: '#6C5CE7' }]}>Waiting Seller Approval</Text>;
    return <Text style={[styles.status, { color: '#FFA500' }]}>Pending</Text>;
  };

  const fetchProfile = async (userId: string, accessToken: string) => {
    const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=full_name,avatar_url`;
    const res = await fetch(url, {
      headers: {
        'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
        'Authorization': `Bearer ${accessToken || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
      },
    });
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data[0] : {};
  };

  const handleDealAction = async (transaction: any, approve: boolean) => {
    try {
      const newStatus = approve ? 'completed' : 'rejected';
      // Update transaction status
      const res = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/transactions?id=eq.${transaction.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
          'Authorization': `Bearer ${accessToken || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error(await res.text());
      // Fetch buyer profile
      const buyerProfile = await fetchProfile(user.id, accessToken);
      // Send notification to seller
      await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/notifications`, {
        method: 'POST',
        headers: {
          'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
          'Authorization': `Bearer ${accessToken || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: transaction.seller_id,
          type: approve ? 'deal_completed' : 'deal_rejected',
          product_id: transaction.product_id,
          data: {
            message: approve
              ? `The buyer has approved the deal for product "${transaction.products?.title || ''}"`
              : `The buyer has rejected the deal for product "${transaction.products?.title || ''}"`,
            buyer_id: user.id,
            buyer_name: buyerProfile.full_name || '',
            buyer_avatar_url: buyerProfile.avatar_url || '',
            product_title: transaction.products?.title,
            product_image_url: transaction.products?.image_url,
            transaction_id: transaction.id,
          },
          read: false,
        }),
      });
      // Optionally update product status if approved
      if (approve && transaction.product_id) {
        await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/products?id=eq.${transaction.product_id}`, {
          method: 'PATCH',
          headers: {
            'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
            'Authorization': `Bearer ${accessToken || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'not_available' }),
        });
      }
      fetchTransactions();
    } catch (err: any) {
      alert('Failed to update deal: ' + (err.message || err));
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const product = item.products;
    const seller = item.profiles; // profiles:seller_id
    const buyer = item.buyer;     // buyer:buyer_id
    const isBuyer = user?.id === item.buyer_id;
    const isPending = item.status === 'pending';
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
        <View style={styles.partiesRow}>
          {/* Seller */}
          <View style={styles.partyCol}>
            <Image source={{ uri: seller?.avatar_url || 'https://via.placeholder.com/40' }} style={styles.avatar} />
            <Text style={styles.userName}>{seller?.full_name || 'Unknown'}</Text>
            <Text style={styles.role}>Seller</Text>
          </View>
          <View style={styles.partyDivider} />
          {/* Buyer */}
          <View style={styles.partyCol}>
            <Image source={{ uri: buyer?.avatar_url || 'https://via.placeholder.com/40' }} style={styles.avatar} />
            <Text style={styles.userName}>{buyer?.full_name || 'Unknown'}</Text>
            <Text style={styles.role}>Buyer</Text>
          </View>
        </View>
        <View style={styles.statusRow}>
          {renderStatus(item.status)}
          {/* Show approve/reject buttons if buyer and pending */}
          {isBuyer && isPending && (
            <View style={{ flexDirection: 'row', gap: 8, marginLeft: 12 }}>
              <TouchableOpacity
                style={{ backgroundColor: '#4CAF50', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, marginRight: 6 }}
                onPress={() => handleDealAction(item, true)}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: '#FF3B30', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 }}
                onPress={() => handleDealAction(item, false)}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Reject</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  let filteredTransactions = activeStatus === 'all'
    ? transactions
    : transactions.filter(t => {
        if (activeStatus === 'pending') return t.status === 'pending';
        if (activeStatus === 'waiting_seller_approval') return t.status === 'waiting_seller_approval';
        if (activeStatus === 'completed') return t.status === 'approved' || t.status === 'completed';
        if (activeStatus === 'rejected') return t.status === 'rejected';
        return true;
      });

  if (search.trim()) {
    const s = search.trim().toLowerCase();
    filteredTransactions = filteredTransactions.filter(t => {
      const sellerName = t.profiles?.full_name?.toLowerCase() || '';
      const buyerName = t.buyer?.full_name?.toLowerCase() || '';
      const productTitle = t.products?.title?.toLowerCase() || '';
      return sellerName.includes(s) || buyerName.includes(s) || productTitle.includes(s);
    });
  }

  if (dateRange.start || dateRange.end) {
    filteredTransactions = filteredTransactions.filter(t => {
      const d = new Date(t.created_at);
      if (dateRange.start && d < dateRange.start) return false;
      if (dateRange.end && d > dateRange.end) return false;
      return true;
    });
  }

  // Date picker web fallback
  const DateInput = ({ value, onChange }: { value: Date | null, onChange: (d: Date) => void }) => {
    if (Platform.OS === 'web') {
      return (
        <input
          type="date"
          value={value ? value.toISOString().slice(0, 10) : ''}
          onChange={e => {
            const d = new Date(e.target.value);
            if (!isNaN(d.getTime())) onChange(d);
          }}
          style={{
            background: '#1a1a1a', color: '#fff', border: '1px solid #444', borderRadius: 10, padding: 8, fontFamily: 'Heebo-Regular', fontSize: 15
          }}
        />
      );
    }
    // Native fallback
    return null;
  };

  return (
    <View style={styles.container}>
      {/* Styled Back button at the top */}
      <TouchableOpacity
        onPress={() => {
          if (fromProfileType === 'other' && userId) {
            router.replace(`/user/${userId}`);
          } else {
            router.replace('/profile');
          }
        }}
        style={styles.backButton}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={22} color="#fff" style={{ alignSelf: 'center' }} />
      </TouchableOpacity>
      <View style={styles.searchFilterRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by user or product..."
          placeholderTextColor="#888"
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity style={styles.filterIconBtn} onPress={() => {
          setTempDateRange(dateRange);
          setFilterModalVisible(true);
        }}>
          <Text style={styles.filterIconText}>Filter</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.filterRow}>
        {[
          { label: 'All', value: 'all' },
          { label: 'Pending', value: 'pending' },
          { label: 'Completed', value: 'completed' },
          { label: 'Rejected', value: 'rejected' },
        ].map(btn => (
          <TouchableOpacity
            key={btn.value}
            style={[styles.filterButton, activeStatus === btn.value && styles.filterButtonActive]}
            onPress={() => setActiveStatus(btn.value as any)}
          >
            <Text style={[styles.filterButtonText, activeStatus === btn.value && styles.filterButtonTextActive]}>{btn.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filter by Date Range</Text>
            <View style={styles.datePickersRow}>
              {/* Start Date Picker */}
              <Pressable style={styles.datePickerBtn} onPress={() => setShowStartPicker(true)}>
                <Text style={styles.datePickerText}>{tempDateRange.start ? tempDateRange.start.toLocaleDateString() : 'Start Date'}</Text>
                {Platform.OS === 'web' && showStartPicker && (
                  <DateInput value={tempDateRange.start} onChange={d => {
                    setShowStartPicker(false);
                    setTempDateRange(prev => ({ ...prev, start: d }));
                  }} />
                )}
              </Pressable>
              <Text style={{ color: '#fff', marginHorizontal: 8 }}>-</Text>
              {/* End Date Picker */}
              <Pressable style={styles.datePickerBtn} onPress={() => setShowEndPicker(true)}>
                <Text style={styles.datePickerText}>{tempDateRange.end ? tempDateRange.end.toLocaleDateString() : 'End Date'}</Text>
                {Platform.OS === 'web' && showEndPicker && (
                  <DateInput value={tempDateRange.end} onChange={d => {
                    setShowEndPicker(false);
                    setTempDateRange(prev => ({ ...prev, end: d }));
                  }} />
                )}
              </Pressable>
            </View>
            {/* Native pickers */}
            {Platform.OS !== 'web' && showStartPicker && (
              <DateTimePicker
                value={tempDateRange.start || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(e: any, d?: Date) => {
                  setShowStartPicker(false);
                  if (d) setTempDateRange(prev => ({ ...prev, start: d }));
                }}
              />
            )}
            {Platform.OS !== 'web' && showEndPicker && (
              <DateTimePicker
                value={tempDateRange.end || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(e: any, d?: Date) => {
                  setShowEndPicker(false);
                  if (d) setTempDateRange(prev => ({ ...prev, end: d }));
                }}
              />
            )}
            <View style={styles.modalActionsRow}>
              <TouchableOpacity style={styles.modalActionBtn} onPress={() => setFilterModalVisible(false)}>
                <Text style={styles.modalActionText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalActionBtn, (tempDateRange.start && tempDateRange.end && tempDateRange.end < tempDateRange.start) && { backgroundColor: '#888' }]}
                disabled={!!(tempDateRange.start && tempDateRange.end && tempDateRange.end < tempDateRange.start)}
                onPress={() => {
                  setDateRange(tempDateRange);
                  setFilterModalVisible(false);
                }}>
                <Text style={styles.modalActionText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {loading ? (
        <ActivityIndicator color="#6C5CE7" style={{ marginTop: 40 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : filteredTransactions.length === 0 ? (
        <Text style={styles.empty}>No transactions found.</Text>
      ) : (
        <FlatList
          data={filteredTransactions}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#23232b',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 8,
    marginLeft: 0,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
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
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 8,
    gap: 6,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#23232b',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
    marginHorizontal: 2,
  },
  filterButtonActive: {
    backgroundColor: '#6C5CE7',
    borderColor: '#6C5CE7',
  },
  filterButtonText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Heebo-Medium',
  },
  filterButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  partiesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
    gap: 8,
  },
  partyCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  partyDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#333',
    marginHorizontal: 8,
    borderRadius: 1,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 2,
  },
  searchFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 2,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#23232b',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Heebo-Regular',
    borderWidth: 1,
    borderColor: '#444',
  },
  filterIconBtn: {
    backgroundColor: '#6C5CE7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 6,
  },
  filterIconText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Heebo-Bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#23232b',
    borderRadius: 18,
    padding: 24,
    width: '85%',
    alignItems: 'center',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Heebo-Bold',
    marginBottom: 18,
  },
  datePickersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  datePickerBtn: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  datePickerText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Heebo-Regular',
  },
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
    gap: 12,
  },
  modalActionBtn: {
    flex: 1,
    backgroundColor: '#6C5CE7',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalActionText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Heebo-Bold',
  },
}); 