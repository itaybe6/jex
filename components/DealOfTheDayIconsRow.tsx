import React, { useState } from 'react';
import type { JSX } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, I18nManager, Modal, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabaseApi';
import { useAuth } from '@/hooks/useAuth';

// Mock data for demonstration (keys match _specs categories)
const dealCountsByCategory: Record<string, number> = {
  bracelet: 2,
  earring: 1,
  gem: 1,
  loose_diamonds: 3,
  necklace: 1,
  ring: 2,
  rough_diamond: 1,
  special_piece: 1,
  watch: 2,
};

// Add this mapping at the top of the file
const categoryToProductType: Record<string, string> = {
  bracelet: 'bracelet',
  earring: 'earring',
  gem: 'gems',
  loose_diamonds: 'loose_diamonds',
  necklace: 'necklace',
  ring: 'ring',
  rough_diamond: 'rough_diamond',
  special_piece: 'special_piece',
  watch: 'watches',
};

type DealCategoryItem = { type: 'category'; category: string };
type DealAddItem = { type: 'add' };
type DealItem = DealCategoryItem | DealAddItem;

// Helper to return the right icon for each category
export function getIconByCategory(category: string): JSX.Element | null {
  switch (category) {
    case 'bracelet':
      return <MaterialCommunityIcons name="bracelet" size={32} color="#0E2657" />;
    case 'earring':
      return <MaterialCommunityIcons name="ear-hearing" size={32} color="#0E2657" />;
    case 'gem':
      return <MaterialCommunityIcons name="diamond-stone" size={32} color="#0E2657" />;
    case 'loose_diamonds':
      return <MaterialCommunityIcons name="diamond-stone" size={32} color="#0E2657" />;
    case 'necklace':
      return <MaterialCommunityIcons name="necklace" size={32} color="#0E2657" />;
    case 'ring':
      return <Feather name="circle" size={32} color="#0E2657" />;
    case 'rough_diamond':
      return <FontAwesome5 name="gem" size={32} color="#0E2657" />;
    case 'special_piece':
      return <Feather name="star" size={32} color="#0E2657" />;
    case 'watch':
      return <FontAwesome5 name="watch" size={32} color="#0E2657" />;
    default:
      return null;
  }
}

// Add button label based on language
const addLabel = I18nManager.isRTL ? 'הוסף' : 'Add';

// Compose the data for the FlatList
const categories = Object.keys(dealCountsByCategory).filter(
  (cat) => getIconByCategory(cat) !== null
);
const flatListData: DealItem[] = [
  { type: 'add' },
  ...categories.map((cat) => ({ type: 'category' as const, category: cat })),
];

const ITEM_WIDTH = 72;
const ITEM_SEPARATOR = 8;

const DealOfTheDayIconsRow: React.FC = () => {
  const { user, accessToken } = useAuth();
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [checking, setChecking] = useState(false);

  const handleAddDealPress = async () => {
    if (!user) return;
    setChecking(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const url = `${SUPABASE_URL}/rest/v1/deal_of_the_day?user_id=eq.${user.id}&created_at=gte.${today.toISOString()}&select=id`;
      const res = await fetch(url, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
        },
      });
      if (!res.ok) throw new Error('Error checking deal limit');
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setShowLimitModal(true);
        setChecking(false);
        return;
      }
      setChecking(false);
      router.push('/SelectDealProductScreen');
    } catch (e) {
      setChecking(false);
      Alert.alert('Error', 'Could not check deal status. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
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
            return (
              <TouchableOpacity
                style={styles.iconWrapper}
                onPress={() => router.push(`/DealStoryScreen?category=${categoryToProductType[item.category]}`)}
                activeOpacity={0.7}
              >
                <View style={styles.iconCircle}>
                  {getIconByCategory(item.category)}
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{dealCountsByCategory[item.category]}</Text>
                  </View>
                </View>
                <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">{item.category.charAt(0).toUpperCase() + item.category.slice(1).replace('_', ' ')}</Text>
              </TouchableOpacity>
            );
          }
          return null;
        }}
      />
    </View>
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
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: '#0E2657',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
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