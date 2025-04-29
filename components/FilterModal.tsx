import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet, TextInput } from 'react-native';
import { X } from 'lucide-react-native';
import { useState } from 'react';

type FilterField = {
  key: string;
  type: 'range' | 'multi-select' | 'number' | 'text';
  label: string;
  options?: string[];
  condition?: {
    field: string;
    includes: string[];
  };
  min?: number;
  max?: number;
  step?: number;
};

type FilterFieldsByCategory = {
  [key: string]: FilterField[];
};

const filterFieldsByCategory: FilterFieldsByCategory = {
  "Ring": [
    {
      key: "subcategory",
      type: "multi-select",
      label: "Ring Type",
      options: [
        "Wedding ring", "Hand Chain Ring - Bracelet", "Classic ring",
        "Engagement ring", "Solitaire ring", "All around ring", "Band ring"
      ]
    },
    { 
      key: "diamond_size_from", 
      type: "number", 
      label: "Diamond Size From (Carat)",
      min: 0,
      step: 0.01
    },
    { 
      key: "diamond_size_to", 
      type: "number", 
      label: "Diamond Size To (Carat)",
      min: 0,
      step: 0.01
    },
    {
      key: "color",
      type: "multi-select",
      label: "Diamond Color",
      options: ["D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N-Z"]
    },
    {
      key: "clarity",
      type: "multi-select",
      label: "Diamond Clarity",
      options: ["FL", "IF", "VVS1", "VVS2", "VS1", "VS2", "SI1", "SI2", "I1", "I2", "I3"]
    },
    {
      key: "material",
      type: "multi-select",
      label: "Material",
      options: ["Gold", "Platinum", "Silver"]
    },
    {
      key: "gold_color",
      type: "multi-select",
      label: "Gold Color",
      options: ["White", "Rose", "Yellow"],
      condition: { field: "material", includes: ["Gold"] }
    },
    {
      key: "gold_karat",
      type: "multi-select",
      label: "Gold Karat",
      options: ["9K", "10K", "14K", "18K", "21K", "22K", "24K"],
      condition: { field: "material", includes: ["Gold"] }
    },
    {
      key: "cut_grade",
      type: "multi-select",
      label: "Cut Grade",
      options: ["POOR", "FAIR", "GOOD", "VERY GOOD", "EXCELLENT"]
    },
    {
      key: "certification",
      type: "multi-select",
      label: "Certification",
      options: ["GIA", "IGI", "HRD", "EGL", "SGL", "CGL", "IGL", "AIG"]
    }
  ],
  "Necklace": [
    {
      key: "subcategory",
      type: "multi-select",
      label: "Necklace Type",
      options: ["Pendant", "Chain", "Cuban links"]
    },
    {
      key: "material",
      type: "multi-select",
      label: "Material",
      options: ["Gold", "Platinum", "Silver"]
    },
    {
      key: "gold_color",
      type: "multi-select",
      label: "Gold Color",
      options: ["White", "Rose", "Yellow"],
      condition: { field: "material", includes: ["Gold"] }
    },
    {
      key: "gold_karat",
      type: "multi-select",
      label: "Gold Karat",
      options: ["9K", "10K", "14K", "18K", "21K", "22K", "24K"],
      condition: { field: "material", includes: ["Gold"] }
    },
    { key: "length", type: "range", label: "Length (cm)" }
  ],
  "Earrings": [
    {
      key: "subcategory",
      type: "multi-select",
      label: "Earring Type",
      options: ["Stud earrings", "Drop earrings", "English lock earrings", "Hoop earrings", "Chandelier earrings"]
    },
    {
      key: "material",
      type: "multi-select",
      label: "Material",
      options: ["Gold", "Platinum", "Silver"]
    },
    {
      key: "gold_color",
      type: "multi-select",
      label: "Gold Color",
      options: ["White", "Rose", "Yellow"],
      condition: { field: "material", includes: ["Gold"] }
    },
    {
      key: "gold_karat",
      type: "multi-select",
      label: "Gold Karat",
      options: ["9K", "10K", "14K", "18K", "21K", "22K", "24K"],
      condition: { field: "material", includes: ["Gold"] }
    },
    {
      key: "color",
      type: "multi-select",
      label: "Diamond Color",
      options: ["D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N-Z"]
    },
    {
      key: "clarity",
      type: "multi-select",
      label: "Diamond Clarity",
      options: ["FL", "IF", "VVS1", "VVS2", "VS1", "VS2", "SI1", "SI2", "I1", "I2", "I3"]
    },
    {
      key: "certification",
      type: "multi-select",
      label: "Certification",
      options: ["GIA", "IGI", "HRD", "EGL", "SGL", "CGL", "IGL", "AIG"]
    }
  ],
  "Bracelet": [
    {
      key: "subcategory",
      type: "multi-select",
      label: "Bracelet Type",
      options: ["Tennis", "Bangle", "Armlet", "Bracelet"]
    },
    {
      key: "material",
      type: "multi-select",
      label: "Material",
      options: ["Gold", "Platinum", "Silver"]
    },
    {
      key: "gold_color",
      type: "multi-select",
      label: "Gold Color",
      options: ["White", "Rose", "Yellow"],
      condition: { field: "material", includes: ["Gold"] }
    },
    {
      key: "gold_karat",
      type: "multi-select",
      label: "Gold Karat",
      options: ["9K", "10K", "14K", "18K", "21K", "22K", "24K"],
      condition: { field: "material", includes: ["Gold"] }
    },
    { key: "length", type: "range", label: "Length (cm)" },
    {
      key: "color",
      type: "multi-select",
      label: "Diamond Color",
      options: ["D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N-Z"]
    },
    {
      key: "clarity",
      type: "multi-select",
      label: "Diamond Clarity",
      options: ["FL", "IF", "VVS1", "VVS2", "VS1", "VS2", "SI1", "SI2", "I1", "I2", "I3"]
    }
  ],
  "Special Pieces": [
    {
      key: "subcategory",
      type: "multi-select",
      label: "Special Piece Type",
      options: ["Crowns", "Cuff links", "Pins", "Belly chains"]
    },
    {
      key: "material",
      type: "multi-select",
      label: "Material",
      options: ["Gold", "Platinum", "Silver"]
    },
    {
      key: "gold_color",
      type: "multi-select",
      label: "Gold Color",
      options: ["White", "Rose", "Yellow"],
      condition: { field: "material", includes: ["Gold"] }
    },
    {
      key: "gold_karat",
      type: "multi-select",
      label: "Gold Karat",
      options: ["9K", "10K", "14K", "18K", "21K", "22K", "24K"],
      condition: { field: "material", includes: ["Gold"] }
    }
  ]
};

