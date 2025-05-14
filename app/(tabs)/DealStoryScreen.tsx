import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator, SafeAreaView, Animated, PanResponder } from 'react-native';
import { getDealsByCategory } from '@/lib/supabaseApi';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/hooks/useAuth';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabaseApi';
import { useUnseenDeals } from '@/components/DealOfTheDayIconsRow';
import { router } from 'expo-router';
import { categoryToProductType } from '@/components/DealOfTheDayIconsRow';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const STORY_DURATION = 5000;

type DealProduct = {
  id: string;
  price?: number;
  // add more fields if needed
};

type Deal = {
  id: string;
  image_url?: string;
  message?: string;
  marketing_text?: string;
  products?: DealProduct;
  story_data?: string;
  viewers?: string[];
  // add more fields if needed
};

const ProgressBar = ({ progress }: { progress: number }) => (
  <View style={styles.progressBarBg}>
    <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
  </View>
);

const DealStoryScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const category = (route as any)?.params?.category || (route.params ? (route.params as any).category : undefined);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const { user, accessToken } = useAuth();
  const { refreshUnseenCounts } = useUnseenDeals();
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [slideAnim] = useState(new Animated.Value(0));
  const [mode, setMode] = useState<'unseen' | 'all'>('unseen');
  const [preloading, setPreloading] = useState(false);
  const [pendingCategory, setPendingCategory] = useState<string | null>(null);
  const dragAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  const allCategories = Object.keys(categoryToProductType);

  const fetchUnseenDeals = async (cat: string) => {
    const all = await getDealsByCategory(cat);
    return (all || []).filter((deal: Deal) => user?.id && (!deal.viewers || !deal.viewers.includes(user.id)));
  };
  const fetchAllDeals = async (cat: string) => {
    return await getDealsByCategory(cat) || [];
  };
  const getNextCategoryWithUnseen = async (currentCat: string) => {
    const idx = allCategories.indexOf(currentCat);
    for (let i = idx + 1; i < allCategories.length; i++) {
      const cat = allCategories[i];
      const unseen = await fetchUnseenDeals(categoryToProductType[cat]);
      if (unseen.length > 0) return categoryToProductType[cat];
    }
    return null;
  };
  const hasAnyUnseenDeals = async () => {
    for (let cat of allCategories) {
      const unseen = await fetchUnseenDeals(categoryToProductType[cat]);
      if (unseen.length > 0) return true;
    }
    return false;
  };

  const getNextCategory = (currentCat: string) => {
    const idx = allCategories.indexOf(currentCat);
    if (idx < allCategories.length - 1) {
      return categoryToProductType[allCategories[idx + 1]];
    }
    return null;
  };

  useEffect(() => {
    let isMounted = true;
    if (!category || !user?.id) return;
    setLoading(true);
    setCurrent(0);
    setProgress(0);
    setMode('unseen');
    fetchUnseenDeals(category)
      .then(async (unseen) => {
        console.log('unseen in', category, unseen.length, unseen.map((d: Deal) => d.id));
        if (!isMounted) return;
        if (unseen.length > 0) {
          setDeals(unseen);
          setMode('unseen');
        } else {
          const nextCat = await getNextCategoryWithUnseen(category);
          console.log('nextCat:', nextCat);
          if (nextCat) {
            router.replace({ pathname: '/DealStoryScreen', params: { category: nextCat } });
            return;
          } else {
            const all = await fetchAllDeals(category);
            console.log('all deals in', category, all.length, all.map((d: Deal) => d.id));
            setDeals(all);
            setMode('all');
          }
        }
      })
      .catch((e) => {
        console.log('error loading deals', e);
        setDeals([]);
      })
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, [category, user?.id]);

  const clearStoryTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    if (!deals.length) return;
    setProgress(0);
    clearStoryTimer();
    timerRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 1) {
          clearStoryTimer();
          handleNext();
          return 0;
        }
        return p + 0.02;
      });
    }, STORY_DURATION / 50) as unknown as NodeJS.Timeout;
    return () => {
      clearStoryTimer();
    };
  }, [current, deals]);

  useEffect(() => {
    console.log('current:', current, 'dealId:', deals[current]?.id, 'deals.length:', deals.length);
  }, [current, deals]);

  useEffect(() => {
    const deal = deals[current];
    if (deal && user && deal.id) {
      if (Array.isArray(deal.viewers) && deal.viewers.includes(user.id)) return;
      const newViewers = Array.isArray(deal.viewers)
        ? [...deal.viewers, user.id]
        : [user.id];
      fetch(`${SUPABASE_URL}/rest/v1/deal_of_the_day?id=eq.${deal.id}`, {
        method: 'PATCH',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          viewers: newViewers
        }),
      }).then(() => {
        if (typeof refreshUnseenCounts === 'function') {
          setTimeout(() => refreshUnseenCounts(), 300);
        }
      });
    }
  }, [current, deals, user, accessToken, refreshUnseenCounts]);

  const handleNext = async () => {
    if (current < deals.length - 1) {
      setCurrent(current + 1);
      return false;
    }
    if (mode === 'unseen') {
      const nextCat = await getNextCategoryWithUnseen(category);
      if (nextCat) {
        router.replace({ pathname: '/DealStoryScreen', params: { category: nextCat } });
        return true;
      } else {
        const all = await fetchAllDeals(category);
        setDeals(all);
        setMode('all');
        setCurrent(0);
        setProgress(0);
        return false;
      }
    } else {
      router.push('/');
      return false;
    }
  };

  const handleStoryPress = async () => {
    clearStoryTimer();
    if (current < deals.length - 1) {
      setCurrent(current + 1);
      setProgress(0);
      return;
    }
    const nextCat = await getNextCategoryWithUnseen(category);
    if (nextCat) {
      setPreloading(true);
      setPendingCategory(nextCat);
      await fetchUnseenDeals(nextCat);
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        slideAnim.setValue(0);
        setProgress(0);
        setPreloading(false);
        setPendingCategory(null);
        router.replace({ pathname: '/DealStoryScreen', params: { category: nextCat } });
      });
      return;
    }
    Animated.timing(slideAnim, {
      toValue: -width,
      duration: 300,
      useNativeDriver: true,
    }).start(async () => {
      slideAnim.setValue(0);
      setProgress(0);
      await handleNext();
    });
  };

  const getPrevCategory = (currentCat: string) => {
    const idx = allCategories.indexOf(currentCat);
    if (idx > 0) {
      return categoryToProductType[allCategories[idx - 1]];
    }
    return null;
  };

  const handleNextCategory = async () => {
    const nextCat = getNextCategory(category);
    if (nextCat) {
      setPreloading(true);
      await fetchUnseenDeals(nextCat);
      setPreloading(false);
      router.replace({ pathname: '/DealStoryScreen', params: { category: nextCat } });
    }
  };

  const handlePrevCategory = async () => {
    const prevCat = getPrevCategory(category);
    if (prevCat) {
      setPreloading(true);
      await fetchUnseenDeals(prevCat);
      setPreloading(false);
      router.replace({ pathname: '/DealStoryScreen', params: { category: prevCat } });
    }
  };

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) =>
      Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10,
    onPanResponderMove: Animated.event(
      [null, { dx: dragAnim.x, dy: dragAnim.y }],
      { useNativeDriver: false }
    ),
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > 60) {
        Animated.timing(dragAnim, {
          toValue: { x: 0, y: height },
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          Animated.spring(dragAnim, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }).start();
          navigation.goBack();
        });
      } else if (gestureState.dx < -60) {
        Animated.timing(dragAnim, {
          toValue: { x: -width, y: 0 },
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          Animated.spring(dragAnim, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }).start();
          handleNextCategory();
        });
      } else if (gestureState.dx > 60) {
        Animated.timing(dragAnim, {
          toValue: { x: width, y: 0 },
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          Animated.spring(dragAnim, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }).start();
          handlePrevCategory();
        });
      } else {
        Animated.spring(dragAnim, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: true,
        }).start();
      }
    },
  });

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#0E2657" /></View>;
  }

  if (!deals.length) {
    return (
      <View style={styles.centered}>
        <Text>אין דילים להצגה בקטגוריה זו</Text>
        <TouchableOpacity onPress={() => router.push('/')}> 
          <Text style={{ color: '#0E2657', marginTop: 20 }}>חזור לדף הבית</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const deal: Deal = deals[current] || {} as Deal;
  let storyElements: any[] = [];
  try {
    if (deal.story_data) {
      storyElements = JSON.parse(deal.story_data);
    }
  } catch (e) {
    storyElements = [];
  }

  return (
    <SafeAreaView style={styles.container}>
      {deal.products?.id && (
        <TouchableOpacity
          style={styles.productButton}
          onPress={() => router.push(`/products/${deal.products?.id}`)}
          activeOpacity={0.8}
        >
          <View style={styles.productButtonCircle}>
            <Ionicons name="pricetag-outline" size={22} color="#0E2657" />
          </View>
          <Text style={styles.productButtonText}>לצפייה במוצר</Text>
        </TouchableOpacity>
      )}
      <View style={styles.progressRow}>
        {deals.map((_, idx) => (
          <ProgressBar key={idx} progress={idx < current ? 1 : idx === current ? progress : 0} />
        ))}
      </View>
      <TouchableOpacity style={[styles.leftZone, { pointerEvents: 'box-none' }]} onPress={() => { if (current > 0) setCurrent(current - 1); }} />
      <TouchableOpacity style={[styles.rightZone, { pointerEvents: 'box-none' }]} onPress={handleStoryPress} />
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
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.7)"]}
          style={styles.gradientOverlay}
        />
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
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    position: 'relative',
  },
  storyWrapper: {
    flex: 1,
    zIndex: 5,
  },
  progressRow: {
    flexDirection: 'row',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    padding: 12,
    gap: 4,
  },
  progressBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 4,
    backgroundColor: '#0E2657',
    borderRadius: 2,
  },
  leftZone: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: width / 2,
    zIndex: 20,
  },
  rightZone: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: width / 2,
    zIndex: 20,
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
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: height * 0.35,
  },
  overlayContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 40,
    alignItems: 'center',
    paddingHorizontal: 24,
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
  price: {
    fontSize: 20,
    color: '#6C5CE7',
    marginBottom: 12,
    textAlign: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productButton: {
    position: 'absolute',
    top: 18,
    right: 18,
    zIndex: 30,
    alignItems: 'center',
  },
  productButtonCircle: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  productButtonText: {
    fontSize: 12,
    color: '#0E2657',
    marginTop: 2,
    fontWeight: '500',
  },
});

export default DealStoryScreen; 