import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { Settings } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import React from 'react';

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

  const renderNotification = (notification: Notification) => {
    const { type, data } = notification;
    
    let title = '';
    let description = '';
    let image = null;
    const senderName = data.sender_name;
    const senderAvatar = data.sender_avatar;

    if (type === 'new_product') {
      title = 'New Product Listed';
      description = `A new ${data.cut} diamond, ${data.weight}ct, ${data.clarity}, color ${data.color} has been listed`;
      image = data.image_url;
    } else if (type === 'new_request') {
      title = 'New Request Posted';
      description = `Someone is looking for a ${data.cut} diamond, ${data.weight}ct, ${data.clarity}, color ${data.color}`;
    } else if (type === 'deal_request') {
      const displayName = senderName || 'Unknown User';
      const displayAvatar = senderAvatar || 'https://ui-avatars.com/api/?name=User';
      const messageToShow = data.message || 'No message available.';
      return (
        <View key={notification.id} style={[styles.notificationCard, !notification.read && styles.unreadCard]}>
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>Deal Request</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Image source={{ uri: displayAvatar }} style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8, backgroundColor: '#444' }} />
              <Text style={{ color: '#fff', fontSize: 14 }}>{displayName}</Text>
            </View>
            <View style={styles.dealProductBox}>
              {data.product_image_url && (
                <Image source={{ uri: data.product_image_url }} style={styles.dealProductImage} />
              )}
              <View style={{ flex: 1, marginLeft: 10 }}>
                {data.product_title && (
                  <Text style={styles.dealProductTitle}>{data.product_title}</Text>
                )}
                {data.product_description && (
                  <Text style={styles.dealProductDesc}>{data.product_description}</Text>
                )}
                {typeof data.price !== 'undefined' && (
                  <View style={styles.dealProductPriceRow}>
                    <Text style={styles.dealProductPriceIcon}>💰</Text>
                    <Text style={styles.dealProductPrice}>{data.price} ₪</Text>
                  </View>
                )}
              </View>
            </View>
            <Text style={[styles.notificationDescription, {marginTop: 8}]}>{messageToShow}</Text>
            <Text style={styles.notificationTime}>{new Date(notification.created_at).toLocaleDateString()}</Text>
            {actionError && actionLoading === notification.id && (
              <Text style={{ color: 'red', marginVertical: 4 }}>{actionError}</Text>
            )}
            {type === 'deal_request' && !notification.is_action_done && (
              <View style={{ flexDirection: 'row', marginTop: 8 }}>
                <TouchableOpacity
                  style={[styles.soldButton, { backgroundColor: '#4CAF50', flex: 1, marginRight: 8, opacity: actionLoading && actionLoading === notification.id ? 0.5 : 1 }]}
                  onPress={() => handleDealAction(notification, true)}
                  disabled={!!actionLoading}
                >
                  {actionLoading === notification.id ? <ActivityIndicator color="#fff" /> : <Text style={styles.soldButtonText}>Approve</Text>}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.soldButton, { backgroundColor: '#FF3B30', flex: 1, opacity: actionLoading && actionLoading === notification.id ? 0.5 : 1 }]}
                  onPress={() => handleDealAction(notification, false)}
                  disabled={!!actionLoading}
                >
                  {actionLoading === notification.id ? <ActivityIndicator color="#fff" /> : <Text style={styles.soldButtonText}>Reject</Text>}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      );
    } else if (type === 'deal_approved' || type === 'deal_rejected') {
      return (
        <View key={notification.id} style={[styles.notificationCard, !notification.read && styles.unreadCard]}>
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>{type === 'deal_approved' ? 'Deal Approved' : 'Deal Rejected'}</Text>
            {senderName && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                {senderAvatar && (
                  <Image source={{ uri: senderAvatar }} style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8 }} />
                )}
                <Text style={{ color: '#fff', fontSize: 14 }}>{senderName}</Text>
              </View>
            )}
            <Text style={styles.notificationDescription}>{data.message || (type === 'deal_approved' ? 'The deal was approved. You can now remove the product from your catalog.' : 'The deal was rejected.')}</Text>
            <Text style={styles.notificationTime}>{new Date(notification.created_at).toLocaleDateString()}</Text>
            {type === 'deal_approved' && (
              <TouchableOpacity
                style={[styles.soldButton, { backgroundColor: '#FF3B30', marginTop: 8 }]}
                onPress={async () => {
                  setActionLoading(notification.id);
                  setActionError(null);
                  try {
                    const { product_id } = data;
                    if (!product_id) throw new Error('Missing product_id');
                    const { data: deleted, error: deleteError } = await supabase
                      .from('products')
                      .delete()
                      .eq('id', product_id);
                    if (deleteError) throw deleteError;
                    await markAsRead(notification.id);
                    setNotifications(prev => prev.filter(n => n.id !== notification.id));
                    Alert.alert('Product Removed', 'The product was removed from your catalog.');
                  } catch (err: any) {
                    setActionError(err.message || 'Failed to remove product');
                  } finally {
                    setActionLoading(null);
                  }
                }}
                disabled={!!actionLoading}
              >
                {actionLoading === notification.id ? <ActivityIndicator color="#fff" /> : <Text style={styles.soldButtonText}>Finish & Remove Product</Text>}
              </TouchableOpacity>
            )}
            {actionError && actionLoading === notification.id && (
              <Text style={{ color: 'red', marginVertical: 4 }}>{actionError}</Text>
            )}
          </View>
        </View>
      );
    } else if (type === 'waiting_seller_approval') {
      const displayName = data.sender_full_name || 'Unknown User';
      const displayAvatar = data.sender_avatar_url || 'https://ui-avatars.com/api/?name=User';
      const messageToShow = data.message || 'No message available.';
      return (
        <View key={notification.id} style={[styles.notificationCard, { backgroundColor: notification.is_action_done ? '#23232b' : '#6C5CE7' }, !notification.read && styles.unreadCard]}>
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>Waiting Seller Approval</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Image source={{ uri: displayAvatar }} style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8, backgroundColor: '#444' }} />
              <Text style={{ color: '#fff', fontSize: 14 }}>{displayName}</Text>
            </View>
            <Text style={styles.notificationDescription}>{messageToShow}</Text>
            <Text style={styles.notificationTime}>{new Date(notification.created_at).toLocaleDateString()}</Text>
            {!notification.is_action_done && (
              <TouchableOpacity
                style={[styles.soldButton, { backgroundColor: '#4CAF50', marginTop: 8 }]}
                onPress={async () => {
                  console.log('Complete Deal clicked', data.product_id, notification.id);
                  Alert.alert(
                    'Are you sure?',
                    'Are you sure you want to complete the deal? The product will be removed from the catalog.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Confirm',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            console.log('Complete Deal clicked', data.product_id, notification.id);
                            // Delete product
                            const { error: deleteError } = await supabase
                              .from('products')
                              .delete()
                              .eq('id', data.product_id);
                            console.log('Product delete result:', deleteError);
                            if (deleteError) throw deleteError;
                            // Update notification is_action_done
                            const { error: notifDoneError } = await supabase
                              .from('notifications')
                              .update({ is_action_done: true })
                              .eq('id', notification.id);
                            console.log('Notification update result:', notifDoneError);
                            if (notifDoneError) throw notifDoneError;
                            setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, is_action_done: true } : n));
                            Alert.alert('Deal Completed', 'The product was removed from the catalog.');
                          } catch (err: any) {
                            Alert.alert('Error', err.message || 'An error occurred while deleting the product');
                          }
                        },
                      },
                    ]
                  );
                }}
              >
                <Text style={styles.soldButtonText}>Complete Deal</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    }

    return (
      <TouchableOpacity
        key={notification.id}
        style={[styles.notificationCard, !notification.read && styles.unreadCard]}
        onPress={() => markAsRead(notification.id)}
      >
        {image && (
          <Image source={{ uri: image }} style={styles.notificationImage} />
        )}
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>{title}</Text>
          <Text style={styles.notificationDescription}>{description}</Text>
          <Text style={styles.notificationTime}>
            {new Date(notification.created_at).toLocaleDateString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => router.push('/notifications/settings')}
        >
          <Settings size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {notifications.length > 0 ? (
          notifications.map(renderNotification)
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No notifications yet</Text>
            <Text style={styles.emptyStateDescription}>
              You'll see notifications here when someone posts a product or request matching your preferences
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Heebo-Bold',
    color: '#fff',
  },
  settingsButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  notificationCard: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    backgroundColor: '#2a2a2a',
  },
  unreadCard: {
    backgroundColor: '#6C5CE7',
  },
  notificationImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontFamily: 'Heebo-Bold',
    color: '#fff',
  },
  notificationDescription: {
    fontSize: 14,
    fontFamily: 'Heebo-Regular',
    color: '#fff',
  },
  notificationTime: {
    fontSize: 12,
    fontFamily: 'Heebo-Regular',
    color: '#888',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontFamily: 'Heebo-Bold',
    color: '#fff',
  },
  emptyStateDescription: {
    fontSize: 14,
    fontFamily: 'Heebo-Regular',
    color: '#888',
    textAlign: 'center',
    marginHorizontal: 20,
  },
  soldButton: {
    backgroundColor: '#6C5CE7',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 0,
    marginHorizontal: 0,
  },
  soldButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Heebo-Medium',
  },
  dealProductBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#23232b',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#444',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  dealProductImage: {
    width: 54,
    height: 54,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#1a1a1a',
  },
  dealProductTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  dealProductDesc: {
    color: '#aaa',
    fontSize: 13,
    marginBottom: 2,
  },
  dealProductPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  dealProductPriceIcon: {
    fontSize: 16,
    marginRight: 3,
  },
  dealProductPrice: {
    color: '#6C5CE7',
    fontSize: 15,
    fontWeight: 'bold',
  },
});