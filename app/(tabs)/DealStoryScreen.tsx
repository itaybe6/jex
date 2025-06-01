import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, TouchableWithoutFeedback } from 'react-native';
import { useDeals } from '../context/DealsContext';
import { useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useIsFocused, useFocusEffect } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const DealStoryScreen = () => {
  // אין צורך ב-dragAnim (Animated.ValueXY) יותר
  // cubeAnim ו-dragX הם useSharedValue
  const exitAnimY = useSharedValue(0);
  const { allDeals } = useDeals();
  const route = useRoute();
  const category = (route as any)?.params?.category;
  const order = JSON.parse((route as any)?.params?.order || '[]');
  const categoryKeys = order.length ? order.filter((key: string) => allDeals[key]) : Object.keys(allDeals);

  // סטייט לזכירת אינדקס אחרון לכל קטגוריה
  const [lastViewedIndexMap, setLastViewedIndexMap] = useState<Record<string, number>>({});
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);

  // 🟦 עיקרי: סטייט לקטגוריה שנבחרה
  const [selectedCategory, setSelectedCategory] = useState(category);

  const isFocused = useIsFocused();

  useFocusEffect(
    React.useCallback(() => {
      // איפוס ערכי אנימציה בכניסה למסך
      exitAnimY.value = 0;
      if (category) {
        setSelectedCategory(category);
      }
      // איפוס ערכי אנימציה גם ביציאה מהמסך (cleanup)
      return () => {
        exitAnimY.value = 0;
      };
    }, [category])
  );

  // טעינת אינדקס הסטורי האחרון לכל קטגוריה
  useEffect(() => {
    const loadIndexMap = async () => {
      try {
        const saved = await AsyncStorage.getItem('lastViewedStoryIndexByCategory');
        const parsed = saved ? JSON.parse(saved) : {};
        const categories = Object.keys(allDeals); // כל הקטגוריות הקיימות
        const defaultMap = Object.fromEntries(categories.map(c => [c, 0]));
        const finalMap = { ...defaultMap, ...parsed };
        setLastViewedIndexMap(finalMap);
      } catch (e) {
        const categories = Object.keys(allDeals);
        const defaultMap = Object.fromEntries(categories.map(c => [c, 0]));
        setLastViewedIndexMap(defaultMap);
      }
    };
    loadIndexMap();
  }, [allDeals]);

  // עדכון האינדקס של הסטורי בהתאם לקטגוריה הנוכחית
  useEffect(() => {
    if (!selectedCategory || !lastViewedIndexMap) return;
    const idx = categoryKeys.findIndex((c: string) => c === selectedCategory);
    if (idx !== -1) {
      setCurrentCategoryIndex(idx);
      const savedIndex = typeof lastViewedIndexMap[selectedCategory] === 'number'
        ? lastViewedIndexMap[selectedCategory]
        : 0;
      setCurrentStoryIndex(savedIndex);
    }
  }, [selectedCategory, categoryKeys, lastViewedIndexMap]);

  const currentCategory = categoryKeys[currentCategoryIndex];
  const currentDeals = allDeals[currentCategory] || [];
  const sortedDeals = [...currentDeals].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const currentDeal = sortedDeals[currentStoryIndex];

  // פונקציה לעדכון גם בסטייט וגם ב-AsyncStorage
  const updateLastViewedIndex = async (category: string, index: number) => {
    const newMap = { ...lastViewedIndexMap, [category]: index };
    setLastViewedIndexMap(newMap);
    await AsyncStorage.setItem('lastViewedStoryIndexByCategory', JSON.stringify(newMap));
  };

  const navigation = useNavigation();

  // ערכי אנימציה חדשים
  const cubeAnim = useSharedValue(0);
  const dragX = useSharedValue(0);

  // פאן ג׳סצ׳ר החדש:
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      dragX.value = e.translationX;
      cubeAnim.value = e.translationX / width;

      // Vertical pan for closing
      if (Math.abs(e.translationY) > Math.abs(e.translationX)) {
        exitAnimY.value = e.translationY;
      }
    })
    .onEnd(() => {
      const threshold = width * 0.25;
      // Vertical swipe to close
      if (Math.abs(exitAnimY.value) > height * 0.1) {
        exitAnimY.value = withTiming(exitAnimY.value > 0 ? height : -height, {}, () => {
          runOnJS(navigation.goBack)();
          exitAnimY.value = 0;
        });
        return;
      }
      // Cube effect between categories
      if (dragX.value < -threshold && currentCategoryIndex < categoryKeys.length - 1) {
        cubeAnim.value = withTiming(1, {}, () => {
          runOnJS(setSelectedCategory)(categoryKeys[currentCategoryIndex + 1]);
          cubeAnim.value = 0;
          dragX.value = 0;
        });
      } else if (dragX.value > threshold && currentCategoryIndex > 0) {
        cubeAnim.value = withTiming(-1, {}, () => {
          runOnJS(setSelectedCategory)(categoryKeys[currentCategoryIndex - 1]);
          cubeAnim.value = 0;
          dragX.value = 0;
        });
      } else {
        cubeAnim.value = withSpring(0);
        dragX.value = withSpring(0);
        exitAnimY.value = withSpring(0);
      }
    });

  // useAnimatedStyle לאפקט קובייה
  const animatedStyleCurrent = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateY: `${interpolate(cubeAnim.value, [-1, 0, 1], [60, 0, -60])}deg` },
      { translateX: interpolate(cubeAnim.value, [-1, 0, 1], [width, 0, -width]) },
    ],
  }));
  const animatedStyleNext = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateY: `${interpolate(cubeAnim.value, [-1, 0, 1], [0, 60, 0])}deg` },
      { translateX: interpolate(cubeAnim.value, [-1, 0, 1], [width, 2 * width, width]) },
    ],
  }));
  const animatedStylePrev = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateY: `${interpolate(cubeAnim.value, [-1, 0, 1], [0, -60, 0])}deg` },
      { translateX: interpolate(cubeAnim.value, [-1, 0, 1], [-width, -2 * width, -width]) },
    ],
  }));

  // קומפוננטת פס התקדמות
  const ProgressBar = ({ progress }: { progress: number }) => (
    <View style={styles.progressBarBg}>
      <Animated.View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
    </View>
  );

