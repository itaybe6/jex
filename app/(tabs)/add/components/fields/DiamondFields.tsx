import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
const SHAPE_OPTIONS = [
  'Round', 'Princess', 'Oval', 'Cushion', 'Emerald', 'Asscher', 'Marquise', 'Radiant', 'Pear', 'Heart', 'Baguette', 'Trillion', 'Other'
];
const POLISH_OPTIONS = ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor'];
const SYMMETRY_OPTIONS = ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor'];
const FLUORESCENCE_OPTIONS = ['None', 'Faint', 'Medium', 'Strong'];

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
          <Ionicons name="chevron-down" size={20} color="#666" />
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
                  <Ionicons name="close" size={24} color="#000" />
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
          <Ionicons name="chevron-down" size={20} color="#666" />
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
                  <Ionicons name="close" size={24} color="#000" />
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
          <Ionicons name="chevron-down" size={20} color="#666" />
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
                  <Ionicons name="close" size={24} color="#000" />
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
          <Ionicons name="chevron-down" size={20} color="#666" />
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
                  <Ionicons name="close" size={24} color="#000" />
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
      {/* Shape */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Shape</Text>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => toggleModal('shape', true)}
        >
          <Text style={styles.selectButtonText}>
            {fields.shape || 'Select Shape'}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>
        <Modal
          visible={!!showModals.shape}
          transparent
          animationType="slide"
          onRequestClose={() => toggleModal('shape', false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Shape</Text>
                <TouchableOpacity onPress={() => toggleModal('shape', false)} style={styles.modalCloseButton}>
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalScrollView}>
                {SHAPE_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.modalOption, fields.shape === option && styles.modalOptionSelected]}
                    onPress={() => {
                      onChange('shape', option);
                      toggleModal('shape', false);
                    }}
                  >
                    <Text style={[styles.modalOptionText, fields.shape === option && styles.modalOptionTextSelected]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
      {/* Polish */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Polish</Text>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => toggleModal('polish', true)}
        >
          <Text style={styles.selectButtonText}>
            {fields.polish || 'Select Polish'}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>
        <Modal
          visible={!!showModals.polish}
          transparent
          animationType="slide"
          onRequestClose={() => toggleModal('polish', false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Polish</Text>
                <TouchableOpacity onPress={() => toggleModal('polish', false)} style={styles.modalCloseButton}>
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalScrollView}>
                {POLISH_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.modalOption, fields.polish === option && styles.modalOptionSelected]}
                    onPress={() => {
                      onChange('polish', option);
                      toggleModal('polish', false);
                    }}
                  >
                    <Text style={[styles.modalOptionText, fields.polish === option && styles.modalOptionTextSelected]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
      {/* Symmetry */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Symmetry</Text>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => toggleModal('symmetry', true)}
        >
          <Text style={styles.selectButtonText}>
            {fields.symmetry || 'Select Symmetry'}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>
        <Modal
          visible={!!showModals.symmetry}
          transparent
          animationType="slide"
          onRequestClose={() => toggleModal('symmetry', false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Symmetry</Text>
                <TouchableOpacity onPress={() => toggleModal('symmetry', false)} style={styles.modalCloseButton}>
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalScrollView}>
                {SYMMETRY_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.modalOption, fields.symmetry === option && styles.modalOptionSelected]}
                    onPress={() => {
                      onChange('symmetry', option);
                      toggleModal('symmetry', false);
                    }}
                  >
                    <Text style={[styles.modalOptionText, fields.symmetry === option && styles.modalOptionTextSelected]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
      {/* Fluorescence */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Fluorescence</Text>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => toggleModal('fluorescence', true)}
        >
          <Text style={styles.selectButtonText}>
            {fields.fluorescence || 'Select Fluorescence'}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>
        <Modal
          visible={!!showModals.fluorescence}
          transparent
          animationType="slide"
          onRequestClose={() => toggleModal('fluorescence', false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Fluorescence</Text>
                <TouchableOpacity onPress={() => toggleModal('fluorescence', false)} style={styles.modalCloseButton}>
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalScrollView}>
                {FLUORESCENCE_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.modalOption, fields.fluorescence === option && styles.modalOptionSelected]}
                    onPress={() => {
                      onChange('fluorescence', option);
                      toggleModal('fluorescence', false);
                    }}
                  >
                    <Text style={[styles.modalOptionText, fields.fluorescence === option && styles.modalOptionTextSelected]}>
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
    fontFamily: 'Montserrat-Medium',
  },
  input: {
    backgroundColor: '#F5F8FC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E3EAF3',
    padding: 14,
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
    color: '#0E2657',
  },
  selectButton: {
    backgroundColor: '#F5F8FC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E3EAF3',
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectButtonText: {
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
    color: '#0E2657',
    textAlign: 'left',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Montserrat-Regular',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
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
    borderBottomColor: '#E3EAF3',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    color: '#0E2657',
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
    backgroundColor: '#E3EAF3',
  },
  modalOptionText: {
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
    textAlign: 'left',
    color: '#0E2657',
  },
  modalOptionTextSelected: {
    color: '#007AFF',
    fontFamily: 'Montserrat-Bold',
  },
});

export default DiamondFields; 