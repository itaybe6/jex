import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MaterialSectionProps {
  value: string;
  onSelect: (value: string) => void;
  error?: boolean;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
}

const MATERIAL_OPTIONS = ['Gold', 'Platinum', 'Silver'];

const MaterialSection: React.FC<MaterialSectionProps> = ({ value, onSelect, error, showModal, setShowModal }) => {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>Material</Text>
      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => setShowModal(true)}
      >
        <Text style={styles.selectButtonText}>
          {value || 'Select material'}
        </Text>
        <Ionicons name="chevron-down" size={24} color="black" />
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>Required field</Text>}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Material</Text>
              <TouchableOpacity onPress={() => setShowModal(false)} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color="black" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              {MATERIAL_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option}
                  style={[styles.modalOption, value === option && styles.modalOptionSelected]}
                  onPress={() => {
                    onSelect(option);
                    setShowModal(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, value === option && styles.modalOptionTextSelected]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'left',
    fontFamily: 'Heebo-Medium',
  },
  selectButton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectButtonText: {
    fontSize: 16,
    fontFamily: 'Heebo-Regular',
    color: '#fff',
    textAlign: 'left',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Heebo-Regular',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Heebo-Bold',
    color: '#fff',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalScrollView: {
    padding: 20,
  },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  modalOptionSelected: {
    backgroundColor: '#007AFF',
  },
  modalOptionText: {
    fontSize: 16,
    fontFamily: 'Heebo-Regular',
    textAlign: 'left',
    color: '#fff',
  },
  modalOptionTextSelected: {
    color: '#fff',
  },
});

export default MaterialSection; 