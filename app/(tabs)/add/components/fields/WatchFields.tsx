import React from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface WatchFieldsProps {
  brand: string;
  model: string;
  diameter: string;
  onBrandSelect: (value: string) => void;
  onModelSelect: (value: string) => void;
  onDiameterChange: (value: string) => void;
  brandOptions: string[];
  modelOptions: string[];
  showBrandModal: boolean;
  setShowBrandModal: (show: boolean) => void;
  showModelModal: boolean;
  setShowModelModal: (show: boolean) => void;
  errors: Record<string, boolean>;
}

const WatchFields: React.FC<WatchFieldsProps> = ({
  brand,
  model,
  diameter,
  onBrandSelect,
  onModelSelect,
  onDiameterChange,
  brandOptions,
  modelOptions,
  showBrandModal,
  setShowBrandModal,
  showModelModal,
  setShowModelModal,
  errors
}) => {
  return (
    <>
      {/* Brand */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Brand</Text>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => setShowBrandModal(true)}
        >
          <Text style={styles.selectButtonText}>
            {brand || 'Select brand'}
          </Text>
          <Ionicons name="chevron-down" size={24} color="black" />
        </TouchableOpacity>
        {errors.brand && <Text style={styles.errorText}>Required field</Text>}
        <Modal
          visible={showBrandModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowBrandModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Brand</Text>
                <TouchableOpacity onPress={() => setShowBrandModal(false)} style={styles.modalCloseButton}>
                  <Ionicons name="close" size={24} color="black" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalScrollView}>
                {brandOptions.map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.modalOption, brand === option && styles.modalOptionSelected]}
                    onPress={() => {
                      onBrandSelect(option);
                      setShowBrandModal(false);
                    }}
                  >
                    <Text style={[styles.modalOptionText, brand === option && styles.modalOptionTextSelected]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
      {/* Model */}
      {brand && (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Model</Text>
          {modelOptions.length > 0 ? (
            <>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setShowModelModal(true)}
              >
                <Text style={styles.selectButtonText}>
                  {model || 'Select model'}
                </Text>
                <Ionicons name="chevron-down" size={24} color="black" />
              </TouchableOpacity>
              {errors.model && <Text style={styles.errorText}>Required field</Text>}
              <Modal
                visible={showModelModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowModelModal(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>Select Model</Text>
                      <TouchableOpacity onPress={() => setShowModelModal(false)} style={styles.modalCloseButton}>
                        <Ionicons name="close" size={24} color="black" />
                      </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.modalScrollView}>
                      {modelOptions.map(option => (
                        <TouchableOpacity
                          key={option}
                          style={[styles.modalOption, model === option && styles.modalOptionSelected]}
                          onPress={() => {
                            onModelSelect(option);
                            setShowModelModal(false);
                          }}
                        >
                          <Text style={[styles.modalOptionText, model === option && styles.modalOptionTextSelected]}>
                            {option}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              </Modal>
            </>
          ) : (
            <TextInput
              style={styles.input}
              value={model}
              onChangeText={onModelSelect}
              placeholder="Enter watch model"
            />
          )}
          {errors.model && <Text style={styles.errorText}>Required field</Text>}
        </View>
      )}
      {/* Diameter */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Diameter (mm)</Text>
        <TextInput
          style={styles.input}
          value={diameter}
          onChangeText={text => {
            const sanitized = text.replace(/[^0-9.]/g, '');
            const parts = sanitized.split('.');
            if (parts.length > 2) return;
            if (parts[1]?.length > 1) return;
            onDiameterChange(sanitized);
          }}
          keyboardType="numeric"
          placeholder="Enter watch diameter"
        />
        {errors.diameter && <Text style={styles.errorText}>Required field / Invalid number</Text>}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#0E2657',
    fontSize: 16,
    marginBottom: 8,
    fontFamily: 'Montserrat-Medium',
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
    fontFamily: 'Montserrat-Regular',
    color: '#fff',
    textAlign: 'left',
  },
  input: {
    backgroundColor: '#F5F8FC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E3EAF3',
    padding: 12,
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
    color: '#0E2657',
  },
  errorText: {
    color: '#FF3B30',
    marginTop: 4,
    marginBottom: 8,
    fontFamily: 'Montserrat-Regular',
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
    fontFamily: 'Montserrat-Bold',
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
    fontFamily: 'Montserrat-Regular',
    textAlign: 'left',
    color: '#fff',
  },
  modalOptionTextSelected: {
    color: '#fff',
  },
});

export default WatchFields; 