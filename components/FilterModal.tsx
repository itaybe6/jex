import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet, TextInput, Image } from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useState } from 'react';
import { FilterField, FilterParams, FilterState } from '@/types/filter';
import { FILTER_FIELDS_BY_CATEGORY, PRICE_FILTER_FIELDS, CATEGORY_LABELS, WATCH_BRANDS_MODELS, GEM_TYPES } from '@/constants/filters';
import BraceletIcon from '@/assets/images/bracelet.png';
import RingIcon from '@/assets/images/ring.png';
import DiamondIcon from '@/assets/images/diamond.png';
import JewelryIcon from '@/assets/images/jewelry.png';
import NecklaceIcon from '@/assets/images/necklace-02.png';
import CrownIcon from '@/assets/images/crown.png';
import ShoppingCartIcon from '@/assets/images/shopping-cart.png';
import GemIcon from '@/assets/images/gem.png';
import WatchIcon from '@/assets/images/watch (1).png';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

type FilterModalProps = {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterParams[]) => void;
  filters: FilterParams[];
  onFiltersChange: (filters: FilterParams[]) => void;
  initialCategory?: string;
  initialFilters?: FilterParams;
};

export default function FilterModal({
  visible,
  onClose,
  onApplyFilters,
  filters,
  onFiltersChange,
  initialCategory,
  initialFilters,
}: FilterModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || '');
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>(initialFilters?.filters || {});
  const [booleanFilters, setBooleanFilters] = useState<Record<string, boolean>>({});

  // Watches-specific state for dynamic models
  const [selectedWatchBrands, setSelectedWatchBrands] = useState<string[]>([]);
  const [selectedWatchModels, setSelectedWatchModels] = useState<string[]>([]);

  // Gems-specific state
  const [selectedGemTypes, setSelectedGemTypes] = useState<string[]>([]);
  const [gemsPriceFrom, setGemsPriceFrom] = useState('');
  const [gemsPriceTo, setGemsPriceTo] = useState('');

  // Add state for expanded filter details
  const [expandedFilterIdx, setExpandedFilterIdx] = useState<number | null>(null);

  const insets = useSafeAreaInsets();

  // Watches: get models for selected brands
  const getAvailableWatchModels = () => {
    if (!selectedWatchBrands.length) return [];
    const models = selectedWatchBrands.flatMap(brand => WATCH_BRANDS_MODELS[brand] || []);
    // Remove duplicates
    return Array.from(new Set(models));
  };

  // Watches: handle brand select
  const handleWatchBrandSelect = (brand: string) => {
    setSelectedWatchBrands(prev => {
      const newBrands = prev.includes(brand)
        ? prev.filter(b => b !== brand)
        : [...prev, brand];
      // Remove models that are not in the new brands
      const validModels = selectedWatchModels.filter(model =>
        newBrands.some(b => (WATCH_BRANDS_MODELS[b] || []).includes(model))
      );
      setSelectedWatchModels(validModels);
      return newBrands;
    });
  };

  // Watches: handle model select
  const handleWatchModelSelect = (model: string) => {
    setSelectedWatchModels(prev =>
      prev.includes(model)
        ? prev.filter(m => m !== model)
        : [...prev, model]
    );
  };

  // Watches: handle price range
  const [watchPriceFrom, setWatchPriceFrom] = useState('');
  const [watchPriceTo, setWatchPriceTo] = useState('');

  // Watches: apply filters
  const handleApplyWatchesFilters = () => {
    const filters: Record<string, string[]> = {};
    if (watchPriceFrom) filters['price_from'] = [watchPriceFrom];
    if (watchPriceTo) filters['price_to'] = [watchPriceTo];
    if (selectedWatchBrands.length) filters['brand'] = selectedWatchBrands;
    if (selectedWatchModels.length) filters['model'] = selectedWatchModels;
    onApplyFilters([{
      category: 'Watches',
      filters
    }]);
    onClose();
  };

  const resetFilters = () => {
    setSelectedCategory('');
    setSelectedFilters({});
    setBooleanFilters({});
    setSelectedWatchBrands([]);
    setSelectedWatchModels([]);
    setWatchPriceFrom('');
    setWatchPriceTo('');
    setSelectedGemTypes([]);
    setGemsPriceFrom('');
    setGemsPriceTo('');
    onFiltersChange([]);
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setSelectedFilters({});
    setBooleanFilters({});
    setSelectedWatchBrands([]);
    setSelectedWatchModels([]);
    setWatchPriceFrom('');
    setWatchPriceTo('');
    setSelectedGemTypes([]);
    setGemsPriceFrom('');
    setGemsPriceTo('');
  };

  const handleFilterSelect = (fieldKey: string, value: string) => {
    setSelectedFilters(prev => {
      const currentValues = prev[fieldKey] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      return { ...prev, [fieldKey]: newValues };
    });
  };

  const handleBooleanFilterToggle = (fieldKey: string) => {
    setBooleanFilters(prev => ({
      ...prev,
      [fieldKey]: !prev[fieldKey]
    }));
  };

  const handleRangeChange = (fieldKey: string, value: string, isFrom: boolean) => {
    const key = isFrom ? `${fieldKey}_from` : `${fieldKey}_to`;
    setSelectedFilters(prev => ({
      ...prev,
      [key]: [value]
    }));
  };

  const isFieldVisible = (field: FilterField) => {
    if (!field.condition) return true;
    const { field: conditionField, includes } = field.condition;
    const selectedValues = selectedFilters[conditionField] || [];
    return includes.some(value => selectedValues.includes(value));
  };

  const handleApplyFilters = () => {
    const filters = { ...selectedFilters };
    
    // Add boolean filters
    Object.entries(booleanFilters).forEach(([key, value]) => {
      if (value) {
        filters[key] = ['true'];
      }
    });

    onApplyFilters([{
      category: selectedCategory,
      filters
    }]);
    onClose();
  };

  // Gems: handle gem type select
  const handleGemTypeSelect = (gem: string) => {
    setSelectedGemTypes(prev =>
      prev.includes(gem)
        ? prev.filter(g => g !== gem)
        : [...prev, gem]
    );
  };

  // Gems: apply filters
  const handleApplyGemsFilters = () => {
    const filters: Record<string, string[]> = {};
    if (gemsPriceFrom) filters['price_from'] = [gemsPriceFrom];
    if (gemsPriceTo) filters['price_to'] = [gemsPriceTo];
    if (selectedGemTypes.length) filters['gem_type'] = selectedGemTypes;
    // Add other fields (certification_status, type) from selectedFilters
    if (selectedFilters['certification_status']) filters['certification_status'] = selectedFilters['certification_status'];
    if (selectedFilters['type']) filters['type'] = selectedFilters['type'];
    onApplyFilters([{
      category: 'Gems',
      filters
    }]);
    onClose();
  };

  const renderFilterField = (field: FilterField) => {
    if (!isFieldVisible(field)) return null;

    switch (field.type) {
      case 'multi-select':
        return (
          <View key={field.key} style={styles.filterSection}>
            <Text style={[styles.filterLabel, { fontFamily: 'Montserrat-Medium' }]}>{field.label}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {field.options?.map(option => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.filterOption,
                    (selectedFilters[field.key] || []).includes(option) && styles.filterOptionSelected
                  ]}
                  onPress={() => handleFilterSelect(field.key, option)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    { fontFamily: 'Montserrat-Medium' },
                    (selectedFilters[field.key] || []).includes(option) && styles.filterOptionTextSelected
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );

      case 'range':
      case 'number':
        return (
          <View key={field.key} style={styles.filterSection}>
            <Text style={[styles.filterLabel, { fontFamily: 'Montserrat-Medium' }]}>{field.label}</Text>
            <View style={styles.rangeInputContainer}>
              <TextInput
                style={styles.rangeInput}
                placeholder="From"
                keyboardType="numeric"
                value={(selectedFilters[`${field.key}_from`] || [])[0] || ''}
                onChangeText={text => handleRangeChange(field.key, text, true)}
              />
              <Text style={styles.rangeSeparator}>-</Text>
              <TextInput
                style={styles.rangeInput}
                placeholder="To"
                keyboardType="numeric"
                value={(selectedFilters[`${field.key}_to`] || [])[0] || ''}
                onChangeText={text => handleRangeChange(field.key, text, false)}
              />
            </View>
          </View>
        );

      case 'boolean':
        return (
          <View key={field.key} style={styles.filterSection}>
            <View style={styles.booleanContainer}>
              <Text style={[styles.filterLabel, { fontFamily: 'Montserrat-Medium' }]}>{field.label}</Text>
              <TouchableOpacity
                style={[styles.booleanButton, booleanFilters[field.key] && styles.booleanButtonSelected]}
                onPress={() => handleBooleanFilterToggle(field.key)}
              >
                <Text style={[styles.booleanButtonText, booleanFilters[field.key] && styles.booleanButtonTextSelected]}>
                  {booleanFilters[field.key] ? 'Yes' : 'No'}
                </Text>
              </TouchableOpacity>
            </View>
            {booleanFilters[field.key] && field.subFields?.map(subField => renderFilterField(subField))}
          </View>
        );

      default:
        return null;
    }
  };

  const renderWatchesFields = () => (
    <View style={{ flex: 1 }}>
      {/* כפתור חזור */}
      <TouchableOpacity
        style={{ flexDirection: 'row', alignItems: 'center', padding: 20, paddingBottom: 0 }}
        onPress={() => setSelectedCategory('')}
      >
        <Ionicons name="arrow-back" size={22} color="#0E2657" style={{ marginRight: 8 }} />
        <Text style={{ color: '#0E2657', fontFamily: 'Montserrat-Medium', fontSize: 16 }}>Back</Text>
      </TouchableOpacity>
      <ScrollView style={styles.filtersContainer}>
        {/* Price Range */}
        <View style={styles.filterSection}>
          <Text style={[styles.filterLabel, { fontFamily: 'Montserrat-Medium' }]}>Price ($)</Text>
          <View style={styles.rangeInputContainer}>
            <TextInput
              style={styles.rangeInput}
              placeholder="From"
              keyboardType="numeric"
              value={watchPriceFrom}
              onChangeText={setWatchPriceFrom}
            />
            <Text style={styles.rangeSeparator}>-</Text>
            <TextInput
              style={styles.rangeInput}
              placeholder="To"
              keyboardType="numeric"
              value={watchPriceTo}
              onChangeText={setWatchPriceTo}
            />
          </View>
        </View>
        {/* Brand Multi-select */}
        <View style={styles.filterSection}>
          <Text style={[styles.filterLabel, { fontFamily: 'Montserrat-Medium' }]}>Brand</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {Object.keys(WATCH_BRANDS_MODELS).map(brand => (
              <TouchableOpacity
                key={brand}
                style={[
                  styles.filterOption,
                  selectedWatchBrands.includes(brand) && styles.filterOptionSelected
                ]}
                onPress={() => handleWatchBrandSelect(brand)}
              >
                <Text style={[
                  styles.filterOptionText,
                  { fontFamily: 'Montserrat-Medium' },
                  selectedWatchBrands.includes(brand) && styles.filterOptionTextSelected
                ]}>
                  {brand}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        {/* Model Multi-select (only if brand selected) */}
        {selectedWatchBrands.length > 0 && (
          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { fontFamily: 'Montserrat-Medium' }]}>Model</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {getAvailableWatchModels().map(model => (
                <TouchableOpacity
                  key={model}
                  style={[
                    styles.filterOption,
                    selectedWatchModels.includes(model) && styles.filterOptionSelected
                  ]}
                  onPress={() => handleWatchModelSelect(model)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    { fontFamily: 'Montserrat-Medium' },
                    selectedWatchModels.includes(model) && styles.filterOptionTextSelected
                  ]}>
                    {model}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </View>
  );

  // Gems: render only relevant fields
  const renderGemsFields = () => (
    <View style={{ flex: 1 }}>
      {/* כפתור חזור */}
      <TouchableOpacity
        style={{ flexDirection: 'row', alignItems: 'center', padding: 20, paddingBottom: 0 }}
        onPress={() => setSelectedCategory('')}
      >
        <Ionicons name="arrow-back" size={22} color="#0E2657" style={{ marginRight: 8 }} />
        <Text style={{ color: '#0E2657', fontFamily: 'Montserrat-Medium', fontSize: 16 }}>Back</Text>
      </TouchableOpacity>
      <ScrollView style={styles.filtersContainer}>
        {/* Price Range */}
        <View style={styles.filterSection}>
          <Text style={[styles.filterLabel, { fontFamily: 'Montserrat-Medium' }]}>Price ($)</Text>
          <View style={styles.rangeInputContainer}>
            <TextInput
              style={styles.rangeInput}
              placeholder="From"
              keyboardType="numeric"
              value={gemsPriceFrom}
              onChangeText={setGemsPriceFrom}
            />
            <Text style={styles.rangeSeparator}>-</Text>
            <TextInput
              style={styles.rangeInput}
              placeholder="To"
              keyboardType="numeric"
              value={gemsPriceTo}
              onChangeText={setGemsPriceTo}
            />
          </View>
        </View>
        {/* Gem Type Multi-select */}
        <View style={styles.filterSection}>
          <Text style={[styles.filterLabel, { fontFamily: 'Montserrat-Medium' }]}>Gem Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {GEM_TYPES.map(gem => (
              <TouchableOpacity
                key={gem}
                style={[
                  styles.filterOption,
                  selectedGemTypes.includes(gem) && styles.filterOptionSelected
                ]}
                onPress={() => handleGemTypeSelect(gem)}
              >
                <Text style={[
                  styles.filterOptionText,
                  { fontFamily: 'Montserrat-Medium' },
                  selectedGemTypes.includes(gem) && styles.filterOptionTextSelected
                ]}>
                  {gem}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        {/* Certification Status */}
        <View style={styles.filterSection}>
          <Text style={[styles.filterLabel, { fontFamily: 'Montserrat-Medium' }]}>Certification Status</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['Certificated', 'None Certificated'].map(option => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.filterOption,
                  (selectedFilters['certification_status'] || []).includes(option) && styles.filterOptionSelected
                ]}
                onPress={() => handleFilterSelect('certification_status', option)}
              >
                <Text style={[
                  styles.filterOptionText,
                  { fontFamily: 'Montserrat-Medium' },
                  (selectedFilters['certification_status'] || []).includes(option) && styles.filterOptionTextSelected
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        {/* Type */}
        <View style={styles.filterSection}>
          <Text style={[styles.filterLabel, { fontFamily: 'Montserrat-Medium' }]}>Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['Natural', 'Lab Grown', 'Treated'].map(option => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.filterOption,
                  (selectedFilters['type'] || []).includes(option) && styles.filterOptionSelected
                ]}
                onPress={() => handleFilterSelect('type', option)}
              >
                <Text style={[
                  styles.filterOptionText,
                  { fontFamily: 'Montserrat-Medium' },
                  (selectedFilters['type'] || []).includes(option) && styles.filterOptionTextSelected
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );

  const renderFilterFields = () => {
    // Watches: custom rendering
    if (selectedCategory === 'Watches') {
      return renderWatchesFields();
    }
    // Gems: custom rendering
    if (selectedCategory === 'Gems') {
      return renderGemsFields();
    }
    if (!selectedCategory) {
      // Grid of categories
      const categories = Object.keys(FILTER_FIELDS_BY_CATEGORY);
      return (
        <View style={styles.categorySection}>
          <Text style={[styles.sectionTitle, { fontFamily: 'Montserrat-Medium' }]}>Select Category</Text>
          <ScrollView style={styles.categoryGridScroll} contentContainerStyle={styles.categoryGridContent} showsVerticalScrollIndicator={false}>
            <View style={styles.categoryGrid}>
              {categories.map((category, idx) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryGridItem,
                    selectedCategory === category && styles.filterOptionSelected
                  ]}
                  onPress={() => handleCategorySelect(category)}
                  activeOpacity={0.85}
                >
                  <View style={styles.categoryImageWrapper}>
                    {CATEGORY_ICONS[(CATEGORY_LABELS[category] || category) as keyof typeof CATEGORY_ICONS]
                      ? CATEGORY_ICONS[(CATEGORY_LABELS[category] || category) as keyof typeof CATEGORY_ICONS]()
                      : <Feather name="circle" size={32} color="#0E2657" />}
                  </View>
                  <Text style={[
                    styles.categoryGridText,
                    { fontFamily: 'Montserrat-Medium' },
                    selectedCategory === category && styles.filterOptionTextSelected
                  ]}>
                    {CATEGORY_LABELS[category] || category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      );
    }

    // הוספת כפתור חזור למסך פילטרים רגיל
    return (
      <View style={{ flex: 1 }}>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', padding: 20, paddingBottom: 0 }}
          onPress={() => setSelectedCategory('')}
        >
          <Ionicons name="arrow-back" size={22} color="#0E2657" style={{ marginRight: 8 }} />
          <Text style={{ color: '#0E2657', fontFamily: 'Montserrat-Medium', fontSize: 16 }}>Back</Text>
        </TouchableOpacity>
        <ScrollView style={styles.filtersContainer}>
          {PRICE_FILTER_FIELDS.map(field => renderFilterField(field))}
          {FILTER_FIELDS_BY_CATEGORY[selectedCategory]?.map(field => renderFilterField(field))}
        </ScrollView>
      </View>
    );
  };

  // Add Filter button handler
  const handleAddFilter = () => {
    const filtersObj = { ...selectedFilters };
    Object.entries(booleanFilters).forEach(([key, value]) => {
      if (value) {
        filtersObj[key] = ['true'];
      }
    });
    const newFilter: FilterParams = {
      category: selectedCategory,
      filters: filtersObj
    };
    onFiltersChange([...filters, newFilter]);
    // Reset form
    setSelectedCategory('');
    setSelectedFilters({});
    setBooleanFilters({});
    setSelectedWatchBrands([]);
    setSelectedWatchModels([]);
    setWatchPriceFrom('');
    setWatchPriceTo('');
    setSelectedGemTypes([]);
    setGemsPriceFrom('');
    setGemsPriceTo('');
  };

  // Remove filter handler
  const handleRemoveFilter = (idx: number) => {
    const newFilters = filters.filter((_, i) => i !== idx);
    onFiltersChange(newFilters);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { fontFamily: 'Montserrat-Medium' }]}>
              {selectedCategory ? `Filter ${selectedCategory}` : 'Filter Products'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#0E2657" />
            </TouchableOpacity>
          </View>

          {/* Filters List - always at the top */}
          {filters.length > 0 && (
            <View style={styles.savedFiltersContainer}>
              <Text style={styles.savedFiltersTitle}>Filters</Text>
              <ScrollView style={styles.savedFiltersScroll} contentContainerStyle={{paddingBottom: 4}}>
                {filters.map((f, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.savedFilterCard}
                    activeOpacity={0.8}
                    onPress={() => setExpandedFilterIdx(idx)}
                  >
                    <View style={styles.savedFilterCardRow}>
                      <Text
                        style={styles.savedFilterCategory}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {f.category}
                      </Text>
                      <TouchableOpacity onPress={() => handleRemoveFilter(idx)} style={styles.savedFilterRemove}>
                        <Text style={{color: '#0E2657', fontFamily: 'Montserrat-Medium', fontSize: 16}}>×</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {/* Expanded filter details modal */}
              {expandedFilterIdx !== null && (
                <Modal
                  visible={expandedFilterIdx !== null}
                  transparent
                  animationType="fade"
                  onRequestClose={() => setExpandedFilterIdx(null)}
                >
                  <View style={styles.detailsModalOverlay}>
                    <View style={styles.detailsModalContent}>
                      <View style={styles.detailsModalHeader}>
                        <Text style={styles.detailsModalTitle}>{filters[expandedFilterIdx].category}</Text>
                        <TouchableOpacity onPress={() => setExpandedFilterIdx(null)} style={styles.detailsModalClose}>
                          <Text style={{color: '#0E2657', fontFamily: 'Montserrat-Medium', fontSize: 20}}>×</Text>
                        </TouchableOpacity>
                      </View>
                      <ScrollView style={{maxHeight: 200}}>
                        <Text style={[styles.detailsModalText, {fontFamily: 'Montserrat-Regular'}]}>
                          {Object.entries(filters[expandedFilterIdx].filters).map(([k, v]) => `${k}: ${v.join(', ')}`).join(' | ')}
                        </Text>
                      </ScrollView>
                    </View>
                  </View>
                </Modal>
              )}
            </View>
          )}

          {renderFilterFields()}

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.footerButton} onPress={resetFilters}>
              <Text style={[styles.footerButtonText, { fontFamily: 'Montserrat-Medium' }]}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.footerButton, styles.applyButton]}
              onPress={handleAddFilter}
              disabled={!selectedCategory}
            >
              <Text style={[styles.footerButtonText, styles.applyButtonText]}>Add Filter</Text>
            </TouchableOpacity>
          </View>
          {/* Show Results button only if there are filters */}
          {filters.length > 0 && (
            <View style={{paddingHorizontal: 20, paddingBottom: 40 + (insets.bottom || 0), marginTop: 2}}>
              <TouchableOpacity
                style={[
                  styles.footerButton,
                  styles.applyButton,
                  { minHeight: 48, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }
                ]}
                onPress={() => { onApplyFilters(filters); onClose(); }}
              >
                <Text style={{
                  fontSize: 18,
                  lineHeight: 24,
                  textAlign: 'center',
                  fontFamily: 'Montserrat-Medium',
                  color: '#fff'
                }}>Show Results</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    color: '#0E2657',
  },
  closeButton: {
    padding: 5,
  },
  categorySection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 0,
    flex: 1,
    justifyContent: 'flex-start',
  },
  sectionTitle: {
    fontSize: 18,
    color: '#0E2657',
    marginBottom: 15,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 12,
  },
  categoryGridItem: {
    width: '47%',
    aspectRatio: 1,
    backgroundColor: '#F5F8FC',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#0E2657',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    padding: 10,
  },
  categoryImageWrapper: {
    width: 48,
    height: 48,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryImage: {
    width: 40,
    height: 40,
  },
  categoryGridText: {
    fontSize: 16,
    color: '#0E2657',
    textAlign: 'center',
  },
  filtersContainer: {
    flex: 1,
    padding: 20,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 10,
  },
  filterOption: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F5F8FC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 10,
  },
  filterOptionSelected: {
    backgroundColor: '#0E2657',
    borderColor: '#0E2657',
  },
  filterOptionText: {
    color: '#374151',
  },
  filterOptionTextSelected: {
    color: '#FFFFFF',
  },
  rangeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rangeInput: {
    flex: 1,
    backgroundColor: '#F5F8FC',
    borderRadius: 12,
    padding: 12,
    color: '#374151',
    fontFamily: 'Montserrat-Regular',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  rangeSeparator: {
    paddingHorizontal: 10,
    color: '#374151',
    fontFamily: 'Montserrat-Medium',
  },
  booleanContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  booleanButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F5F8FC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  booleanButtonSelected: {
    backgroundColor: '#0E2657',
    borderColor: '#0E2657',
  },
  booleanButtonText: {
    color: '#374151',
    fontFamily: 'Montserrat-Medium',
  },
  booleanButtonTextSelected: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Medium',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F5F8FC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginHorizontal: 5,
    alignItems: 'center',
  },
  applyButton: {
    backgroundColor: '#0E2657',
    borderColor: '#0E2657',
  },
  footerButtonText: {
    color: '#374151',
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Medium',
  },
  savedFiltersContainer: {
    maxHeight: 100,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  savedFiltersTitle: {
    color: '#0E2657',
    fontFamily: 'Montserrat-Medium',
    marginBottom: 4,
  },
  savedFiltersScroll: {
    maxHeight: 70,
  },
  savedFilterCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F8FC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  savedFilterCardRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  savedFilterCategory: {
    color: '#0E2657',
    fontFamily: 'Montserrat-Medium',
    fontSize: 16,
  },
  savedFilterRemove: {
    marginLeft: 12,
    padding: 4,
  },
  detailsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    minWidth: 260,
    maxWidth: 340,
    alignItems: 'flex-start',
  },
  detailsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  detailsModalTitle: {
    color: '#0E2657',
    fontFamily: 'Montserrat-Medium',
    fontSize: 18,
    flex: 1,
  },
  detailsModalClose: {
    marginLeft: 12,
    padding: 4,
  },
  detailsModalText: {
    color: '#374151',
    fontSize: 15,
    fontFamily: 'Montserrat-Regular',
    marginTop: 4,
  },
  categoryGridScroll: {
    marginTop: 8,
  },
  categoryGridContent: {
    paddingBottom: 0,
    paddingTop: 0,
  },
}); 