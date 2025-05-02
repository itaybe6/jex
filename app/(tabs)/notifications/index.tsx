import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, ActivityIndicator, Alert } from 'react-native';
import { Settings } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
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
};

export default function NotificationsScreen() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionDone, setActionDone] = useState<{ [id: string]: boolean }>({});

  useEffect(() => {
    if (user) {
      fetchNotifications();
      registerForPushNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
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
        console.log('Failed to get push token for push notification!');
        return;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });

      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ push_token: token.data })
          .eq('id', user.id);

        if (error) {
          console.error('Error saving push token:', error);
        }
      }
    } catch (error) {
      console.error('Error registering for push notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

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
      const { data: transaction, error: txFetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transaction_id)
        .single();
      if (txFetchError) throw txFetchError;
      if (!transaction) throw new Error('Transaction not found');
      // If user is the buyer and approves, update notification message
      if (approve && user?.id === buyer_id && transaction.status === 'pending') {
        // Update transaction status
        const { error: txError } = await supabase
          .from('transactions')
          .update({ status: 'waiting_seller_approval' })
          .eq('id', transaction_id);
        if (txError) throw txError;
        // Update notification message and is_action_done (column only)
        const newMessage = 'The deal was approved and is waiting for the seller\'s final approval.';
        const newData = { ...notification.data, message: newMessage };
        const { error: notifUpdateError } = await supabase
          .from('notifications')
          .update({ data: newData, is_action_done: true })
          .eq('id', notification.id);
        if (notifUpdateError) throw notifUpdateError;
        setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, data: newData, is_action_done: true } : n));
        // Fetch buyer profile
        const { data: buyerProfile, error: buyerProfileError } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .single();
        if (buyerProfileError) throw buyerProfileError;
        // Insert new notification for seller
        const { error: sellerNotifError } = await supabase
          .from('notifications')
          .insert({
            user_id: seller_id,
            type: 'waiting_seller_approval',
            data: {
              message: 'The buyer approved the price. Please complete the deal by clicking Complete Deal.',
              transaction_id,
              product_id,
              sender_avatar_url: buyerProfile.avatar_url || null,
              sender_full_name: buyerProfile.full_name || user.email || 'Buyer',
            },
            read: false,
            is_action_done: false,
          });
        if (sellerNotifError) throw sellerNotifError;
        Alert.alert('Waiting Seller Approval', newMessage);
        return;
      }
      // If user is the buyer and rejects, update notification message
      if (!approve && user?.id === buyer_id && transaction.status === 'pending') {
        // Update transaction status
        const { error: txError } = await supabase
          .from('transactions')
          .update({ status: 'rejected' })
          .eq('id', transaction_id);
        if (txError) throw txError;
        // Update notification message and is_action_done (column only)
        const newMessage = 'The deal was rejected by the buyer.';
        const newData = { ...notification.data, message: newMessage };
        const { error: notifUpdateError } = await supabase
          .from('notifications')
          .update({ data: newData, is_action_done: true })
          .eq('id', notification.id);
        if (notifUpdateError) throw notifUpdateError;
        setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, data: newData, is_action_done: true } : n));
        // Fetch buyer profile
        const { data: buyerProfile, error: buyerProfileError } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .single();
        if (buyerProfileError) throw buyerProfileError;
        // Insert new notification for seller
        const { error: sellerNotifError } = await supabase
          .from('notifications')
          .insert({
            user_id: seller_id,
            type: 'waiting_seller_approval',
            data: {
              message: 'The buyer rejected the deal.',
              transaction_id,
              product_id,
              sender_avatar_url: buyerProfile.avatar_url || null,
              sender_full_name: buyerProfile.full_name || user.email || 'Buyer',
            },
            read: false,
            is_action_done: false,
          });
        if (sellerNotifError) throw sellerNotifError;
        Alert.alert('Deal Rejected', newMessage);
        return;
      }
      // If user is the seller and approves, move to completed and delete product
      if (approve && user?.id === seller_id && transaction.status === 'waiting_seller_approval') {
        // Update status
        const { error: txError } = await supabase
          .from('transactions')
          .update({ status: 'completed' })
          .eq('id', transaction_id);
        if (txError) throw txError;
        // Delete product
        if (product_id) {
          const { error: deleteError } = await supabase
            .from('products')
            .delete()
            .eq('id', product_id);
          if (deleteError) throw deleteError;
        }
        // Delete old notification
        const { error: delNotifError } = await supabase
          .from('notifications')
          .delete()
          .eq('id', notification.id);
        console.log('delNotifError:', delNotifError);
        if (delNotifError) throw delNotifError;
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
        Alert.alert('Deal Completed', 'The deal is completed and the product was removed.');
        return;
      }
      // If seller rejects at waiting_seller_approval
      if (!approve && user?.id === seller_id && transaction.status === 'waiting_seller_approval') {
        // Update status
        const { error: txError } = await supabase
          .from('transactions')
          .update({ status: 'rejected' })
          .eq('id', transaction_id);
        if (txError) throw txError;
        // Delete old notification
        const { error: delNotifError } = await supabase
          .from('notifications')
          .delete()
          .eq('id', notification.id);
        console.log('delNotifError:', delNotifError);
        if (delNotifError) throw delNotifError;
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
        Alert.alert('Deal Rejected', 'You have rejected the deal.');
        return;
      }
      // Fallback: do nothing
      await supabase.from('notifications').delete().eq('id', notification.id);
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    } catch (err: any) {
      setActionError(err.message || 'Failed to update deal');
    } finally {
      setActionLoading(null);
    }
  };

  const markAllAsRead = async () => {
    try {
      if (!user) return;
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);
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

    const profileImage = notification.data?.sender_avatar_url || 'https://ui-avatars.com/api/?background=0E2657&color=fff&name=' + encodeURIComponent(notification.data?.sender_full_name || 'U');

    return (
      <View style={styles.notificationWrapper}>
        <Image 
          source={{ uri: profileImage }}
          style={styles.profileImage}
        />
        <TouchableOpacity
          style={[
            styles.notificationCard,
            !notification.read && styles.unreadCard
          ]}
          onPress={() => markAsRead(notification.id)}
          activeOpacity={0.7}
        >
          <View style={styles.textContainer}>
            <Text style={styles.statusText}>
              {notification.type === 'waiting_seller_approval' ? 'Waiting Seller Approval' : 
               notification.type === 'deal_completed' ? 'Deal Completed' : 
               'New Notification'}
            </Text>
            
            <Text style={styles.userName}>
              {notification.data?.sender_full_name || 'Unknown User'}
            </Text>
            
            <Text style={styles.messageText} numberOfLines={2}>
              {notification.data?.message || 'No message available'}
            </Text>
            
            <Text style={styles.dateText}>{formattedDate}</Text>
          </View>
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
          <Settings size={24} color="#0E2657" />
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
    paddingLeft: 40,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  unreadCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#0E2657',
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E7EB',
    position: 'absolute',
    left: -24,
    zIndex: 1,
    borderWidth: 5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  textContainer: {
    gap: 4,
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
});