// סטייט לזמן של כל סטורי 
  const timerRef = useRef<number | null>(null);
    // סטייט לפס התקדמות
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!currentDeal) return;
    setProgress(0);
    clearInterval(timerRef.current!);
    timerRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 1) {
          clearInterval(timerRef.current!);
          const nextIndex = currentStoryIndex + 1;
          console.log('currentStoryIndex:', currentStoryIndex, 'sortedDeals.length:', sortedDeals.length, 'currentCategoryIndex:', currentCategoryIndex, 'categoryKeys.length:', categoryKeys.length);
          if (nextIndex < sortedDeals.length) {
            setCurrentStoryIndex(nextIndex);
            updateLastViewedIndex(currentCategory, nextIndex);
          } else {
            // סיום קטגוריה
            if (currentCategoryIndex < categoryKeys.length - 1) {
              const nextCategory = categoryKeys[currentCategoryIndex + 1];
              const nextDeals = allDeals[nextCategory] || [];
              if (!nextDeals.length) {
                navigation.goBack();
                return 0;
              }
              cubeAnim.value = withTiming(1, {}, () => {
                setSelectedCategory(nextCategory);
                cubeAnim.value = 0;
              });
            } else {
              navigation.goBack();
            }
          }
          return 0;
        }
        return p + 0.02;
      });
    }, 100);
    return () => clearInterval(timerRef.current!);
  }, [currentStoryIndex, currentDeal, currentCategoryIndex, sortedDeals.length]);

  useEffect(() => {
    if (!isFocused) {
      clearInterval(timerRef.current!);
    }
  }, [isFocused]);

  // פונקציה להפעלת הסטורי מחדש כאשר מושך ידי מהמסך
  const restartStoryTimer = () => {
    clearInterval(timerRef.current!);
    timerRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 1) {
          clearInterval(timerRef.current!);
          const nextIndex = currentStoryIndex + 1;
          if (nextIndex < sortedDeals.length) {
            setCurrentStoryIndex(nextIndex);
            updateLastViewedIndex(currentCategory, nextIndex);
          }
          return 0;
        }
        return p + 0.02;
      });
    }, 100);
  };

  // פונקציית עזר להצגת דיל (סטורי) בקטגוריה מסוימת
  const renderStoryContent = (categoryIndex: number, storyIndex: number) => {
    const cat = categoryKeys[categoryIndex];
    const deals = allDeals[cat] || [];
    const sorted = [...deals].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const deal = sorted[storyIndex];
    if (!deal) return null;
    return (
      deal.image_url ? (
        <Animated.Image
          source={{ uri: deal.image_url }}
          style={styles.fullImage}
          resizeMode="cover"
        />
      ) : null
    );
  };

  // שלד תצוגה בסיסי
  return (
    <GestureDetector gesture={panGesture}>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
        <TouchableWithoutFeedback
          onPress={(event) => {
            const { locationX } = event.nativeEvent;
            if (locationX < width / 2) {
              // Previous story
              if (currentStoryIndex > 0) {
                setCurrentStoryIndex(currentStoryIndex - 1);
                updateLastViewedIndex(currentCategory, currentStoryIndex - 1);
              }
            } else {
              // Next story
              if (currentStoryIndex < sortedDeals.length - 1) {
                setCurrentStoryIndex(currentStoryIndex + 1);
                updateLastViewedIndex(currentCategory, currentStoryIndex + 1);
              }
            }
          }}
        >
          <Animated.View
            style={[
              styles.fullScreenWrapper,
              { transform: [{ translateY: exitAnimY }] },
            ]}
          >
            {/* פסי התקדמות */}
            <View style={styles.progressRow} pointerEvents="box-none">
              {sortedDeals.map((_, index) => (
                <ProgressBar
                  key={index}
                  progress={
                    index < currentStoryIndex
                      ? 1
                      : index === currentStoryIndex
                      ? progress
                      : 0
                  }
                />
              ))}
            </View>
            {/* סטורי קודם */}
            {currentCategoryIndex > 0 && (
              <Animated.View
                style={[
                  { position: 'absolute', width, height },
                  animatedStylePrev,
                ]}
                pointerEvents="none"
              >
                {renderStoryContent(currentCategoryIndex - 1, 0)}
              </Animated.View>
            )}
            {/* סטורי נוכחי */}
            <Animated.View
              style={[
                { position: 'absolute', width, height },
                animatedStyleCurrent,
              ]}
            >
              {renderStoryContent(currentCategoryIndex, currentStoryIndex)}
            </Animated.View>
            {/* סטורי הבא */}
            {currentCategoryIndex < categoryKeys.length - 1 && (
              <Animated.View
                style={[
                  { position: 'absolute', width, height },
                  animatedStyleNext,
                ]}
                pointerEvents="none"
              >
                {renderStoryContent(currentCategoryIndex + 1, 0)}
              </Animated.View>
            )}
          </Animated.View>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  fullScreenWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
    zIndex: 999,
  },
  animatedBox: {
    flex: 1,
  },
  fullImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  progressRow: {
    flexDirection: 'row',
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    zIndex: 10,
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
});

export default DealStoryScreen; 