import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { getDealsByCategory } from '@/lib/supabaseApi';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');
const STORY_DURATION = 5000;

type DealProduct = {
  price?: number;
  // add more fields if needed
};

type Deal = {
  id: string;
  image_url?: string;
  message?: string;
  marketing_text?: string;
  products?: DealProduct;
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
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!category) return;
    setLoading(true);
    getDealsByCategory(category)
      .then((data) => setDeals(data || []))
      .catch(() => setDeals([]))
      .finally(() => setLoading(false));
  }, [category]);

  useEffect(() => {
    if (!deals.length) return;
    setProgress(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleNext();
          return 0;
        }
        return p + 0.02;
      });
    }, STORY_DURATION / 50) as unknown as NodeJS.Timeout;
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [current, deals]);

  const handleNext = () => {
    if (current < deals.length - 1) {
      setCurrent(current + 1);
    } else {
      navigation.goBack();
    }
  };

  const handlePrev = () => {
    if (current > 0) {
      setCurrent(current - 1);
    } else {
      navigation.goBack();
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}><ActivityIndicator size="large" color="#0E2657" /></View>
    );
  }
  if (!deals.length) {
    return (
      <View style={styles.centered}><Text>No deals found for this category.</Text></View>
    );
  }

  const deal: Deal = deals[current] || {} as Deal;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.progressRow}>
        {deals.map((_, idx) => (
          <ProgressBar key={idx} progress={idx < current ? 1 : idx === current ? progress : 0} />
        ))}
      </View>
      <TouchableOpacity style={styles.leftZone} onPress={handlePrev} />
      <TouchableOpacity style={styles.rightZone} onPress={handleNext} />
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
        {deal.message ? <Text style={styles.storyMessage}>{deal.message}</Text> : null}
        {deal.marketing_text ? <Text style={styles.storyMessage}>{deal.marketing_text}</Text> : null}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    position: 'relative',
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
});

export default DealStoryScreen; 