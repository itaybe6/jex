import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet, TextInput } from 'react-native';
import { X } from 'lucide-react-native';
import { useState } from 'react';
import { FilterField, FilterParams, FilterState } from '@/types/filter';
import { FILTER_FIELDS_BY_CATEGORY, PRICE_FILTER_FIELDS, CATEGORY_LABELS, WATCH_BRANDS_MODELS, GEM_TYPES } from '@/constants/filters';

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
    onApplyFilters({
      category: 'Watches',
      filters
    });
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
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setSelectedFilters({});
    setBooleanFilters({});
    setSelectedWatchBrands([]);
    setSelectedWatchModels([]);
    setWatchPriceFrom('');
    setWatchPriceTo('');
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

    onApplyFilters({
      category: selectedCategory,
      filters
    });
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
    onApplyFilters({
      category: 'Gems',
      filters
    });
    onClose();
  };

  const renderFilterField = (field: FilterField) => {
    if (!isFieldVisible(field)) return null;

    switch (field.type) {
      case 'multi-select':
        return (
          <View key={field.key} style={styles.filterSection}>
            <Text style={styles.filterLabel}>{field.label}</Text>
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
            <Text style={styles.filterLabel}>{field.label}</Text>
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
              <Text style={styles.filterLabel}>{field.label}</Text>
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
    <ScrollView style={styles.filtersContainer}>
      {/* Price Range */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Price ($)</Text>
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
        <Text style={styles.filterLabel}>Brand</Text>
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
          <Text style={styles.filterLabel}>Model</Text>
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
  );

  // Gems: render only relevant fields
  const renderGemsFields = () => (
    <ScrollView style={styles.filtersContainer}>
      {/* Price Range */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Price ($)</Text>
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
        <Text style={styles.filterLabel}>Gem Type</Text>
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
        <Text style={styles.filterLabel}>Certification Status</Text>
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
        <Text style={styles.filterLabel}>Type</Text>
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
                (selectedFilters['type'] || []).includes(option) && styles.filterOptionTextSelected
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
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
      return (
        <View style={styles.categorySection}>
          <Text style={styles.sectionTitle}>Select Category</Text>
          <ScrollView style={{ flexGrow: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
            {Object.keys(FILTER_FIELDS_BY_CATEGORY).map(category => (
              <TouchableOpacity
                key={category}
                style={[styles.categoryOption, selectedCategory === category && styles.categoryOptionSelected]}
                onPress={() => handleCategorySelect(category)}
              >
                <Text style={[styles.categoryOptionText, selectedCategory === category && styles.categoryOptionTextSelected]}>
                  {CATEGORY_LABELS[category] || category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      );
    }

    return (
      <ScrollView style={styles.filtersContainer}>
        {PRICE_FILTER_FIELDS.map(field => renderFilterField(field))}
        {FILTER_FIELDS_BY_CATEGORY[selectedCategory]?.map(field => renderFilterField(field))}
      </ScrollView>
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
            <Text style={styles.modalTitle}>
              {selectedCategory ? `Filter ${selectedCategory}` : 'Filter Products'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {renderFilterFields()}

          {/* Filters List */}
          {filters.length > 0 && (
            <View style={{padding: 16}}>
              <Text style={{color: '#fff', fontWeight: 'bold', marginBottom: 8}}>Filters</Text>
              {filters.map((f, idx) => (
                <View key={idx} style={{backgroundColor: '#222', borderRadius: 10, padding: 10, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                  <View>
                    <Text style={{color: '#fff', fontWeight: 'bold'}}>{f.category}</Text>
                    <Text style={{color: '#fff', fontSize: 12}}>
                      {Object.entries(f.filters).map(([k, v]) => `${k}: ${v.join(', ')}`).join(' | ')}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveFilter(idx)} style={{marginLeft: 8, padding: 4}}>
                    <Text style={{color: '#fff', fontWeight: 'bold', fontSize: 16}}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.footerButton} onPress={resetFilters}>
              <Text style={styles.footerButtonText}>Clear</Text>
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
            <View style={{paddingHorizontal: 20, paddingBottom: 20}}>
              <TouchableOpacity
                style={[styles.footerButton, styles.applyButton]}
                onPress={() => { onApplyFilters(filters); onClose(); }}
              >
                <Text style={[styles.footerButtonText, styles.applyButtonText]}>Show Results</Text>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 5,
  },
  categorySection: {
    padding: 20,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  categoryOption: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#2a2a2a',
  },
  categoryOptionSelected: {
    backgroundColor: '#007AFF',
  },
  categoryOptionText: {
    fontSize: 16,
    color: '#fff',
  },
  categoryOptionTextSelected: {
    fontWeight: 'bold',
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
    color: '#fff',
    marginBottom: 10,
  },
  filterOption: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    marginRight: 10,
  },
  filterOptionSelected: {
    backgroundColor: '#007AFF',
  },
  filterOptionText: {
    color: '#fff',
  },
  filterOptionTextSelected: {
    fontWeight: 'bold',
  },
  rangeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rangeInput: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 10,
    color: '#fff',
  },
  rangeSeparator: {
    paddingHorizontal: 10,
    color: '#fff',
  },
  booleanContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  booleanButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
  },
  booleanButtonSelected: {
    backgroundColor: '#007AFF',
  },
  booleanButtonText: {
    color: '#fff',
  },
  booleanButtonTextSelected: {
    fontWeight: 'bold',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  footerButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
    marginHorizontal: 5,
    alignItems: 'center',
  },
  applyButton: {
    backgroundColor: '#007AFF',
  },
  footerButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  applyButtonText: {
    fontWeight: 'bold',
  },
}); 