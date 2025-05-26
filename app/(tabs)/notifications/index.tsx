import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, ActivityIndicator, Alert, Modal, Pressable } from 'react-native';
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

type DealModalProps = {
  visible: boolean;
  onClose: () => void;
  notification: Notification | null;
  onApprove: () => void;
  onReject: () => void;
  isLoading: boolean;
};

const DealModal = ({ visible, onClose, notification, onApprove, onReject, isLoading }: DealModalProps) => {
  if (!notification) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Deal Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.productDetails}>
            {notification.data?.product_image_url && (
              <Image
                source={{ uri: notification.data.product_image_url }}
                style={styles.modalProductImage}
              />
            )}
            <Text style={styles.modalMessage}>Do you want to approve or reject this deal?</Text>
            <Text style={styles.sellerName}>Seller: {notification.data?.seller_name}</Text>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={onReject}
              disabled={isLoading}
            >
              <Text style={styles.actionButtonText}>Reject Deal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={onApprove}
              disabled={isLoading}
            >
              <Text style={styles.actionButtonText}>Approve Deal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Add this helper to fetch a profile by user id
async function fetchProfile(userId: string, accessToken: string) {
  const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=full_name,avatar_url`;
  const res = await fetch(url, {
    headers: {
      apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
    },
  });
  const data = await res.json();
  return Array.isArray(data) && data.length > 0 ? data[0] : {};
}

export default function NotificationsScreen() {
  const { user, accessToken } = useAuth();
  const supabaseFetch = useSupabaseFetch(accessToken || undefined);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionDone, setActionDone] = useState<{ [id: string]: boolean }>({});
  const [selectedDeal, setSelectedDeal] = useState<Notification | null>(null);
  const [isDealModalVisible, setIsDealModalVisible] = useState(false);
  const [selectedHoldRequest, setSelectedHoldRequest] = useState<Notification | null>(null);
  const [isHoldModalVisible, setIsHoldModalVisible] = useState(false);
  const [selectedApprovedHold, setSelectedApprovedHold] = useState<Notification | null>(null);
  const [isApprovedHoldModalVisible, setIsApprovedHoldModalVisible] = useState(false);
  const profileImagePressedRef = React.useRef(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      registerForPushNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await supabaseFetch(`/rest/v1/notifications?user_id=eq.${user?.id}&select=*&order=created_at.desc`);
      if (!res.ok) {
        const err = await res.text();
        Alert.alert('Error', 'Failed to load notifications. Please try again later.');
        return;
      }
      const data = await res.json();
      setNotifications(data || []);
    } catch (error) {
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
          Alert.alert('Error', 'Failed to save push notification settings. Please try again later.');
        }
      }
    } catch (error) {
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
    setActionLoading(notification.id);
    setActionError(null);
    try {
      const { transaction_id, product_id, seller_id, buyer_id } = notification.data;
      // Update transaction status
      const newStatus = approve ? 'completed' : 'rejected';
      const response = await supabaseFetch(`/rest/v1/transactions?id=eq.${transaction_id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      await response.text();

      if (approve) {
        // Ensure we have product_id
        let product_id = notification.data?.product_id;
        if (!product_id && transaction_id) {
          try {
            const txRes = await supabaseFetch(`/rest/v1/transactions?id=eq.${transaction_id}&select=product_id`);
            const txArr = await txRes.json();
            product_id = txArr[0]?.product_id;
          } catch (e) {
            console.error('Failed to fetch product_id from transaction:', e);
          }
        }
        // Update product status to not_available
        if (product_id) {
          await supabaseFetch(`/rest/v1/products?id=eq.${product_id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'not_available' }),
          });
        }
        // Fetch buyer profile
        const buyerProfile = await fetchProfile(user?.id, accessToken);
        // Send notification to seller
        await supabaseFetch(`/rest/v1/notifications`, {
          method: 'POST',
          body: JSON.stringify({
            user_id: seller_id,
            type: approve ? 'deal_completed' : 'deal_rejected',
            product_id: product_id,
            data: {
              message: approve ? `The buyer has approved the deal for product "${notification.data?.product_title}"` : `The buyer has rejected the deal for product "${notification.data?.product_title}"`,
              buyer_id: user?.id,
              buyer_name: buyerProfile.full_name || '',
              buyer_avatar_url: buyerProfile.avatar_url || '',
              product_title: notification.data?.product_title,
              product_image_url: notification.data?.product_image_url,
              transaction_id,
            },
            read: false,
          }),
        });
      }
      // Update current notification: set type and message so user can't act again
      await supabaseFetch(`/rest/v1/notifications?id=eq.${notification.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          is_action_done: true,
          type: approve ? 'transaction_offer_approved' : 'transaction_offer_rejected',
          data: {
            ...notification.data,
            message: approve
              ? `You approved the deal with ${notification.data?.seller_name || ''}`
              : `You rejected the deal with ${notification.data?.seller_name || ''}`,
          },
        }),
      });
      // Close modal and refresh notifications
      setIsDealModalVisible(false);
      setSelectedDeal(null);
      fetchNotifications();
      // Show success message
      Alert.alert(
        approve ? 'Deal Approved' : 'Deal Rejected',
        approve ? 'The deal has been completed successfully.' : 'The deal has been rejected.'
      );
    } catch (err: any) {
      setActionError(err.message || 'Failed to update deal');
      Alert.alert('Error', 'Failed to update the deal. Please try again.');
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
      // Trigger badge refresh in TopHeader (only on web)
      if (typeof window !== 'undefined' && typeof Event !== 'undefined') {
        window.dispatchEvent(new Event('refresh-unread-badge'));
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      markAllAsRead();
    }, [user])
  );


  const handleApproveHold = async () => {
    if (!selectedHoldRequest) return;
    try {
      // 1. עדכן hold_requests ל-approved
      await supabaseFetch(`/rest/v1/hold_requests?id=eq.${selectedHoldRequest.data.hold_request_id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'approved' }),
      });
      // 2. עדכן products ל-hold
      await supabaseFetch(`/rest/v1/products?id=eq.${selectedHoldRequest.product_id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'hold' }),
      });
      // 3. שלוף את פרטי המוכר
      let sellerProfile = { full_name: '', avatar_url: '' };
      try {
        const profileRes = await supabaseFetch(`/rest/v1/profiles?id=eq.${user.id}&select=full_name,avatar_url`);
        const profileArr = await profileRes.json();
        if (profileArr && profileArr[0]) {
          sellerProfile = {
            full_name: profileArr[0].full_name || '',
            avatar_url: profileArr[0].avatar_url || '',
          };
        }
      } catch (e) {}
      // 4. שלוף את end_time מה-hold_request
      let end_time = null;
      try {
        const holdRequestRes = await supabaseFetch(`/rest/v1/hold_requests?id=eq.${selectedHoldRequest.data.hold_request_id}`);
        const holdArr = await holdRequestRes.json();
        console.log('HOLD REQUEST ARRAY:', holdArr);
        if (holdArr && holdArr[0]) {
          console.log('HOLD REQUEST OBJECT:', holdArr[0]);
          end_time = holdArr[0].end_time;
        } else {
          console.log('NO HOLD REQUEST FOUND FOR:', selectedHoldRequest.data.hold_request_id);
        }
      } catch (e) {}
      // 5. שלח התראה ל-buyer עם פרטי המוכר ו-end_time
      console.log('SENDING END TIME TO BUYER:', end_time);
      await supabaseFetch(`/rest/v1/notifications`, {
        method: 'POST',
        body: JSON.stringify({
          user_id: selectedHoldRequest.data.buyer_id,
          type: 'hold_request_approved',
          product_id: selectedHoldRequest.product_id,
          data: {
            buyer_id: selectedHoldRequest.data.buyer_id,
            message: `Your hold request for "${selectedHoldRequest.data.product_title}" was approved.`,
            product_title: selectedHoldRequest.data.product_title,
            product_image_url: selectedHoldRequest.data.product_image_url,
            seller_name: sellerProfile.full_name,
            seller_avatar_url: sellerProfile.avatar_url,
            end_time: end_time,
          },
          read: false,
        }),
      });
      // 6. עדכן את ההתראה הנוכחית בשרת
      await supabaseFetch(`/rest/v1/notifications?id=eq.${selectedHoldRequest.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          is_action_done: true,
          data: {
            ...selectedHoldRequest.data,
            message: 'Hold request approved'
          }
        }),
      });
      setIsHoldModalVisible(false);
      setSelectedHoldRequest(null);
      fetchNotifications();
    } catch (error) {
      Alert.alert('Error', 'Failed to approve hold request.');
    }
  };

  const handleRejectHold = async () => {
    if (!selectedHoldRequest) return;
    try {
      // 1. עדכן hold_requests ל-rejected
      await supabaseFetch(`/rest/v1/hold_requests?id=eq.${selectedHoldRequest.data.hold_request_id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'rejected' }),
      });
      // 2. שלוף את פרטי המוכר
      let sellerProfile = { full_name: '', avatar_url: '' };
      try {
        const profileRes = await supabaseFetch(`/rest/v1/profiles?id=eq.${user.id}&select=full_name,avatar_url`);
        const profileArr = await profileRes.json();
        if (profileArr && profileArr[0]) {
          sellerProfile = {
            full_name: profileArr[0].full_name || '',
            avatar_url: profileArr[0].avatar_url || '',
          };
        }
      } catch (e) {}
      // 3. שלח התראה ל-buyer עם פרטי המוכר
      await supabaseFetch(`/rest/v1/notifications`, {
        method: 'POST',
        body: JSON.stringify({
          user_id: selectedHoldRequest.data.buyer_id,
          type: 'hold_request_rejected',
          product_id: selectedHoldRequest.product_id,
          data: {
            buyer_id: selectedHoldRequest.data.buyer_id,
            message: `Your hold request for "${selectedHoldRequest.data.product_title}" was rejected.`,
            product_title: selectedHoldRequest.data.product_title,
            product_image_url: selectedHoldRequest.data.product_image_url,
            seller_name: sellerProfile.full_name,
            seller_avatar_url: sellerProfile.avatar_url,
          },
          read: false,
        }),
      });
      // 4. עדכן את ההתראה הנוכחית בשרת
      await supabaseFetch(`/rest/v1/notifications?id=eq.${selectedHoldRequest.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          is_action_done: true,
          data: {
            ...selectedHoldRequest.data,
            message: 'Hold request rejected'
          }
        }),
      });
      setIsHoldModalVisible(false);
      setSelectedHoldRequest(null);
      fetchNotifications();
    } catch (error) {
      Alert.alert('Error', 'Failed to reject hold request.');
    }
  };

  const renderNotification = ({ item: notification }: { item: Notification }) => {
    
    const isBuyerNotification = notification.type === 'deal_completed' || notification.type === 'deal_rejected';
    const isHoldApproved = notification.type === 'hold_request_approved' || notification.type === 'hold_request_rejected';
    const isHandled =
      notification.type === 'transaction_offer_approved' ||
      notification.type === 'transaction_offer_rejected' ||
      notification.is_action_done;
    const formattedDate = new Date(notification.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // לוגיקה להצגת תמונה ושם בהתראות הולד
    let profileImage = '';
    let userName = '';
    if (isHoldApproved) {
      userName = notification.data?.buyer_name || notification.data?.seller_name || 'Unknown User';
      profileImage = notification.data?.buyer_avatar_url || notification.data?.seller_avatar_url ||
        'https://ui-avatars.com/api/?background=0E2657&color=fff&name=' + encodeURIComponent(userName);
    } else if (notification.type === 'hold_request') {
      userName = notification.data?.buyer_name || 'Unknown User';
      profileImage = notification.data?.buyer_avatar_url ||
        'https://ui-avatars.com/api/?background=0E2657&color=fff&name=' + encodeURIComponent(userName);
    } else if (isBuyerNotification) {
      userName = notification.data?.buyer_name || 'Unknown User';
      profileImage = notification.data?.buyer_avatar_url ||
        'https://ui-avatars.com/api/?background=0E2657&color=fff&name=' + encodeURIComponent(userName);
    } else {
      userName = notification.data?.seller_name || notification.data?.sender_full_name || 'Unknown User';
      profileImage = notification.data?.seller_avatar_url || notification.data?.sender_avatar_url ||
        'https://ui-avatars.com/api/?background=0E2657&color=fff&name=' + encodeURIComponent(userName);
    }

    const senderId =
      isHoldApproved
        ? notification.data?.buyer_id || notification.data?.seller_id || null
        : notification.data?.seller_id ||
          notification.data?.buyer_id ||
          notification.data?.sender_id ||
          null;

    return (
      <View style={styles.notificationWrapper} pointerEvents="box-none">
        <TouchableOpacity
          onPress={() => {
            console.log('PROFILE IMAGE PRESSED', senderId);
            if (senderId) {
              router.push(`/user/${senderId}`);
            }
          }}
          style={{ position: 'absolute', top: 0, left: 0, zIndex: 10 }}
          disabled={!senderId}
        >
          <Image
            source={{ uri: profileImage }}
            style={styles.profileImageFloating}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.notificationCard,
            !notification.read && styles.unreadCard
          ]}
          onPress={() => {
            markAsRead(notification.id);
            if (notification.type === 'hold_request' && !notification.is_action_done) {
              setSelectedHoldRequest(notification);
              setIsHoldModalVisible(true);
            } else if (notification.type === 'hold_request_approved') {
              setSelectedApprovedHold(notification);
              setIsApprovedHoldModalVisible(true);
            } else if (notification.type === 'transaction_offer' && !isHandled) {
              setSelectedDeal(notification);
              setIsDealModalVisible(true);
            } else if (notification.product_id) {
              router.push(`/products/${notification.product_id}`);
            }
          }}
          activeOpacity={0.7}
          disabled={isHandled || (notification.type === 'hold_request' && notification.is_action_done)}
        >
          <View style={styles.row}>
            <View style={styles.textContainer}>
              {notification.type === 'hold_request_approved' ? (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                    <Ionicons name="checkmark-circle" size={18} color="green" style={{ marginRight: 4, marginBottom: -2 }} />
                    <Text style={[styles.statusText, { fontSize: 16, color: '#0E2657', fontWeight: 'bold' }]}>Approved</Text>
                  </View>
                  <Text style={styles.userName}>{userName}</Text>
                </>
              ) : (
                <>
                  <Text style={styles.statusText}>
                    {notification.type === 'waiting_seller_approval' ? 'Waiting Seller Approval'
                      : notification.type === 'deal_completed' ? 'Deal Completed'
                      : 'New Notification'}
                  </Text>
                  <Text style={styles.userName}>{userName}</Text>
                </>
              )}
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
        contentContainerStyle={[styles.listContainer, { marginTop: 24 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        }
      />
      
      <DealModal
        visible={isDealModalVisible}
        onClose={() => {
          setIsDealModalVisible(false);
          setSelectedDeal(null);
        }}
        notification={selectedDeal}
        onApprove={() => selectedDeal && handleDealAction(selectedDeal, true)}
        onReject={() => selectedDeal && handleDealAction(selectedDeal, false)}
        isLoading={actionLoading === selectedDeal?.id}
      />

      {/* Hold Request Modal */}
      <Modal
        visible={isHoldModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsHoldModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.modalTitle}>Hold Request</Text>
              <TouchableOpacity onPress={() => setIsHoldModalVisible(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={24} color="#0E2657" />
              </TouchableOpacity>
            </View>
            <Text style={{ marginVertical: 12, fontSize: 16, textAlign: 'center' }}>
              {selectedHoldRequest?.data?.buyer_name
                ? `${selectedHoldRequest.data.buyer_name} requests hold for ${selectedHoldRequest.data?.message?.replace('Request Hold ', '').replace(' Hours', '')} hours`
                : 'Approve hold request for product:'}
            </Text>
            <Text style={{ fontWeight: 'bold', fontSize: 18, textAlign: 'center' }}>{selectedHoldRequest?.data?.product_title}</Text>
            {selectedHoldRequest?.data?.product_image_url && (
              <Image
                source={{ uri: selectedHoldRequest.data.product_image_url }}
                style={{ width: 120, height: 120, borderRadius: 12, alignSelf: 'center', marginVertical: 16 }}
              />
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 }}>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={handleRejectHold}
              >
                <Text style={styles.actionButtonText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.approveButton]}
                onPress={handleApproveHold}
              >
                <Text style={styles.actionButtonText}>Approve</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Hold Approved Modal */}
      <Modal
        visible={isApprovedHoldModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsApprovedHoldModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.modalTitle}>Hold Approved</Text>
              <TouchableOpacity onPress={() => setIsApprovedHoldModalVisible(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={24} color="#0E2657" />
              </TouchableOpacity>
            </View>
            <Text style={{ marginVertical: 12, fontSize: 16, textAlign: 'center' }}>
              {selectedApprovedHold?.data?.product_title}
            </Text>
            {selectedApprovedHold?.data?.product_image_url && (
              <Image
                source={{ uri: selectedApprovedHold.data.product_image_url }}
                style={{ width: 120, height: 120, borderRadius: 12, alignSelf: 'center', marginVertical: 16 }}
              />
            )}
            {selectedApprovedHold?.data?.seller_avatar_url && (
              <Image
                source={{ uri: selectedApprovedHold.data.seller_avatar_url }}
                style={{ width: 48, height: 48, borderRadius: 24, alignSelf: 'center', marginBottom: 8 }}
              />
            )}
            <Text style={{ fontSize: 15, textAlign: 'center', marginBottom: 8 }}>
              Approved by: {selectedApprovedHold?.data?.seller_name || 'Unknown'}
            </Text>
            <Text style={{ fontSize: 16, textAlign: 'center', marginBottom: 8 }}>
              <Ionicons name="time-outline" size={16} color="#0E2657" /> Hold ends at{' '}
              {selectedApprovedHold?.data?.end_time
                ? new Date(selectedApprovedHold.data.end_time).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Unknown'}
            </Text>
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton, { marginTop: 16 }]}
              onPress={() => setIsApprovedHoldModalVisible(false)}
            >
              <Text style={styles.actionButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingTop: 12,
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
    marginTop: 24,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Montserrat-Bold',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  productDetails: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalProductImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  modalMessage: {
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  sellerName: {
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
    color: '#6B7280',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#0E2657',
  },
  rejectButton: {
    backgroundColor: '#DC2626',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
  },
});