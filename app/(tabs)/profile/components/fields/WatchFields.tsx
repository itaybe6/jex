import React from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, ScrollView, StyleSheet } from 'react-native';
import { ChevronDown, X } from 'lucide-react-native';

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
          <ChevronDown size={20} color="#666" />
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
                  <X size={24} color="#000" />
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
                <ChevronDown size={20} color="#666" />
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
                        <X size={24} color="#000" />
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
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Heebo-Regular',
    color: '#fff',
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

export default WatchFields; 