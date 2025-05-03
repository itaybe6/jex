import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface GoldOptionsProps {
  karat: string;
  color: string;
  onKaratSelect: (value: string) => void;
  onColorSelect: (value: string) => void;
  karatError?: boolean;
  colorError?: boolean;
  showKaratModal: boolean;
  setShowKaratModal: (show: boolean) => void;
  showColorModal: boolean;
  setShowColorModal: (show: boolean) => void;
}

const KARAT_OPTIONS = ['9K', '10K', '14K', '18K', '21K', '22K', '24K'];
const COLOR_OPTIONS = ['White', 'Yellow', 'Rose'];

const GoldOptions: React.FC<GoldOptionsProps> = ({
  karat,
  color,
  onKaratSelect,
  onColorSelect,
  karatError,
  colorError,
  showKaratModal,
  setShowKaratModal,
  showColorModal,
  setShowColorModal
}) => {
  return (
    <>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Gold Karat</Text>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => setShowKaratModal(true)}
        >
          <Text style={styles.selectButtonText}>
            {karat || 'Select Gold Karat'}
          </Text>
          <Ionicons name="chevron-down" size={24} color="black" />
        </TouchableOpacity>
        {karatError && <Text style={styles.errorText}>Required field</Text>}
        <Modal
          visible={showKaratModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowKaratModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Gold Karat</Text>
                <TouchableOpacity onPress={() => setShowKaratModal(false)} style={styles.modalCloseButton}>
                  <Ionicons name="close" size={24} color="black" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalScrollView}>
                {KARAT_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.modalOption, karat === option && styles.modalOptionSelected]}
                    onPress={() => {
                      onKaratSelect(option);
                      setShowKaratModal(false);
                    }}
                  >
                    <Text style={[styles.modalOptionText, karat === option && styles.modalOptionTextSelected]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Gold Color</Text>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => setShowColorModal(true)}
        >
          <Text style={styles.selectButtonText}>
            {color || 'Select Gold Color'}
          </Text>
          <Ionicons name="chevron-down" size={24} color="black" />
        </TouchableOpacity>
        {colorError && <Text style={styles.errorText}>Required field</Text>}
        <Modal
          visible={showColorModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowColorModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Gold Color</Text>
                <TouchableOpacity onPress={() => setShowColorModal(false)} style={styles.modalCloseButton}>
                  <Ionicons name="close" size={24} color="black" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalScrollView}>
                {COLOR_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.modalOption, color === option && styles.modalOptionSelected]}
                    onPress={() => {
                      onColorSelect(option);
                      setShowColorModal(false);
                    }}
                  >
                    <Text style={[styles.modalOptionText, color === option && styles.modalOptionTextSelected]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </>
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

export default GoldOptions; 