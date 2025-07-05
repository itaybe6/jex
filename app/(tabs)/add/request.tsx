import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Platform, Modal, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabaseApi';
import { useAuth } from '@/hooks/useAuth';
import { TopHeader } from '../../../components/TopHeader';
import { WATCH_BRANDS_MODELS, GEM_TYPES, FILTER_FIELDS_BY_CATEGORY, CATEGORY_LABELS } from '@/constants/filters';
import RingIcon from '@/assets/images/ring.png';
import NecklaceIcon from '@/assets/images/necklace-02.png';
import JewelryIcon from '@/assets/images/jewelry.png';
import BraceletIcon from '@/assets/images/bracelet.png';
import CrownIcon from '@/assets/images/crown.png';
import DiamondIcon from '@/assets/images/diamond.png';
import ShoppingCartIcon from '@/assets/images/shopping-cart.png';
import GemIcon from '@/assets/images/gem.png';
import WatchIcon from '@/assets/images/watch (1).png';

const CATEGORY_ICONS = {
  'Rings': () => <Image source={RingIcon} style={{ width: 40, height: 40, resizeMode: 'contain' }} />,
  'Necklaces': () => <Image source={NecklaceIcon} style={{ width: 40, height: 40, resizeMode: 'contain' }} />,
  'Earrings': () => <Image source={JewelryIcon} style={{ width: 40, height: 40, resizeMode: 'contain' }} />,
  'Bracelets': () => <Image source={BraceletIcon} style={{ width: 40, height: 40, resizeMode: 'contain' }} />,
  'Special Pieces': () => <Image source={CrownIcon} style={{ width: 40, height: 40, resizeMode: 'contain' }} />,
  'Loose Diamonds': () => <Image source={DiamondIcon} style={{ width: 40, height: 40, resizeMode: 'contain' }} />,
  'Rough Diamonds': () => <Image source={ShoppingCartIcon} style={{ width: 40, height: 40, resizeMode: 'contain' }} />,
  'Gems': () => <Image source={GemIcon} style={{ width: 40, height: 40, resizeMode: 'contain' }} />,
  'Watches': () => <Image source={WatchIcon} style={{ width: 40, height: 40, resizeMode: 'contain' }} />,
};