// Add price filter fields to all categories
const priceFilterFields: FilterField[] = [
  {
    key: "price_from",
    type: "number",
    label: "Price From ($)",
    min: 0,
    step: 1
  },
  {
    key: "price_to",
    type: "number",
    label: "Price To ($)",
    min: 0,
    step: 1
  }
];

type FilterParams = {
  category?: string;
  filters: {
    [key: string]: string[];
  };
};

type FilterModalProps = {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterParams) => void;
};

export default function FilterModal({
  visible,
  onClose,
  onApplyFilters,
}: FilterModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<{ [key: string]: string[] }>({});

  const resetFilters = () => {
    setSelectedCategory(null);
    setSelectedFilters({});
    onClose();
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setSelectedFilters({});
  };

  const handleFilterSelect = (fieldKey: string, value: string) => {
    setSelectedFilters(prev => {
      const currentValues = prev[fieldKey] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      
      return {
        ...prev,
        [fieldKey]: newValues,
      };
    });
  };

  const isFieldVisible = (field: FilterField) => {
    if (!field.condition) return true;
    const { field: conditionField, includes } = field.condition;
    const selectedValues = selectedFilters[conditionField] || [];
    return selectedValues.some(value => includes.includes(value));
  };

  const handleApplyFilters = () => {
    if (selectedCategory) {
      onApplyFilters({
        category: selectedCategory,
        filters: selectedFilters,
      });
    }
    onClose();
  };

  const renderFilterFields = () => {
    if (!selectedCategory) return null;

    const fields = filterFieldsByCategory[selectedCategory] || [];
    return (
      <>
        {fields.map(field => {
          if (!isFieldVisible(field)) return null;

          if (field.type === 'number') {
            return (
              <View key={field.key} style={styles.filterSection}>
                <Text style={styles.filterTitle}>{field.label}</Text>
                <TextInput
                  style={styles.numberInput}
                  keyboardType="numeric"
                  value={selectedFilters[field.key]?.[0] || ''}
                  onChangeText={(value) => {
                    const numValue = value === '' ? '' : parseFloat(value);
                    if (numValue === '' || (numValue >= (field.min || 0))) {
                      setSelectedFilters(prev => ({
                        ...prev,
                        [field.key]: value ? [value] : []
                      }));
                    }
                  }}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  placeholderTextColor="#666"
                />
              </View>
            );
          }

          return (
            <View key={field.key} style={styles.filterSection}>
              <Text style={styles.filterTitle}>{field.label}</Text>
              <View style={styles.filterOptions}>
                {field.options?.map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.filterOption,
                      selectedFilters[field.key]?.includes(option) && styles.filterOptionSelected,
                    ]}
                    onPress={() => handleFilterSelect(field.key, option)}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        selectedFilters[field.key]?.includes(option) && styles.filterOptionTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })}

        {/* Add price filter fields */}
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Price Range</Text>
          <View style={styles.priceInputContainer}>
            {priceFilterFields.map(field => (
              <View key={field.key} style={styles.priceInputWrapper}>
                <TextInput
                  style={styles.numberInput}
                  keyboardType="numeric"
                  value={selectedFilters[field.key]?.[0] || ''}
                  onChangeText={(value) => {
                    const numValue = value === '' ? '' : parseFloat(value);
                    if (numValue === '' || (numValue >= (field.min || 0))) {
                      setSelectedFilters(prev => ({
                        ...prev,
                        [field.key]: value ? [value] : []
                      }));
                    }
                  }}
                  placeholder={field.label}
                  placeholderTextColor="#666"
                />
              </View>
            ))}
          </View>
        </View>
      </>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Filter Options</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody}>
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Category</Text>
              <View style={styles.filterOptions}>
                {Object.keys(filterFieldsByCategory).map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.filterOption,
                      selectedCategory === category && styles.filterOptionSelected,
                    ]}
                    onPress={() => handleCategorySelect(category)}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        selectedCategory === category && styles.filterOptionTextSelected,
                      ]}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {renderFilterFields()}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
              <Text style={styles.resetButtonText}>Reset All</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.applyButton, !selectedCategory && styles.applyButtonDisabled]} 
              onPress={handleApplyFilters}
              disabled={!selectedCategory}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: '90%',
    width: '100%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    backgroundColor: '#1a1a1a',
    zIndex: 1,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Heebo-Bold',
    color: '#fff',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
  },
  modalBody: {
    flex: 1,
  },
  filterSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  filterTitle: {
    fontSize: 16,
    fontFamily: 'Heebo-Bold',
    color: '#fff',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
  },
  filterOptionSelected: {
    backgroundColor: '#6C5CE7',
  },
  filterOptionText: {
    fontSize: 14,
    fontFamily: 'Heebo-Medium',
    color: '#fff',
  },
  filterOptionTextSelected: {
    color: '#fff',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#1a1a1a',
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
  },
  resetButtonText: {
    fontSize: 16,
    fontFamily: 'Heebo-Medium',
    color: '#fff',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#6C5CE7',
  },
  applyButtonDisabled: {
    opacity: 0.5,
  },
  applyButtonText: {
    fontSize: 16,
    fontFamily: 'Heebo-Medium',
    color: '#fff',
  },
  numberInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Heebo-Regular',
    width: '100%',
  },
  priceInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  priceInputWrapper: {
    flex: 1,
  },
}); 