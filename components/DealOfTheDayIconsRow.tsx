import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import type { JSX } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, I18nManager, Modal, Alert, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SUPABASE_URL, SUPABASE_ANON_KEY, getAllDeals, getUnseenDealsCountByCategory } from '@/lib/supabaseApi';
import { useAuth } from '@/hooks/useAuth';
import { useFocusEffect } from '@react-navigation/native';
import RingImage from '@/assets/images/ring.png';
import BraceletImage from '@/assets/images/bracelet.png';
import Bracelet2Image from '@/assets/images/bracelet2.png';
import EarringImage from '@/assets/images/earring.png';
import GemImage from '@/assets/images/gem.png';
import LoosediamondImage from '@/assets/images/loosediamond.png';
import NecklaceImage from '@/assets/images/necklace.png';
import EoughdiamondImage from '@/assets/images/eoughdiamond.png';
import SpecialpiecesImage from '@/assets/images/specialpieces.png';
import WatchImage from '@/assets/images/watch.png';

// Mock data for demonstration (keys match _specs categories)
const dealCountsByCategory: Record<string, number> = {
  bracelet: 2,
  earring: 1,
  gem: 1,
  loose_diamonds: 3,
  necklace: 1,
  ring: 2,
  rough_diamond: 1,
  specialpieces: 1,
  watch: 2,
};

// Add this mapping at the top of the file
export const categoryToProductType: Record<string, string> = {
  bracelet: 'bracelet',
  earring: 'earring',
  gem: 'gems',
  loosediamond: 'loosediamond',
  necklace: 'necklace',
  ring: 'ring',
  rough_diamond: 'rough_diamond',
  specialpieces: 'specialpieces',
  watch: 'watches',
};

type DealCategoryItem = { type: 'category'; category: string };
type DealAddItem = { type: 'add' };
type DealItem = DealCategoryItem | DealAddItem;

// Helper to return the right icon for each category
export function getIconByCategory(category: string): JSX.Element | null {
  switch (category) {
    case 'bracelet':
      return (
        <Image
          source={Bracelet2Image}
          style={{ width: 44, height: 44, resizeMode: 'contain' }}
        />
      );
    case 'earring':
      return (
        <Image
          source={EarringImage}
          style={{ width: 44, height: 44, resizeMode: 'contain' }}
        />
      );
    case 'gem':
      return (
        <Image
          source={GemImage}
          style={{ width: 44, height: 44, resizeMode: 'contain' }}
        />
      );
    case 'loosediamond':
      return (
        <Image
          source={LoosediamondImage}
          style={{ width: 44, height: 44, resizeMode: 'contain' }}
        />
      );
    case 'necklace':
      return (
        <Image
          source={NecklaceImage}
          style={{ width: 44, height: 44, resizeMode: 'contain' }}
        />
      );
    case 'ring':
      return (
        <Image
          source={RingImage}
          style={{ width: 44, height: 44, resizeMode: 'contain' }}
        />
      );
    case 'rough_diamond':
      return (
        <Image
          source={EoughdiamondImage}
          style={{ width: 44, height: 44, resizeMode: 'contain' }}
        />
      );
    case 'specialpieces':
      return (
        <Image
          source={SpecialpiecesImage}
          style={{ width: 44, height: 44, resizeMode: 'contain' }}
        />
      );
    case 'watch':
      return (
        <Image
          source={WatchImage}
          style={{ width: 44, height: 44, resizeMode: 'contain' }}
        />
      );
    default:
      return null;
  }
}

// Add button label based on language
const addLabel = I18nManager.isRTL ? 'הוסף' : 'Add';

const ITEM_WIDTH = 92;
const ITEM_SEPARATOR = 8;

// Context for unseen deals
export const UnseenDealsContext = createContext<{
  unseenCounts: Record<string, number>;
  refreshUnseenCounts: () => void;
  refreshKey: number;
}>({ unseenCounts: {}, refreshUnseenCounts: () => {}, refreshKey: 0 });

export const useUnseenDeals = () => useContext(UnseenDealsContext);

