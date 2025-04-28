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
};

export default function NotificationsScreen() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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
    setActionLoading(notification.id);
    setActionError(null);
    try {
      const { transaction_id, product_title, seller_id, product_id } = notification.data;
      const { error: txError } = await supabase
        .from('transactions')
        .update({ status: approve ? 'approved' : 'rejected' })
        .eq('id', transaction_id);
      if (txError) throw txError;
      if (approve && product_id) {
        if (user?.id === seller_id) {
          const { data: productData, error: productError } = await supabase
            .from('products')
            .select('*')
            .eq('id', product_id)
            .single();
          if (productError) throw productError;
          const { error: transactionError } = await supabase
            .from('transactions')
            .insert({
              product_id: product_id,
              seller_id: seller_id,
              buyer_id: user?.id,
              price: productData?.price || 0,
              status: 'approved',
              created_at: new Date().toISOString(),
            });
          if (transactionError) throw transactionError;
          const { data: deleted, error: deleteError } = await supabase
            .from('products')
            .delete()
            .eq('id', product_id);
          if (deleteError) {
            throw deleteError;
          }
        } else {
          const { data: productData, error: productError } = await supabase
            .from('products')
            .select('*')
            .eq('id', product_id)
            .single();
          if (productError) throw productError;
          const { error: transactionError } = await supabase
            .from('transactions')
            .insert({
              product_id: product_id,
              seller_id: seller_id,
              buyer_id: user?.id,
              price: productData?.price || 0,
              status: 'approved',
              created_at: new Date().toISOString(),
            });
          if (transactionError) throw transactionError;
        }
      }
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: seller_id,
          type: 'deal_' + (approve ? 'approved' : 'rejected'),
          data: {
            transaction_id,
            product_title,
            buyer_id: user?.id,
            product_id,
            sender_id: user?.id,
            sender_name: user?.user_metadata?.full_name || user?.email || 'User',
            sender_avatar: user?.user_metadata?.avatar_url || null,
            message: approve
              ? 'The deal was approved successfully.'
              : 'The deal was rejected.',
          },
          read: false,
        });
      if (notifError) throw notifError;
      await markAsRead(notification.id);
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
      Alert.alert(
        approve ? 'Deal Approved' : 'Deal Rejected',
        approve ? 'You have approved the deal.' : 'You have rejected the deal.'
      );
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
            <Text style={[styles.notificationDescription, {marginTop: 8}]}>{description}</Text>
            <Text style={styles.notificationTime}>{new Date(notification.created_at).toLocaleDateString()}</Text>
            {actionError && actionLoading === notification.id && (
              <Text style={{ color: 'red', marginVertical: 4 }}>{actionError}</Text>
            )}
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