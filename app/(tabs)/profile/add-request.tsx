import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Platform, Modal } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

const DIAMOND_CUTS = [
  'Round',
  'Princess',
  'Oval',
  'Marquise',
  'Pear',
  'Emerald',
  'Radiant',
  'Heart',
  'Cushion',
  'Asscher',
] as string[];

const CLARITY_GRADES = [
  'FL (Flawless)',
  'IF (Internally Flawless)',
  'VVS1 (Very Very Slightly Included 1)',
  'VVS2 (Very Very Slightly Included 2)',
  'VS1 (Very Slightly Included 1)',
  'VS2 (Very Slightly Included 2)',
  'SI1 (Slightly Included 1)',
  'SI2 (Slightly Included 2)',
  'I1 (Included 1)',
  'I2 (Included 2)',
  'I3 (Included 3)',
] as string[];

const COLOR_GRADES = [
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z',
] as string[];

const ALL_WEIGHT_OPTIONS = Array.from({ length: 46 }, (_, i) => (0.5 + i * 0.1).toFixed(1));

type FormData = {
  cut: string;
  min_weight: string;
  max_weight: string;
  clarity: string;
  color: string;
  status?: string;
  price?: string;
};

export default function AddRequestScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    cut: '',
    min_weight: '',
    max_weight: '',
    clarity: '',
    color: '',
    price: '',
  });

  const [showCutModal, setShowCutModal] = useState(false);
  const [showClarityModal, setShowClarityModal] = useState(false);
  const [showColorModal, setShowColorModal] = useState(false);
  const [showMinWeightModal, setShowMinWeightModal] = useState(false);
  const [showMaxWeightModal, setShowMaxWeightModal] = useState(false);

  const maxWeightOptions = useMemo(() => {
    if (!formData.min_weight) return ALL_WEIGHT_OPTIONS;
    
    const minWeightIndex = ALL_WEIGHT_OPTIONS.indexOf(formData.min_weight);
    if (minWeightIndex === -1) return ALL_WEIGHT_OPTIONS;
    
    return ALL_WEIGHT_OPTIONS.slice(minWeightIndex + 1);
  }, [formData.min_weight]);

  const handleMinWeightChange = (value: string) => {
    setFormData(prev => {
      const newFormData = { ...prev, min_weight: value };
      
      if (prev.max_weight && parseFloat(prev.max_weight) <= parseFloat(value)) {
        newFormData.max_weight = '';
      }
      
      return newFormData;
    });
  };

  const handleSubmit = async () => {
    try {
      if (!user?.id) {
        Alert.alert('שגיאה', 'יש להתחבר כדי להוסיף בקשה');
        return;
      }

      const requiredFields = ['cut', 'min_weight', 'clarity', 'color'] as const;
      const missingFields = [];

      for (const field of requiredFields) {
        if (!formData[field]) {
          missingFields.push(field);
        }
      }

      if (missingFields.length > 0) {
        Alert.alert(
          'שדות חסרים',
          `נא למלא את השדות הבאים: ${missingFields.join(', ')}`,
          [{ text: 'אישור' }]
        );
        return;
      }

      if (formData.min_weight && isNaN(parseFloat(formData.min_weight))) {
        Alert.alert('שגיאה', 'נא להזין משקל מינימלי תקין');
        return;
      }

      if (formData.max_weight && isNaN(parseFloat(formData.max_weight))) {
        Alert.alert('שגיאה', 'נא להזין משקל מקסימלי תקין');
        return;
      }

      if (formData.price && isNaN(parseFloat(formData.price))) {
        Alert.alert('שגיאה', 'נא להזין מחיר תקין');
        return;
      }

      setLoading(true);

      const requestData = {
        user_id: user.id,
        cut: formData.cut,
        min_weight: formData.min_weight ? parseFloat(formData.min_weight) : null,
        max_weight: formData.max_weight ? parseFloat(formData.max_weight) : null,
        clarity: formData.clarity,
        color: formData.color,
        price: formData.price ? parseFloat(formData.price) : null,
        status: 'active',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
      };

      console.log('Sending request data:', requestData);

      const { data, error } = await supabase
        .from('diamond_requests')
        .insert(requestData)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Request added successfully:', data);

      Alert.alert(
        'הצלחה',
        'הבקשה נוספה בהצלחה',
        [{ text: 'אישור', onPress: () => router.back() }]
      );
    } catch (error: any) {
      console.error('Error adding request:', error);
      Alert.alert(
        'שגיאה',
        error?.message || 'אירעה שגיאה בהוספת הבקשה. נסה שוב.',
        [{ text: 'אישור' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const renderModal = (
    visible: boolean,
    onClose: () => void,
    title: string,
    options: string[],
    onSelect: (value: string) => void,
    selectedValue: string
  ) => (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <ChevronDown size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalOptions}>
            {options.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.modalOption,
                  selectedValue === option && styles.modalOptionSelected,
                ]}
                onPress={() => {
                  onSelect(option);
                  onClose();
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    selectedValue === option && styles.modalOptionTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.form}>
        <Text style={styles.label}>חיתוך</Text>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => setShowCutModal(true)}
        >
          <Text style={styles.selectButtonText}>
            {formData.cut || 'בחר חיתוך'}
          </Text>
          <ChevronDown size={20} color="#666" />
        </TouchableOpacity>

        <Text style={styles.label}>משקל מינימלי (קראט)</Text>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => setShowMinWeightModal(true)}
        >
          <Text style={styles.selectButtonText}>
            {formData.min_weight || 'בחר משקל מינימלי'}
          </Text>
          <ChevronDown size={20} color="#666" />
        </TouchableOpacity>

        <Text style={styles.label}>משקל מקסימלי (קראט)</Text>
        <TouchableOpacity
          style={[
            styles.selectButton,
            !formData.min_weight && styles.selectButtonDisabled
          ]}
          onPress={() => formData.min_weight && setShowMaxWeightModal(true)}
        >
          <Text style={[
            styles.selectButtonText,
            !formData.min_weight && styles.selectButtonTextDisabled
          ]}>
            {!formData.min_weight 
              ? 'יש לבחור משקל מינימלי תחילה'
              : formData.max_weight || 'בחר משקל מקסימלי'}
          </Text>
          <ChevronDown size={20} color={formData.min_weight ? '#666' : '#444'} />
        </TouchableOpacity>

        <Text style={styles.label}>ניקיון</Text>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => setShowClarityModal(true)}
        >
          <Text style={styles.selectButtonText}>
            {formData.clarity || 'בחר ניקיון'}
          </Text>
          <ChevronDown size={20} color="#666" />
        </TouchableOpacity>

        <Text style={styles.label}>צבע</Text>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => setShowColorModal(true)}
        >
          <Text style={styles.selectButtonText}>
            {formData.color || 'בחר צבע'}
          </Text>
          <ChevronDown size={20} color="#666" />
        </TouchableOpacity>

        <Text style={styles.label}>מחיר מקסימלי (אופציונלי)</Text>
        <TextInput
          style={styles.input}
          value={formData.price}
          onChangeText={(text) => setFormData({ ...formData, price: text })}
          placeholder="מחיר מקסימלי"
          placeholderTextColor="#666"
          keyboardType="numeric"
        />

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'מוסיף...' : 'הוסף בקשה'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {renderModal(
        showCutModal,
        () => setShowCutModal(false),
        'בחר חיתוך',
        DIAMOND_CUTS,
        (value) => setFormData({ ...formData, cut: value }),
        formData.cut
      )}

      {renderModal(
        showMinWeightModal,
        () => setShowMinWeightModal(false),
        'בחר משקל מינימלי',
        ALL_WEIGHT_OPTIONS,
        handleMinWeightChange,
        formData.min_weight
      )}

      {renderModal(
        showMaxWeightModal,
        () => setShowMaxWeightModal(false),
        'בחר משקל מקסימלי',
        maxWeightOptions,
        (value) => setFormData({ ...formData, max_weight: value }),
        formData.max_weight
      )}

      {renderModal(
        showClarityModal,
        () => setShowClarityModal(false),
        'בחר ניקיון',
        CLARITY_GRADES,
        (value) => setFormData({ ...formData, clarity: value }),
        formData.clarity
      )}

      {renderModal(
        showColorModal,
        () => setShowColorModal(false),
        'בחר צבע',
        COLOR_GRADES,
        (value) => setFormData({ ...formData, color: value }),
        formData.color
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  form: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#111',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'right',
  },
  selectButton: {
    backgroundColor: '#111',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#6C5CE7',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#111',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalOptions: {
    maxHeight: 400,
  },
  modalOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalOptionSelected: {
    backgroundColor: '#6C5CE7',
  },
  modalOptionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'right',
  },
  modalOptionTextSelected: {
    color: '#fff',
  },
  selectButtonDisabled: {
    opacity: 0.5,
  },
  selectButtonTextDisabled: {
    color: '#444',
  },
}); 