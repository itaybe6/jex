import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator, SafeAreaView, Animated, PanResponder, TouchableWithoutFeedback } from 'react-native';
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
import { useDeals } from '../context/DealsContext';

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
  const [nextDealsCache, setNextDealsCache] = useState<Deal[] | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);

  const allCategories = Object.keys(categoryToProductType);

  const { allDeals, loading: contextLoading } = useDeals();

  // Add cubeAnim for 3D cube effect
  const cubeAnim = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    setImageLoaded(false);
  }, [current]);

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
      await new Promise((resolve) =>
        Animated.timing(dragAnim.x, {
          toValue: -width,
          duration: 250,
          useNativeDriver: true,
        }).start(() => {
          dragAnim.setValue({ x: 0, y: 0 });
          resolve(null);
        })
      );
      router.replace({ pathname: '/DealStoryScreen', params: { category: nextCat } });
    }
  };

  const handlePrevCategory = async () => {
    const prevCat = getPrevCategory(category);
    if (prevCat) {
      await new Promise((resolve) =>
        Animated.timing(dragAnim.x, {
          toValue: width,
          duration: 250,
          useNativeDriver: true,
        }).start(() => {
          dragAnim.setValue({ x: 0, y: 0 });
          resolve(null);
        })
      );
      router.replace({ pathname: '/DealStoryScreen', params: { category: prevCat } });
    }
  };

  const resetPosition = () => {
    Animated.spring(dragAnim, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: true,
    }).start();
  };

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) =>
      Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10,
    onPanResponderMove: (_, gestureState) => {
      dragAnim.setValue({ x: gestureState.dx, y: gestureState.dy });
      // Update cubeAnim for 3D effect (only for horizontal swipe)
      cubeAnim.setValue(gestureState.dx / width);
    },
    onPanResponderRelease: (_, gestureState) => {
      const { dx, dy } = gestureState;
      if (dy > 60 || dy < -60) {
        Animated.timing(dragAnim, {
          toValue: { x: 0, y: dy > 0 ? height : -height },
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          navigation.goBack();
        });
        return;
      }
      if (dx < -20) {
        // גרירה שמאלה → קטגוריה הבאה
        Animated.timing(cubeAnim, {
          toValue: -1,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          if (currentCategoryIndex < categoryKeys.length - 1) {
            const nextDeals = allDeals[categoryKeys[currentCategoryIndex + 1]] || [];
            if (nextDeals.length > 0) {
              setCurrentCategoryIndex(currentCategoryIndex + 1);
              setCurrentStoryIndex(0);
            } else {
              navigation.goBack();
            }
          }
          dragAnim.setValue({ x: 0, y: 0 });
          cubeAnim.setValue(0);
        });
      } else if (dx > 20) {
        // גרירה ימינה → קטגוריה קודמת
        Animated.timing(cubeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          if (currentCategoryIndex > 0) {
            const prevCategory = categoryKeys[currentCategoryIndex - 1];
            const prevDeals = allDeals[prevCategory] || [];
            if (prevDeals.length > 0) {
              setCurrentCategoryIndex(currentCategoryIndex - 1);
              setCurrentStoryIndex(0);
            }
          }
          dragAnim.setValue({ x: 0, y: 0 });
          cubeAnim.setValue(0);
        });
      } else {
        Animated.parallel([
          Animated.spring(dragAnim, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }),
          Animated.spring(cubeAnim, {
            toValue: 0,
            useNativeDriver: true,
          })
        ]).start();
      }
    },
  });

  const restartStoryTimer = () => {
    clearStoryTimer();
    setProgress(0);
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
  };

  // Add drag effect for both x and y
  const dragDistance = Animated.add(
    dragAnim.x.interpolate({ inputRange: [-width, width], outputRange: [-1, 1], extrapolate: 'clamp' }),
    dragAnim.y.interpolate({ inputRange: [-height, height], outputRange: [-1, 1], extrapolate: 'clamp' })
  );
  const dragOpacity = dragDistance.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [0.7, 1, 0.7],
    extrapolate: 'clamp',
  });
  const dragScale = dragDistance.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [0.96, 1, 0.96],
    extrapolate: 'clamp',
  });

  // Get current category and deal
  const categoryKeys = Object.keys(allDeals);
  const currentCategory = categoryKeys[currentCategoryIndex];
  const currentDeals = allDeals[currentCategory] || [];
  const currentDeal = currentDeals[currentStoryIndex];

  // Update timer to use currentCategoryIndex and currentStoryIndex
  useEffect(() => {
    if (!currentDeals.length) return;
    setProgress(0);
    clearStoryTimer();
    timerRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 1) {
          clearStoryTimer();
          // Move to next story or category
          if (currentStoryIndex < currentDeals.length - 1) {
            setCurrentStoryIndex(currentStoryIndex + 1);
          } else if (currentCategoryIndex < categoryKeys.length - 1) {
            setCurrentCategoryIndex(currentCategoryIndex + 1);
            setCurrentStoryIndex(0);
          } else {
            // End of all stories
            navigation.goBack();
          }
          return 0;
        }
        return p + 0.02;
      });
    }, STORY_DURATION / 50) as unknown as NodeJS.Timeout;
    return () => {
      clearStoryTimer();
    };
  }, [currentCategoryIndex, currentStoryIndex, currentDeals.length]);

  // After allDeals and category are available, set currentCategoryIndex to match the route param
  useEffect(() => {
    if (!category) return;
    const idx = Object.keys(categoryToProductType).findIndex(
      key => categoryToProductType[key] === category
    );
    if (idx >= 0) setCurrentCategoryIndex(idx);
  }, [category, Object.keys(allDeals).length]);

  // Defensive: clamp currentStoryIndex if out of bounds
  useEffect(() => {
    if (!currentDeals.length) return;
    if (currentStoryIndex >= currentDeals.length) {
      setCurrentStoryIndex(0);
    }
  }, [currentCategoryIndex, currentDeals.length]);

  // Helper: find next category with unseen stories
  const getNextCategoryWithUnseenIndex = () => {
    const userId = user?.id || '';
    for (let i = currentCategoryIndex + 1; i < categoryKeys.length; i++) {
      const deals = allDeals[categoryKeys[i]] || [];
      // Unseen = לא נצפה ע"י המשתמש
      if (deals.some(deal => !deal.viewers || !deal.viewers.includes(userId))) {
        return i;
      }
    }
    return null;
  };

  const handleRightTap = () => {
    clearStoryTimer();
    if (currentStoryIndex < currentDeals.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
      setProgress(0);
      restartStoryTimer();
    } else {
      // סיים את כל הסטוריז בקטגוריה הנוכחית – עבור לקטגוריה הבאה עם unseen
      const nextUnseenIdx = getNextCategoryWithUnseenIndex();
      if (nextUnseenIdx !== null) {
        const nextDeals = allDeals[categoryKeys[nextUnseenIdx]] || [];
        if (nextDeals.length > 0) {
          setCurrentCategoryIndex(nextUnseenIdx);
          setCurrentStoryIndex(0);
          setProgress(0);
          restartStoryTimer();
        } else {
          navigation.goBack();
        }
      } else {
        // אין יותר unseen – פשוט תישאר
        setCurrentStoryIndex(currentDeals.length - 1);
        setProgress(0);
        restartStoryTimer();
      }
    }
  };

  const handleLeftTap = () => {
    clearStoryTimer();
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
      setProgress(0);
      restartStoryTimer();
    } else {
      // סטורי ראשון – לא זז אחורה
      setCurrentStoryIndex(0);
      setProgress(0);
      restartStoryTimer();
    }
  };

  // Loading state
  if (!Object.keys(allDeals).length) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#0E2657" /></View>;
  }
  if (!currentDeals.length) {
    return (
      <View style={styles.centered}>
        <Text>אין דילים להצגה בקטגוריה זו</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}> 
          <Text style={{ color: '#0E2657', marginTop: 20 }}>חזור</Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (!currentDeal) {
    return null;
  }

  let storyElements: any[] = [];
  try {
    if (currentDeal.story_data) {
      storyElements = JSON.parse(currentDeal.story_data);
    }
  } catch (e) {
    storyElements = [];
  }

  // In the render, update the Animated.View style for 3D cube effect:
  const rotateY = cubeAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-60deg', '0deg', '60deg'],
  });
  const translateX = cubeAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [-width, 0, width],
  });

  return (
    <Animated.View
      style={[
        styles.fullScreenWrapper,
        {
          transform: [
            { perspective: 1000 },
            { rotateY },
            { translateX },
            { translateY: dragAnim.y },
            { scale: dragScale },
          ],
          opacity: dragOpacity,
        }
      ]}
      {...panResponder.panHandlers}
    >
    <SafeAreaView style={styles.container}>
        {currentDeal && currentDeal.products && currentDeal.products.id && (
        <TouchableOpacity
          style={styles.productButton}
            onPress={() => router.push(`/products/${currentDeal.products?.id}`)}
          activeOpacity={0.8}
        >
          <View style={styles.productButtonCircle}>
            <Ionicons name="pricetag-outline" size={22} color="#0E2657" />
          </View>
          <Text style={styles.productButtonText}>לצפייה במוצר</Text>
        </TouchableOpacity>
      )}
      <View style={styles.progressRow}>
          {currentDeals.map((_, idx) => (
            <ProgressBar key={idx} progress={idx < currentStoryIndex ? 1 : idx === currentStoryIndex ? progress : 0} />
        ))}
      </View>
        <TouchableOpacity
          style={styles.leftZone}
          onPress={handleLeftTap}
        />
        <TouchableOpacity
          style={styles.rightZone}
          onPress={handleRightTap}
        />
        <TouchableWithoutFeedback onLongPress={clearStoryTimer} onPressOut={restartStoryTimer} delayLongPress={200}>
          <View style={styles.storyWrapper}>
            {currentDeal?.image_url ? (
              <Animated.Image
                source={{ uri: currentDeal.image_url }}
                style={[styles.fullImage, { opacity: imageLoaded ? 1 : 0 }]}
                resizeMode="cover"
                onLoadEnd={() => setImageLoaded(true)}
              />
        ) : (
              <View style={[styles.fullImage, { backgroundColor: '#eee' }]} />
        )}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.7)"]}
          style={styles.gradientOverlay}
        />
        <View style={styles.overlayContent}>
              <Text style={styles.price}>{currentDeal?.products?.price ? `₪${currentDeal.products.price}` : ''}</Text>
              {currentDeal?.message && <Text style={styles.storyMessage}>{currentDeal.message}</Text>}
              {currentDeal?.marketing_text && <Text style={styles.storyMessage}>{currentDeal.marketing_text}</Text>}
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
          </View>
        </TouchableWithoutFeedback>
      </SafeAreaView>
      </Animated.View>
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
    width: width / 3,
    zIndex: 10,
  },
  rightZone: {
    position: 'absolute',
    left: width / 3,
    top: 0,
    bottom: 0,
    width: (width * 2) / 3,
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
  fullScreenWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
  },
});

export default DealStoryScreen; 