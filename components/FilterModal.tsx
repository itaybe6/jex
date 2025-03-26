import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';

const CATEGORIES = ['Rings', 'Necklaces', 'Earrings', 'Bracelets', 'Loose Diamonds'];
const DIAMOND_SIZES = ['0.3-0.5', '0.5-1.0', '1.0-2.0', '2.0-3.0', '3.0+'];
const DIAMOND_COLORS = ['D', 'E', 'F', 'G', 'H', 'I'];
const DIAMOND_CLARITY = ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2'];

type FilterModalProps = {
  visible: boolean;
  onClose: () => void;
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  selectedDiamondSize: string | null;
  onSelectDiamondSize: (size: string | null) => void;
  selectedDiamondColor: string | null;
  onSelectDiamondColor: (color: string | null) => void;
  selectedDiamondClarity: string | null;
  onSelectDiamondClarity: (clarity: string | null) => void;
};

export default function FilterModal({
  visible,
  onClose,
  selectedCategory,
  onSelectCategory,
  selectedDiamondSize,
  onSelectDiamondSize,
  selectedDiamondColor,
  onSelectDiamondColor,
  selectedDiamondClarity,
  onSelectDiamondClarity,
}: FilterModalProps) {
  const resetFilters = () => {
    onSelectCategory(null);
    onSelectDiamondSize(null);
    onSelectDiamondColor(null);
    onSelectDiamondClarity(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>סינון</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>קטגוריה</Text>
              <View style={styles.filterOptions}>
                {CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.filterOption,
                      selectedCategory === category && styles.filterOptionSelected,
                    ]}
                    onPress={() => onSelectCategory(selectedCategory === category ? null : category)}
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

            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>גודל יהלום (קראט)</Text>
              <View style={styles.filterOptions}>
                {DIAMOND_SIZES.map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.filterOption,
                      selectedDiamondSize === size && styles.filterOptionSelected,
                    ]}
                    onPress={() => onSelectDiamondSize(selectedDiamondSize === size ? null : size)}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        selectedDiamondSize === size && styles.filterOptionTextSelected,
                      ]}
                    >
                      {size}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>צבע יהלום</Text>
              <View style={styles.filterOptions}>
                {DIAMOND_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.filterOption,
                      selectedDiamondColor === color && styles.filterOptionSelected,
                    ]}
                    onPress={() => onSelectDiamondColor(selectedDiamondColor === color ? null : color)}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        selectedDiamondColor === color && styles.filterOptionTextSelected,
                      ]}
                    >
                      {color}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>ניקיון יהלום</Text>
              <View style={styles.filterOptions}>
                {DIAMOND_CLARITY.map((clarity) => (
                  <TouchableOpacity
                    key={clarity}
                    style={[
                      styles.filterOption,
                      selectedDiamondClarity === clarity && styles.filterOptionSelected,
                    ]}
                    onPress={() => onSelectDiamondClarity(selectedDiamondClarity === clarity ? null : clarity)}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        selectedDiamondClarity === clarity && styles.filterOptionTextSelected,
                      ]}
                    >
                      {clarity}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
              <Text style={styles.resetButtonText}>נקה הכל</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Heebo-Bold',
  },
  modalBody: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterTitle: {
    fontSize: 16,
    fontFamily: 'Heebo-Bold',
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
    backgroundColor: '#f5f5f5',
  },
  filterOptionSelected: {
    backgroundColor: '#6C5CE7',
  },
  filterOptionText: {
    fontSize: 14,
    fontFamily: 'Heebo-Medium',
    color: '#666',
  },
  filterOptionTextSelected: {
    color: '#fff',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  resetButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  resetButtonText: {
    fontSize: 16,
    fontFamily: 'Heebo-Medium',
    color: '#666',
  },
}); 