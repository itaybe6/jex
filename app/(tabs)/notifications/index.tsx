import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
// import { supabase } from '@/lib/supabase'; // Removed, migrate to fetch-based API
import { useAuth } from '@/hooks/useAuth';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

type Notification = {
  id: string;
  created_at: string;
  type: string;
  data: any;
  read: boolean;
  user_id: string;
  is_action_done: boolean;
  product_id?: string;
  seller_name?: string;
};

// פונקציית fetch שמוסיפה את ה-access_token של המשתמש (אם קיים) ל-Authorization header
function useSupabaseFetch(access_token?: string) {
  return async (endpoint: string, options: RequestInit = {}) => {
    const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    const headers: Record<string, string> = {
      apikey: anonKey!,
      Authorization: `Bearer ${access_token || anonKey}`,
      'Content-Type': 'application/json',
    };
    if (options.method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method.toUpperCase())) {
      headers['Prefer'] = 'return=representation';
    }
    return fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {}),
      },
    });
  };
}

export default function NotificationsScreen() {
  const { user, accessToken } = useAuth();
  const supabaseFetch = useSupabaseFetch(accessToken || undefined);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionDone, setActionDone] = useState<{ [id: string]: boolean }>({});

  useEffect(() => {
    if (user) {
      console.log('user in NotificationsScreen:', user);
      fetchNotifications();
      registerForPushNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await supabaseFetch(`/rest/v1/notifications?user_id=eq.${user?.id}&select=*&order=created_at.desc`);
      if (!res.ok) {
        const err = await res.text();
        console.error('Error fetching notifications:', err);
        Alert.alert('Error', 'Failed to load notifications. Please try again later.');
        return;
      }
      const data = await res.json();
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again later.');
    }
  };

  const registerForPushNotifications = async () => {
    if (Platform.OS === 'web') return;

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Push notifications are required for this app. Please enable them in your settings.',
          [{ text: 'OK' }]
        );
        return;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });

      if (user) {
        const res = await supabaseFetch(`/rest/v1/profiles?id=eq.${user.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ push_token: token.data }),
        });
        if (!res.ok) {
          const err = await res.text();
          console.error('Error saving push token:', err);
          Alert.alert('Error', 'Failed to save push notification settings. Please try again later.');
        }
      }
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      Alert.alert('Error', 'Failed to set up push notifications. Please try again later.');
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const res = await supabaseFetch(`/rest/v1/notifications?id=eq.${notificationId}`, {
        method: 'PATCH',
        body: JSON.stringify({ read: true }),
      });
      if (!res.ok) throw new Error(await res.text());
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleDealAction = async (notification: Notification, approve: boolean) => {
    console.log('handleDealAction called');
    console.log('user:', user);
    console.log('notification:', notification);
    const buyer_id = notification.user_id;
    console.log('buyer_id:', buyer_id, 'seller_id:', notification.data?.seller_id, 'user.id:', user?.id, 'transaction_id:', notification.data?.transaction_id);
    setActionLoading(notification.id);
    setActionError(null);
    try {
      const { transaction_id, product_title, seller_id, product_id } = notification.data;
      // Fetch transaction to determine who is acting
      const txRes = await supabaseFetch(`/rest/v1/transactions?id=eq.${transaction_id}&select=*`);
      if (!txRes.ok) throw new Error(await txRes.text());
      const txArr = await txRes.json();
      const transaction = txArr[0];
      if (!transaction) throw new Error('Transaction not found');

      // If user is the buyer and approves, update notification message
      if (approve && user?.id === buyer_id && transaction.status === 'pending') {
        // Update transaction status
        await supabaseFetch(`/rest/v1/transactions?id=eq.${transaction_id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'waiting_seller_approval' }),
        });
        // Update notification message (optional)
        await supabaseFetch(`/rest/v1/notifications?id=eq.${notification.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ is_action_done: true }),
        });
      }
      // If user is the buyer and rejects, update notification message
      else if (!approve && user?.id === buyer_id && transaction.status === 'pending') {
        await supabaseFetch(`/rest/v1/transactions?id=eq.${transaction_id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'rejected_by_buyer' }),
        });
        await supabaseFetch(`/rest/v1/notifications?id=eq.${notification.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ is_action_done: true }),
        });
      }
      // If user is the seller and approves, move to completed and delete product
      else if (approve && user?.id === seller_id && transaction.status === 'waiting_seller_approval') {
        await supabaseFetch(`/rest/v1/transactions?id=eq.${transaction_id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'completed' }),
        });
        if (product_id) {
          await supabaseFetch(`/rest/v1/products?id=eq.${product_id}`, {
            method: 'DELETE',
          });
        }
        await supabaseFetch(`/rest/v1/notifications?id=eq.${notification.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ is_action_done: true }),
        });
      }
      // If seller rejects at waiting_seller_approval
      else if (!approve && user?.id === seller_id && transaction.status === 'waiting_seller_approval') {
        await supabaseFetch(`/rest/v1/transactions?id=eq.${transaction_id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'rejected_by_seller' }),
        });
        await supabaseFetch(`/rest/v1/notifications?id=eq.${notification.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ is_action_done: true }),
        });
      }
      // Fallback: do nothing, just delete notification
      else {
        await supabaseFetch(`/rest/v1/notifications?id=eq.${notification.id}`, {
          method: 'DELETE',
        });
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to update deal');
    } finally {
      setActionLoading(null);
    }
  };

  const markAllAsRead = async () => {
    try {
      if (!user) return;
      await supabaseFetch(`/rest/v1/notifications?user_id=eq.${user.id}&read=eq.false`, {
        method: 'PATCH',
        body: JSON.stringify({ read: true }),
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      markAllAsRead();
    }, [user])
  );

  const renderNotification = ({ item: notification }: { item: Notification }) => {
    const formattedDate = new Date(notification.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const profileImage =
      notification.data?.seller_avatar_url ||
      notification.data?.sender_avatar_url ||
      'https://ui-avatars.com/api/?background=0E2657&color=fff&name=' +
        encodeURIComponent(notification.data?.seller_name || notification.data?.sender_full_name || 'U');

    return (
      <View style={styles.notificationWrapper}>
        <TouchableOpacity
          style={[
            styles.notificationCard,
            !notification.read && styles.unreadCard
          ]}
          onPress={() => {
            markAsRead(notification.id);
            if (notification.product_id) {
              router.push(`/products/${notification.product_id}`);
            }
          }}
          activeOpacity={0.7}
        >
          <View style={styles.row}>
            <View style={styles.textContainer}>
              <Text style={styles.statusText}>
                {notification.type === 'waiting_seller_approval' ? 'Waiting Seller Approval' : 
                  notification.type === 'deal_completed' ? 'Deal Completed' : 
                  'New Notification'}
              </Text>
              <Text style={styles.userName}>
                {notification.data?.seller_name || notification.data?.sender_full_name || 'Unknown User'}
              </Text>
              <Text style={styles.messageText} numberOfLines={2}>
                {notification.data?.message || 'No message available'}
              </Text>
              <Text style={styles.dateText}>{formattedDate}</Text>
            </View>
            {notification.data?.product_image_url && (
              <Image
                source={{ uri: notification.data.product_image_url }}
                style={styles.productImage}
              />
            )}
          </View>
          <Image 
            source={{ uri: profileImage }}
            style={styles.profileImageFloating}
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { marginTop: 0 }]} edges={['left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity 
          onPress={() => router.push('/(tabs)/notifications/settings')}
          style={styles.settingsButton}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={24} color="#888" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 6,
    paddingTop: 32,
    marginBottom: 6,
    backgroundColor: '#F5F8FC',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Montserrat-Bold',
    color: '#111827',
  },
  settingsButton: {
    padding: 4,
    borderRadius: 8,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  notificationWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginRight: 16,
    marginLeft: 40,
    position: 'relative',
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    minHeight: 80,
    justifyContent: 'center',
  },
  unreadCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#0E2657',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 15,
    fontFamily: 'Montserrat-SemiBold',
    color: '#0E2657',
  },
  userName: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    color: '#111827',
  },
  messageText: {
    fontSize: 13,
    fontFamily: 'Montserrat-Regular',
    color: '#6B7280',
    lineHeight: 18,
  },
  dateText: {
    fontSize: 12,
    fontFamily: 'Montserrat-Regular',
    color: '#9CA3AF',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
    color: '#6B7280',
  },
  productImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    marginLeft: 12,
  },
  profileImageFloating: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E5E7EB',
    position: 'absolute',
    top: -18,
    left: 18,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
});