const JEWELRY_TYPES = ['Ring', 'Necklace', 'Earrings', 'Bracelet'];
const MATERIALS = ['GOLD', 'PLATINUM', 'SILVER'];
const DIAMOND_SHAPES = ['Round', 'Princess', 'Oval', 'Marquise', 'Pear', 'Emerald', 'Radiant', 'Heart', 'Cushion', 'Asscher'];
const DIAMOND_CUTS = ['POOR', 'FAIR', 'GOOD', 'VERY GOOD', 'EXCELLENT'];
const CLARITY_GRADES = ["I3", "I2", "I1", "SI2", "SI1", "VS2", "VS1", "VVS2", "VVS1", "IF", "FL"];
const COLOR_GRADES = ["D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];

const ALL_WEIGHT_OPTIONS = Array.from({ length: 46 }, (_, i) => (0.5 + i * 0.1).toFixed(1));

export default function AddRequestScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('');
  const [isRough, setIsRough] = useState(false);
  const [jewelryType, setJewelryType] = useState('');
  const [jewelrySubcategory, setJewelrySubcategory] = useState('');
  const [material, setMaterial] = useState('');
  const [weightFrom, setWeightFrom] = useState('');
  const [weightTo, setWeightTo] = useState('');
  const [diamondColors, setDiamondColors] = useState<string[]>([]);
  const [diamondClarities, setDiamondClarities] = useState<string[]>([]);
  const [diamondCuts, setDiamondCuts] = useState<string[]>([]);
  const [hasSideStones, setHasSideStones] = useState(false);
  const [watchBrand, setWatchBrand] = useState('');
  const [watchModel, setWatchModel] = useState('');
  const [gemType, setGemType] = useState('');
  const [gemOrigin, setGemOrigin] = useState('');
  const [gemWeightFrom, setGemWeightFrom] = useState('');
  const [gemWeightTo, setGemWeightTo] = useState('');
  const [gemShapes, setGemShapes] = useState<string[]>([]);
  const [gemClarities, setGemClarities] = useState<string[]>([]);
  const [diamondShape, setDiamondShape] = useState('');
  const [diamondWeightFrom, setDiamondWeightFrom] = useState('');
  const [diamondWeightTo, setDiamondWeightTo] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showJewelryTypeModal, setShowJewelryTypeModal] = useState(false);
  const [showJewelrySubcategoryModal, setShowJewelrySubcategoryModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showWeightToModal, setShowWeightToModal] = useState(false);
  const [showGemTypeModal, setShowGemTypeModal] = useState(false);
  const [showGemOriginModal, setShowGemOriginModal] = useState(false);
  const [showGemWeightModal, setShowGemWeightModal] = useState(false);
  const [showGemShapesModal, setShowGemShapesModal] = useState(false);
  const [showGemClaritiesModal, setShowGemClaritiesModal] = useState(false);
  const [showDiamondShapeModal, setShowDiamondShapeModal] = useState(false);
  const [showDiamondWeightModal, setShowDiamondWeightModal] = useState(false);
  const [diamondShapes, setDiamondShapes] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFields, setSelectedFields] = useState<Record<string, any>>({});

  const maxWeightOptions = useMemo(() => {
    if (!weightFrom) return ALL_WEIGHT_OPTIONS;
    
    const weightIndex = ALL_WEIGHT_OPTIONS.indexOf(weightFrom);
    if (weightIndex === -1) return ALL_WEIGHT_OPTIONS;
    
    return ALL_WEIGHT_OPTIONS.slice(weightIndex + 1);
  }, [weightFrom]);

  const handleWeightChange = (value: string) => {
    setWeightFrom(value);
    if (weightTo && parseFloat(weightTo) <= parseFloat(value)) {
      setWeightTo('');
      }
  };

  const handleSubmit = async () => {
    try {
      if (!user?.id) {
        Alert.alert('Error', 'You must be logged in to add a request');
        return;
      }
      let details: any = { ...selectedFields };
      details.description = description;
      setLoading(true);
      const localTime = new Date();
      const israelTime = new Date(localTime.getTime() + (3 * 60 * 60 * 1000));
      const formatted = israelTime.toISOString();
      const res = await fetch(`${SUPABASE_URL}/rest/v1/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          user_id: user?.id,
          category,
          title,
          description,
          details,
          created_at: formatted,
        })
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }
      router.replace('/');
      return;
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'An error occurred while adding the request. Please try again.', [{ text: 'OK' }]);
    } finally {
      setLoading(false);
    }
  };

  // Find subcategory options for jewelry type
  const jewelrySubcategoryOptions = Array.isArray(FILTER_FIELDS_BY_CATEGORY[jewelryType])
    ? (FILTER_FIELDS_BY_CATEGORY[jewelryType].find(f => f.key === 'subcategory')?.options as string[] | undefined) || []
    : [];

  return (
    <View style={styles.container}>
      <TopHeader />
      <TouchableOpacity
        onPress={() => router.back()}
        style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 16, marginTop: 8, marginBottom: 8, paddingVertical: 4, paddingHorizontal: 8 }}
      >
        <Ionicons name="arrow-back" size={24} color="#0E2657" style={{ marginRight: 6 }} />
        <Text style={{ color: '#0E2657', fontSize: 16, fontWeight: 'bold' }}>Back</Text>
      </TouchableOpacity>
      <ScrollView style={styles.form}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Enter request title"
        />
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          value={description}
          onChangeText={setDescription}
          placeholder="Enter request description"
          multiline
        />
        <Text style={styles.label}>Category</Text>
        <TouchableOpacity style={styles.selectButton} onPress={() => setShowCategoryModal(true)}>
          <Text style={styles.selectButtonText}>{category || 'Select category'}</Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>
        {showCategoryModal && (
          <Modal visible transparent animationType="slide" onRequestClose={() => setShowCategoryModal(false)}>
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Category</Text>
                  <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                    <Ionicons name="close" size={24} color="#0E2657" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ paddingBottom: 16 }}>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                    {Object.keys(FILTER_FIELDS_BY_CATEGORY).map((category) => (
                      <TouchableOpacity
                        key={category}
                        style={{ width: '47%', marginBottom: 18, alignItems: 'center', backgroundColor: '#F5F8FC', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#E5E7EB' }}
                        onPress={() => { setCategory(category); setShowCategoryModal(false); }}
                        activeOpacity={0.85}
                      >
                        {(CATEGORY_ICONS[(CATEGORY_LABELS[category] || category) as keyof typeof CATEGORY_ICONS]
                          ? CATEGORY_ICONS[(CATEGORY_LABELS[category] || category) as keyof typeof CATEGORY_ICONS]()
                          : <Ionicons name="apps" size={32} color="#0E2657" />)
                        }
                        <Text style={{ marginTop: 8, color: '#0E2657', fontFamily: 'Montserrat-Medium', fontSize: 15, textAlign: 'center' }}>
                          {CATEGORY_LABELS[category] || category}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>
          </Modal>
        )}
        {category === 'Jewelry' && (
          <>
            <Text style={styles.label}>Jewelry Type</Text>
            <TouchableOpacity style={styles.selectButton} onPress={() => setShowJewelryTypeModal(true)}>
              <Text style={styles.selectButtonText}>{jewelryType || 'Select type'}</Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
            {jewelryType && (
              <>
                <Text style={styles.label}>Subcategory</Text>
                <TouchableOpacity style={styles.selectButton} onPress={() => setShowJewelrySubcategoryModal(true)}>
                  <Text style={styles.selectButtonText}>{jewelrySubcategory || 'Select subcategory'}</Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
              </>
            )}
            <Text style={styles.label}>Material</Text>
            <TouchableOpacity style={styles.selectButton} onPress={() => setShowMaterialModal(true)}>
              <Text style={styles.selectButtonText}>{material || 'Select material'}</Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
            <Text style={styles.label}>Weight (From - To)</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              <TextInput style={[styles.input, { flex: 1 }]} value={weightFrom} onChangeText={handleWeightChange} placeholder="From" keyboardType="numeric" />
              <TextInput style={[styles.input, { flex: 1 }]} value={weightTo} onChangeText={setWeightTo} placeholder="To" keyboardType="numeric" />
            </View>
            <Text style={styles.label}>Diamond Color</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              {COLOR_GRADES.map(option => (
                <TouchableOpacity
                  key={option}
                  style={[styles.filterOption, diamondColors.includes(option) && styles.filterOptionSelected]}
                  onPress={() => setDiamondColors(prev => prev.includes(option) ? prev.filter(c => c !== option) : [...prev, option])}
                >
                  <Text style={[styles.filterOptionText, diamondColors.includes(option) && styles.filterOptionTextSelected]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.label}>Clarity</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              {CLARITY_GRADES.map(option => (
                <TouchableOpacity
                  key={option}
                  style={[styles.filterOption, diamondClarities.includes(option) && styles.filterOptionSelected]}
                  onPress={() => setDiamondClarities(prev => prev.includes(option) ? prev.filter(c => c !== option) : [...prev, option])}
                >
                  <Text style={[styles.filterOptionText, diamondClarities.includes(option) && styles.filterOptionTextSelected]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.label}>Cut</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              {DIAMOND_CUTS.map(option => (
                <TouchableOpacity
                  key={option}
                  style={[styles.filterOption, diamondCuts.includes(option) && styles.filterOptionSelected]}
                  onPress={() => setDiamondCuts(prev => prev.includes(option) ? prev.filter(c => c !== option) : [...prev, option])}
                >
                  <Text style={[styles.filterOptionText, diamondCuts.includes(option) && styles.filterOptionTextSelected]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Text style={[styles.label, { flex: 1 }]}>Side Stones?</Text>
              <TouchableOpacity
                style={[styles.selectButton, { flex: 1, backgroundColor: hasSideStones ? '#6C5CE7' : '#111' }]}
                onPress={() => setHasSideStones(v => !v)}
              >
                <Text style={styles.selectButtonText}>{hasSideStones ? 'Yes' : 'No'}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        {category === 'Watch' && (
          <>
            <Text style={styles.label}>Brand</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              {Object.keys(WATCH_BRANDS_MODELS).map(option => (
                <TouchableOpacity
                  key={option}
                  style={[styles.filterOption, watchBrand === option && styles.filterOptionSelected]}
                  onPress={() => setWatchBrand(option)}
                >
                  <Text style={[styles.filterOptionText, watchBrand === option && styles.filterOptionTextSelected]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {watchBrand && (
              <>
                <Text style={styles.label}>Model</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                  {(WATCH_BRANDS_MODELS[watchBrand] || []).map(option => (
                    <TouchableOpacity
                      key={option}
                      style={[styles.filterOption, watchModel === option && styles.filterOptionSelected]}
                      onPress={() => setWatchModel(option)}
                    >
                      <Text style={[styles.filterOptionText, watchModel === option && styles.filterOptionTextSelected]}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}
          </>
        )}
        {category === 'Gem' && (
          <>
            <Text style={styles.label}>Gem Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              {GEM_TYPES.map(option => (
                <TouchableOpacity
                  key={option}
                  style={[styles.filterOption, gemType === option && styles.filterOptionSelected]}
                  onPress={() => setGemType(option)}
                >
                  <Text style={[styles.filterOptionText, gemType === option && styles.filterOptionTextSelected]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.label}>Origin</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              {['Natural', 'Lab Grown'].map(option => (
                <TouchableOpacity
                  key={option}
                  style={[styles.filterOption, gemOrigin === option && styles.filterOptionSelected]}
                  onPress={() => setGemOrigin(option)}
                >
                  <Text style={[styles.filterOptionText, gemOrigin === option && styles.filterOptionTextSelected]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.label}>Weight (From - To)</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              <TextInput style={[styles.input, { flex: 1 }]} value={gemWeightFrom} onChangeText={setGemWeightFrom} placeholder="From" keyboardType="numeric" />
              <TextInput style={[styles.input, { flex: 1 }]} value={gemWeightTo} onChangeText={setGemWeightTo} placeholder="To" keyboardType="numeric" />
            </View>
            <Text style={styles.label}>Shape</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              {DIAMOND_SHAPES.map(option => (
                <TouchableOpacity
                  key={option}
                  style={[styles.filterOption, gemShapes.includes(option) && styles.filterOptionSelected]}
                  onPress={() => setGemShapes(prev => prev.includes(option) ? prev.filter(c => c !== option) : [...prev, option])}
                >
                  <Text style={[styles.filterOptionText, gemShapes.includes(option) && styles.filterOptionTextSelected]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.label}>Clarity</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              {CLARITY_GRADES.map(option => (
                <TouchableOpacity
                  key={option}
                  style={[styles.filterOption, gemClarities.includes(option) && styles.filterOptionSelected]}
                  onPress={() => setGemClarities(prev => prev.includes(option) ? prev.filter(c => c !== option) : [...prev, option])}
                >
                  <Text style={[styles.filterOptionText, gemClarities.includes(option) && styles.filterOptionTextSelected]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}
        {category === 'Loose Diamond' && (
          <>
            <Text style={styles.label}>Shape</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              {DIAMOND_SHAPES.map(option => (
                <TouchableOpacity
                  key={option}
                  style={[styles.filterOption, diamondShapes.includes(option) && styles.filterOptionSelected]}
                  onPress={() => setDiamondShapes(prev => prev.includes(option) ? prev.filter(c => c !== option) : [...prev, option])}
                >
                  <Text style={[styles.filterOptionText, diamondShapes.includes(option) && styles.filterOptionTextSelected]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.label}>Weight (From - To)</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              <TextInput style={[styles.input, { flex: 1 }]} value={diamondWeightFrom} onChangeText={setDiamondWeightFrom} placeholder="From" keyboardType="numeric" />
              <TextInput style={[styles.input, { flex: 1 }]} value={diamondWeightTo} onChangeText={setDiamondWeightTo} placeholder="To" keyboardType="numeric" />
            </View>
            <Text style={styles.label}>Color</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              {COLOR_GRADES.map(option => (
                <TouchableOpacity
                  key={option}
                  style={[styles.filterOption, diamondColors.includes(option) && styles.filterOptionSelected]}
                  onPress={() => setDiamondColors(prev => prev.includes(option) ? prev.filter(c => c !== option) : [...prev, option])}
                >
                  <Text style={[styles.filterOptionText, diamondColors.includes(option) && styles.filterOptionTextSelected]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.label}>Clarity</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              {CLARITY_GRADES.map(option => (
                <TouchableOpacity
                  key={option}
                  style={[styles.filterOption, diamondClarities.includes(option) && styles.filterOptionSelected]}
                  onPress={() => setDiamondClarities(prev => prev.includes(option) ? prev.filter(c => c !== option) : [...prev, option])}
                >
                  <Text style={[styles.filterOptionText, diamondClarities.includes(option) && styles.filterOptionTextSelected]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.label}>Cut</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              {DIAMOND_CUTS.map(option => (
                <TouchableOpacity
                  key={option}
                  style={[styles.filterOption, diamondCuts.includes(option) && styles.filterOptionSelected]}
                  onPress={() => setDiamondCuts(prev => prev.includes(option) ? prev.filter(c => c !== option) : [...prev, option])}
                >
                  <Text style={[styles.filterOptionText, diamondCuts.includes(option) && styles.filterOptionTextSelected]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}
        {category === 'Rough Diamond' && (
          <>
            <Text style={styles.label}>Shape</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              {DIAMOND_SHAPES.map(option => (
                <TouchableOpacity
                  key={option}
                  style={[styles.filterOption, diamondShapes.includes(option) && styles.filterOptionSelected]}
                  onPress={() => setDiamondShapes(prev => prev.includes(option) ? prev.filter(c => c !== option) : [...prev, option])}
                >
                  <Text style={[styles.filterOptionText, diamondShapes.includes(option) && styles.filterOptionTextSelected]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.label}>Weight (From - To)</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              <TextInput style={[styles.input, { flex: 1 }]} value={diamondWeightFrom} onChangeText={setDiamondWeightFrom} placeholder="From" keyboardType="numeric" />
              <TextInput style={[styles.input, { flex: 1 }]} value={diamondWeightTo} onChangeText={setDiamondWeightTo} placeholder="To" keyboardType="numeric" />
            </View>
            <Text style={styles.label}>Color</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              {COLOR_GRADES.map(option => (
                <TouchableOpacity
                  key={option}
                  style={[styles.filterOption, diamondColors.includes(option) && styles.filterOptionSelected]}
                  onPress={() => setDiamondColors(prev => prev.includes(option) ? prev.filter(c => c !== option) : [...prev, option])}
                >
                  <Text style={[styles.filterOptionText, diamondColors.includes(option) && styles.filterOptionTextSelected]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.label}>Clarity</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              {CLARITY_GRADES.map(option => (
                <TouchableOpacity
                  key={option}
                  style={[styles.filterOption, diamondClarities.includes(option) && styles.filterOptionSelected]}
                  onPress={() => setDiamondClarities(prev => prev.includes(option) ? prev.filter(c => c !== option) : [...prev, option])}
                >
                  <Text style={[styles.filterOptionText, diamondClarities.includes(option) && styles.filterOptionTextSelected]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}
        {category && FILTER_FIELDS_BY_CATEGORY[category] && (
          <>
            {FILTER_FIELDS_BY_CATEGORY[category].map(field => {
              if (field.type === 'multi-select' && Array.isArray(field.options)) {
                return (
                  <View key={field.key} style={{ marginBottom: 12 }}>
                    <Text style={styles.label}>{field.label}</Text>
                    <ScrollView horizontal>
                      {field.options.map(option => (
                        <TouchableOpacity
                          key={option}
                          style={[
                            styles.filterOption,
                            (selectedFields[field.key] || []).includes(option) && styles.filterOptionSelected
                          ]}
                          onPress={() => {
                            setSelectedFields(prev => {
                              const current: any[] = prev[field.key] || [];
                              return {
                                ...prev,
                                [field.key]: current.includes(option)
                                  ? current.filter((o: any) => o !== option)
                                  : [...current, option]
                              };
                            });
                          }}
                        >
                          <Text style={[
                            styles.filterOptionText,
                            (selectedFields[field.key] || []).includes(option) && styles.filterOptionTextSelected
                          ]}>{option}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                );
              }
              if (field.type === 'boolean') {
                return (
                  <View key={field.key} style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={[styles.label, { flex: 1 }]}>{field.label}</Text>
                    <TouchableOpacity
                      style={[styles.selectButton, { flex: 1, backgroundColor: selectedFields[field.key] ? '#6C5CE7' : '#111' }]}
                      onPress={() => setSelectedFields(prev => ({ ...prev, [field.key]: !prev[field.key] }))}
                    >
                      <Text style={styles.selectButtonText}>{selectedFields[field.key] ? 'Yes' : 'No'}</Text>
                    </TouchableOpacity>
                  </View>
                );
              }
              if (field.type === 'range') {
                return (
                  <View key={field.key} style={{ marginBottom: 12, flexDirection: 'row', gap: 8 }}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      value={selectedFields[`${field.key}_from`] || ''}
                      onChangeText={val => setSelectedFields(prev => ({ ...prev, [`${field.key}_from`]: val }))}
                      placeholder="From"
                      keyboardType="numeric"
                    />
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      value={selectedFields[`${field.key}_to`] || ''}
                      onChangeText={val => setSelectedFields(prev => ({ ...prev, [`${field.key}_to`]: val }))}
                      placeholder="To"
                      keyboardType="numeric"
                    />
                  </View>
                );
              }
              // ברירת מחדל: שדה טקסט
              return (
                <View key={field.key} style={{ marginBottom: 12 }}>
                  <Text style={styles.label}>{field.label}</Text>
                  <TextInput
                    style={styles.input}
                    value={selectedFields[field.key] || ''}
                    onChangeText={val => setSelectedFields(prev => ({ ...prev, [field.key]: val }))}
                    placeholder={`Enter ${field.label}`}
                  />
                </View>
              );
            })}
          </>
        )}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Adding...' : 'Add Request'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
      {showJewelryTypeModal && (
        <Modal
          visible={showJewelryTypeModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowJewelryTypeModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Jewelry Type</Text>
                <TouchableOpacity onPress={() => setShowJewelryTypeModal(false)}>
                  <Ionicons name="chevron-down" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalOptions}>
                {JEWELRY_TYPES.map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.modalOption,
                      jewelryType === option && styles.modalOptionSelected,
                    ]}
                    onPress={() => {
                      setJewelryType(option);
                      setShowJewelryTypeModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        jewelryType === option && styles.modalOptionTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
      {showJewelrySubcategoryModal && (
        <Modal
          visible={showJewelrySubcategoryModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowJewelrySubcategoryModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Jewelry Subcategory</Text>
                <TouchableOpacity onPress={() => setShowJewelrySubcategoryModal(false)}>
                  <Ionicons name="chevron-down" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalOptions}>
                {jewelrySubcategoryOptions.map((option: string) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.modalOption,
                      jewelrySubcategory === option && styles.modalOptionSelected,
                    ]}
                    onPress={() => {
                      setJewelrySubcategory(option);
                      setShowJewelrySubcategoryModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        jewelrySubcategory === option && styles.modalOptionTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
      {showMaterialModal && (
        <Modal
          visible={showMaterialModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowMaterialModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Material</Text>
                <TouchableOpacity onPress={() => setShowMaterialModal(false)}>
                  <Ionicons name="chevron-down" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalOptions}>
                {MATERIALS.map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.modalOption,
                      material === option && styles.modalOptionSelected,
                    ]}
                    onPress={() => {
                      setMaterial(option);
                      setShowMaterialModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        material === option && styles.modalOptionTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
      {showWeightModal && (
        <Modal
          visible={showWeightModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowWeightModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Weight</Text>
                <TouchableOpacity onPress={() => setShowWeightModal(false)}>
                  <Ionicons name="chevron-down" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalOptions}>
                {maxWeightOptions.map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.modalOption,
                      weightFrom === option && styles.modalOptionSelected,
                    ]}
                    onPress={() => {
                      handleWeightChange(option);
                      setShowWeightModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        weightFrom === option && styles.modalOptionTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
      {showWeightToModal && (
        <Modal
          visible={showWeightToModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowWeightToModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Weight</Text>
                <TouchableOpacity onPress={() => setShowWeightToModal(false)}>
                  <Ionicons name="chevron-down" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalOptions}>
                {maxWeightOptions.map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.modalOption,
                      weightTo === option && styles.modalOptionSelected,
                    ]}
                    onPress={() => {
                      setWeightTo(option);
                      setShowWeightToModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        weightTo === option && styles.modalOptionTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
      {showGemTypeModal && (
        <Modal
          visible={showGemTypeModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowGemTypeModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Gem Type</Text>
                <TouchableOpacity onPress={() => setShowGemTypeModal(false)}>
                  <Ionicons name="chevron-down" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalOptions}>
                {GEM_TYPES.map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.modalOption,
                      gemType === option && styles.modalOptionSelected,
                    ]}
                    onPress={() => {
                      setGemType(option);
                      setShowGemTypeModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        gemType === option && styles.modalOptionTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
      {showGemOriginModal && (
        <Modal
          visible={showGemOriginModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowGemOriginModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Gem Origin</Text>
                <TouchableOpacity onPress={() => setShowGemOriginModal(false)}>
                  <Ionicons name="chevron-down" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalOptions}>
                {['Natural', 'Lab Grown'].map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.modalOption,
                      gemOrigin === option && styles.modalOptionSelected,
                    ]}
                    onPress={() => {
                      setGemOrigin(option);
                      setShowGemOriginModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        gemOrigin === option && styles.modalOptionTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
      {showGemWeightModal && (
        <Modal
          visible={showGemWeightModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowGemWeightModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Gem Weight</Text>
                <TouchableOpacity onPress={() => setShowGemWeightModal(false)}>
                  <Ionicons name="chevron-down" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalOptions}>
                {ALL_WEIGHT_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.modalOption,
                      gemWeightFrom === option && styles.modalOptionSelected,
                    ]}
                    onPress={() => {
                      setGemWeightFrom(option);
                      setShowGemWeightModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        gemWeightFrom === option && styles.modalOptionTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
      {showGemShapesModal && (
        <Modal
          visible={showGemShapesModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowGemShapesModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Gem Shape</Text>
                <TouchableOpacity onPress={() => setShowGemShapesModal(false)}>
                  <Ionicons name="chevron-down" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalOptions}>
                {DIAMOND_SHAPES.map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.modalOption,
                      gemShapes.includes(option) && styles.modalOptionSelected,
                    ]}
                    onPress={() => {
                      setGemShapes(prev => prev.includes(option) ? prev.filter(c => c !== option) : [...prev, option]);
                      setShowGemShapesModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        gemShapes.includes(option) && styles.modalOptionTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
      {showGemClaritiesModal && (
        <Modal
          visible={showGemClaritiesModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowGemClaritiesModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Gem Clarity</Text>
                <TouchableOpacity onPress={() => setShowGemClaritiesModal(false)}>
                  <Ionicons name="chevron-down" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalOptions}>
                {CLARITY_GRADES.map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.modalOption,
                      gemClarities.includes(option) && styles.modalOptionSelected,
                    ]}
                    onPress={() => {
                      setGemClarities(prev => prev.includes(option) ? prev.filter(c => c !== option) : [...prev, option]);
                      setShowGemClaritiesModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        gemClarities.includes(option) && styles.modalOptionTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
      {showDiamondShapeModal && (
        <Modal
          visible={showDiamondShapeModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDiamondShapeModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Diamond Shape</Text>
                <TouchableOpacity onPress={() => setShowDiamondShapeModal(false)}>
                  <Ionicons name="chevron-down" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalOptions}>
                {DIAMOND_SHAPES.map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.modalOption,
                      diamondShape === option && styles.modalOptionSelected,
                    ]}
                    onPress={() => {
                      setDiamondShape(option);
                      setShowDiamondShapeModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        diamondShape === option && styles.modalOptionTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
      {showDiamondWeightModal && (
        <Modal
          visible={showDiamondWeightModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDiamondWeightModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Diamond Weight</Text>
                <TouchableOpacity onPress={() => setShowDiamondWeightModal(false)}>
                  <Ionicons name="chevron-down" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalOptions}>
                {ALL_WEIGHT_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.modalOption,
                      diamondWeightFrom === option && styles.modalOptionSelected,
                    ]}
                    onPress={() => {
                      setDiamondWeightFrom(option);
                      setShowDiamondWeightModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        diamondWeightFrom === option && styles.modalOptionTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FC',
  },
  form: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    margin: 16,
    shadowColor: '#0E2657',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  label: {
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
    color: '#0E2657',
    marginBottom: 8,
    textAlign: 'left',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    color: '#0E2657',
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
    marginBottom: 16,
    textAlign: 'left',
  },
  selectButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#0E2657',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  selectButtonText: {
    color: '#0E2657',
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
  },
  submitButton: {
    backgroundColor: '#0E2657',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#0E2657',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#0E2657',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat-SemiBold',
    color: '#0E2657',
  },
  modalOptions: {
    maxHeight: 400,
  },
  modalOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalOptionSelected: {
    backgroundColor: '#0E2657',
  },
  modalOptionText: {
    color: '#0E2657',
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
    textAlign: 'left',
  },
  modalOptionTextSelected: {
    color: '#fff',
    fontFamily: 'Montserrat-SemiBold',
  },
  filterOption: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#fff',
    marginRight: 8,
    marginBottom: 4,
  },
  filterOptionSelected: {
    backgroundColor: '#0E2657',
    borderColor: '#0E2657',
  },
  filterOptionText: {
    color: '#0E2657',
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
  },
  filterOptionTextSelected: {
    color: '#fff',
    fontFamily: 'Montserrat-SemiBold',
  },
}); 