const DealOfTheDayIconsRow: React.FC = () => {
  const { user, accessToken } = useAuth();
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [checking, setChecking] = useState(false);
  const [unseenCounts, setUnseenCounts] = useState<Record<string, number>>({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadingDeal, setLoadingDeal] = useState(false);
  const [userDeal, setUserDeal] = useState(false);

  // Refresh function
  const refreshUnseenCounts = useCallback(() => {
    if (!user || !accessToken) return;
    getUnseenDealsCountByCategory(user.id, accessToken)
      .then(setUnseenCounts)
      .then(() => setRefreshKey(k => k + 1))
      .catch(() => setUnseenCounts({}));
  }, [user, accessToken]);

  useEffect(() => {
    refreshUnseenCounts();
  }, [refreshUnseenCounts]);

  // Refresh unseen deals when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      refreshUnseenCounts();
    }, [refreshUnseenCounts])
  );

  // Map category keys to display names if needed
  const categories = Object.keys(categoryToProductType);
  // Count unseen deals per category (using product_type field)
  const categoriesWithCounts = categories.map(cat => {
    const productType = categoryToProductType[cat];
    const count = unseenCounts[productType] || 0;
    return { name: cat, count, productType };
  });

  // פיצול ומיון
  const withProducts = categoriesWithCounts.filter(c => c.count > 0).sort((a, b) => b.count - a.count);
  const withoutProducts = categoriesWithCounts.filter(c => c.count === 0);

  // סדר סופי: קודם עם מוצרים (מהרבה למעט), אחר כך בלי מוצרים
  const sortedCategories = [...withProducts, ...withoutProducts];

  // סדר את הקטגוריות בלבד (בלי הפלוס)
  const categoriesData: DealItem[] = sortedCategories.map(({ name }) => ({ type: 'category' as const, category: name }));

  // הפלוס תמיד ראשון (בצד ימין)
  const flatListData: DealItem[] = [
    { type: 'add' as const },
    ...categoriesData,
  ];

  const handleAddDealPress = async () => {
    if (!user) return;
    router.push('/SelectDealProductScreen');
  };

  const handleYourDealPress = () => {
    if (loadingDeal) return;
    if (!userDeal) {
      router.push('/SelectDealProductScreen');
    } else {
      router.push('/UserDealStoryScreen');
    }
  };

  return (
    <UnseenDealsContext.Provider value={{ unseenCounts, refreshUnseenCounts, refreshKey }}>
      <View style={styles.container}>
        <FlatList
          key={refreshKey}
          data={flatListData}
          horizontal
          keyExtractor={(item, idx) => item.type === 'add' ? 'add' : (item.type === 'category' ? item.category : String(idx))}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ width: ITEM_SEPARATOR }} />}
          renderItem={({ item }) => {
            if (item.type === 'add') {
              return (
                <>
                  <TouchableOpacity
                    style={styles.iconWrapper}
                    onPress={handleAddDealPress}
                    activeOpacity={0.7}
                    disabled={checking}
                  >
                    <View style={styles.iconCircle}>
                      <Ionicons name="add" size={32} color="#0E2657" />
                    </View>
                    <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">{addLabel}</Text>
                  </TouchableOpacity>
                  <Modal
                    visible={showLimitModal}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowLimitModal(false)}
                  >
                    <View style={styles.modalOverlay}>
                      <View style={styles.limitModalContent}>
                        <Text style={styles.limitModalText}>You have already posted a deal for today. You can post a new deal tomorrow.</Text>
                        <TouchableOpacity style={styles.limitModalButton} onPress={() => setShowLimitModal(false)}>
                          <Text style={styles.limitModalButtonText}>OK</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </Modal>
                </>
              );
            }
            if (item.type === 'category') {
              // Find count for this category
              const catObj = categoriesWithCounts.find(c => c.name === item.category);
              const dealCount = catObj ? catObj.count : 0;
              return (
                <TouchableOpacity
                  style={styles.iconWrapper}
                  onPress={() => router.push(`/DealStoryScreen?category=${categoryToProductType[item.category]}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.iconCircle}>
                    {getIconByCategory(item.category)}
                    {/* Show badge only if count > 0 */}
                    {dealCount > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{dealCount}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">{item.category.charAt(0).toUpperCase() + item.category.slice(1).replace('_', ' ')}</Text>
                </TouchableOpacity>
              );
            }
            return null;
          }}
        />
      </View>
    </UnseenDealsContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F8FC',
    paddingTop: 0,
    paddingBottom: 8,
    paddingLeft: 12,
    paddingRight: 0,
  },
  listContent: {
    alignItems: 'center',
  },
  iconWrapper: {
    alignItems: 'center',
    width: ITEM_WIDTH,
    // marginHorizontal is handled by ItemSeparatorComponent
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1.5,
    borderColor: 'rgba(14,38,87,0.7)',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    padding: 2,
    shadowColor: '#0E2657',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  badge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#FFA500',
    borderRadius: 8,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  label: {
    marginTop: 6,
    fontSize: 13,
    color: '#0E2657',
    fontFamily: 'Montserrat-Medium',
    textAlign: 'center',
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  limitModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    width: 320,
    alignItems: 'center',
    shadowColor: '#0E2657',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  limitModalText: {
    fontSize: 16,
    color: '#0E2657',
    fontFamily: 'Montserrat-Bold',
    marginBottom: 18,
    textAlign: 'center',
  },
  limitModalButton: {
    backgroundColor: '#6C5CE7',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  limitModalButtonText: {
    color: '#fff',
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
  },
});

export default DealOfTheDayIconsRow;