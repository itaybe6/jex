import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator, Modal, FlatList, Animated, PanResponder } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabaseApi';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const UserDealStoryScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewersModal, setViewersModal] = useState(false);
  const [viewers, setViewers] = useState([]);
  const [loadingViewers, setLoadingViewers] = useState(false);
  const dragAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetch(`${SUPABASE_URL}/rest/v1/deal_of_the_day?user_id=eq.${user.id}&expires_at=gt.${new Date().toISOString()}`)
      .then(res => res.json())
      .then(data => setDeal(data[0] || null))
      .finally(() => setLoading(false));
  }, [user]);

  const fetchViewers = async (dealId) => {
    setLoadingViewers(true);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/deal_views?deal_id=eq.${dealId}&select=user_id,created_at,users(username,avatar_url)&order=created_at.desc`);
    const data = await res.json();
    setViewers(data);
    setLoadingViewers(false);
  };

  // PanResponder ל-swipe up
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 10,
    onPanResponderMove: Animated.event([
      null,
      { dx: dragAnim.x, dy: dragAnim.y }
    ], { useNativeDriver: false }),
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy < -60 && deal) {
        Animated.timing(dragAnim, {
          toValue: { x: 0, y: -height },
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          Animated.spring(dragAnim, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start();
          setViewersModal(true);
          fetchViewers(deal.id);
        });
      } else {
        Animated.spring(dragAnim, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start();
      }
    },
  });

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#0E2657" /></View>;
  }
  if (!deal) {
    return <View style={styles.centered}><Text>No active Deal of the Day</Text></View>;
  }

  let storyElements = [];
  try {
    if (deal.story_data) {
      storyElements = JSON.parse(deal.story_data);
    }
  } catch (e) { storyElements = []; }

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.storyWrapper,
          { transform: [
            { translateX: dragAnim.x },
            { translateY: dragAnim.y }
          ] }
        ]}
        {...panResponder.panHandlers}
      >
        {deal.image_url ? (
          <Image source={{ uri: deal.image_url }} style={styles.fullImage} resizeMode="cover" />
        ) : (
          <View style={[styles.fullImage, { backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' }]}> 
            <Text>No Image</Text>
          </View>
        )}
        <View style={styles.overlayContent}>
          <Text style={styles.price}>{deal.products?.price ? `₪${deal.products.price}` : ''}</Text>
          {deal.message && <Text style={styles.storyMessage}>{deal.message}</Text>}
          {deal.marketing_text && <Text style={styles.storyMessage}>{deal.marketing_text}</Text>}
        </View>
        {Array.isArray(storyElements) && storyElements.map((el) => {
          if (el.type === 'text') {
            return (
              <Text
                key={el.id}
                style={{
                  position: 'absolute',
                  left: el.x,
                  top: el.y,
                  color: el.color || '#fff',
                  fontSize: el.fontSize || 24,
                  transform: [
                    { scale: el.scale || 1 },
                    { rotateZ: `${el.rotation || 0}rad` }
                  ],
                  fontWeight: 'bold',
                  textShadowColor: 'rgba(0,0,0,0.7)',
                  textShadowOffset: { width: 0, height: 2 },
                  textShadowRadius: 4,
                  zIndex: 15,
                }}
              >
                {el.text}
              </Text>
            );
          }
          return null;
        })}
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={32} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
      <Modal visible={viewersModal} transparent animationType="slide" onRequestClose={() => setViewersModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Viewers</Text>
            {loadingViewers ? (
              <ActivityIndicator size="large" color="#0E2657" />
            ) : (
              <FlatList
                data={viewers}
                keyExtractor={item => item.user_id}
                renderItem={({ item }) => (
                  <View style={styles.viewerRow}>
                    <Image source={{ uri: item.users?.avatar_url }} style={styles.avatar} />
                    <Text style={styles.username}>{item.users?.username || item.user_id}</Text>
                    <Text style={styles.timestamp}>{new Date(item.created_at).toLocaleString()}</Text>
                  </View>
                )}
              />
            )}
            <TouchableOpacity onPress={() => setViewersModal(false)} style={styles.closeBtnModal}>
              <Text style={styles.closeBtnText}>Close</Text>
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
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyWrapper: {
    flex: 1,
    width: width,
    height: height,
    zIndex: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  overlayContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 40,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  price: {
    fontSize: 20,
    color: '#6C5CE7',
    marginBottom: 12,
    textAlign: 'center',
  },
  storyMessage: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 8,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  closeBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    padding: 4,
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
    maxHeight: height * 0.7,
  },
  modalTitle: {
    fontSize: 18,
    color: '#0E2657',
    fontWeight: 'bold',
    marginBottom: 18,
    textAlign: 'center',
  },
  viewerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    backgroundColor: '#eee',
  },
  username: {
    fontSize: 16,
    color: '#222',
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
  },
  closeBtnModal: {
    marginTop: 16,
    backgroundColor: '#6C5CE7',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default UserDealStoryScreen; 