import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';
import { ChevronDown, X } from 'lucide-react-native';

const COLOR_GRADES = [
  'D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z',
];
const CLARITY_GRADES = [
  'I3','I2','I1','SI2','SI1','VS2','VS1','VVS2','VVS1','INTERNALLY'
];
const CUT_GRADES = [
  'POOR','FAIR','GOOD','VERY GOOD','EXCELLENT'
];
const CERTIFICATIONS = [
  'GIA','IGI','HRD','EGL','SGL','CGL','IGL','AIG'
];
const SIDE_STONES = [
  'With Side Stones','Without Side Stones'
];

interface DiamondFieldsProps {
  fields: Record<string, string>;
  errors: Record<string, boolean>;
  onChange: (key: string, value: string) => void;
  showModals: Record<string, boolean>;
  setShowModals: (modals: Record<string, boolean>) => void;
}

const DiamondFields: React.FC<DiamondFieldsProps> = ({ fields, errors, onChange, showModals, setShowModals }) => {
  const toggleModal = (key: string, value: boolean) => {
    setShowModals({ ...showModals, [key]: value });
  };
  return (
    <>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Diamond Weight (Carat)</Text>
        <TextInput
          style={styles.input}
          value={fields.diamond_weight || ''}
          onChangeText={text => onChange('diamond_weight', text.replace(/[^0-9.]/g, ''))}
          keyboardType="numeric"
          placeholder="Enter diamond weight in carat"
        />
      </View>
      {/* Color */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Diamond Color</Text>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => toggleModal('diamond_color', true)}
        >
          <Text style={styles.selectButtonText}>
            {fields.diamond_color || 'Select Diamond Color'}
          </Text>
          <ChevronDown size={20} color="#666" />
        </TouchableOpacity>
        <Modal
          visible={!!showModals.diamond_color}
          transparent
          animationType="slide"
          onRequestClose={() => toggleModal('diamond_color', false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Diamond Color</Text>
                <TouchableOpacity onPress={() => toggleModal('diamond_color', false)} style={styles.modalCloseButton}>
                  <X size={24} color="#000" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalScrollView}>
                {COLOR_GRADES.map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.modalOption, fields.diamond_color === option && styles.modalOptionSelected]}
                    onPress={() => {
                      onChange('diamond_color', option);
                      toggleModal('diamond_color', false);
                    }}
                  >
                    <Text style={[styles.modalOptionText, fields.diamond_color === option && styles.modalOptionTextSelected]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
      {/* Clarity */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Clarity</Text>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => toggleModal('clarity', true)}
        >
          <Text style={styles.selectButtonText}>
            {fields.clarity || 'Select Clarity'}
          </Text>
          <ChevronDown size={20} color="#666" />
        </TouchableOpacity>
        <Modal
          visible={!!showModals.clarity}
          transparent
          animationType="slide"
          onRequestClose={() => toggleModal('clarity', false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Clarity</Text>
                <TouchableOpacity onPress={() => toggleModal('clarity', false)} style={styles.modalCloseButton}>
                  <X size={24} color="#000" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalScrollView}>
                {CLARITY_GRADES.map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.modalOption, fields.clarity === option && styles.modalOptionSelected]}
                    onPress={() => {
                      onChange('clarity', option);
                      toggleModal('clarity', false);
                    }}
                  >
                    <Text style={[styles.modalOptionText, fields.clarity === option && styles.modalOptionTextSelected]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
      {/* Side Stones */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Side Stones</Text>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => toggleModal('side_stones', true)}
        >
          <Text style={styles.selectButtonText}>
            {fields.side_stones || 'Select Side Stones'}
          </Text>
          <ChevronDown size={20} color="#666" />
        </TouchableOpacity>
        <Modal
          visible={!!showModals.side_stones}
          transparent
          animationType="slide"
          onRequestClose={() => toggleModal('side_stones', false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Side Stones</Text>
                <TouchableOpacity onPress={() => toggleModal('side_stones', false)} style={styles.modalCloseButton}>
                  <X size={24} color="#000" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalScrollView}>
                {SIDE_STONES.map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.modalOption, fields.side_stones === option && styles.modalOptionSelected]}
                    onPress={() => {
                      onChange('side_stones', option);
                      toggleModal('side_stones', false);
                    }}
                  >
                    <Text style={[styles.modalOptionText, fields.side_stones === option && styles.modalOptionTextSelected]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
      {/* Cut Grade */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Cut Grade</Text>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => toggleModal('cut_grade', true)}
        >
          <Text style={styles.selectButtonText}>
            {fields.cut_grade || 'Select Cut Grade'}
          </Text>
          <ChevronDown size={20} color="#666" />
        </TouchableOpacity>
        <Modal
          visible={!!showModals.cut_grade}
          transparent
          animationType="slide"
          onRequestClose={() => toggleModal('cut_grade', false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Cut Grade</Text>
                <TouchableOpacity onPress={() => toggleModal('cut_grade', false)} style={styles.modalCloseButton}>
                  <X size={24} color="#000" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalScrollView}>
                {CUT_GRADES.map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.modalOption, fields.cut_grade === option && styles.modalOptionSelected]}
                    onPress={() => {
                      onChange('cut_grade', option);
                      toggleModal('cut_grade', false);
                    }}
                  >
                    <Text style={[styles.modalOptionText, fields.cut_grade === option && styles.modalOptionTextSelected]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
      {/* Certification */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Certification</Text>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => toggleModal('certification', true)}
        >
          <Text style={styles.selectButtonText}>
            {fields.certification || 'Select Certification'}
          </Text>
          <ChevronDown size={20} color="#666" />
        </TouchableOpacity>
        <Modal
          visible={!!showModals.certification}
          transparent
          animationType="slide"
          onRequestClose={() => toggleModal('certification', false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Certification</Text>
                <TouchableOpacity onPress={() => toggleModal('certification', false)} style={styles.modalCloseButton}>
                  <X size={24} color="#000" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalScrollView}>
                {CERTIFICATIONS.map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.modalOption, fields.certification === option && styles.modalOptionSelected]}
                    onPress={() => {
                      onChange('certification', option);
                      toggleModal('certification', false);
                    }}
                  >
                    <Text style={[styles.modalOptionText, fields.certification === option && styles.modalOptionTextSelected]}>
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
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Heebo-Regular',
    color: '#fff',
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

export default DiamondFields; 