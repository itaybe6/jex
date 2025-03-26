import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, Alert, Platform, Modal } from 'react-native';
import { Camera, X, ChevronDown } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

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
] as const;

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
] as const;

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
] as const;

const PRODUCT_TYPES = [
  'Loose Diamond',
  'Ring',
  'Necklace',
  'Bracelet',
  'Earrings',
  'Pendant',
] as const;

const WEIGHT_OPTIONS = Array.from({ length: 46 }, (_, i) => (0.5 + i * 0.1).toFixed(1));

type DiamondCut = typeof DIAMOND_CUTS[number];
type ProductType = typeof PRODUCT_TYPES[number];
type ClarityGrade = typeof CLARITY_GRADES[number];
type ColorGrade = typeof COLOR_GRADES[number];

export default function AddProductScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    description: '',
    category: '',
    weight: '',
    clarity: '',
    color: '',
    cut: '',
  });

  const [imageUri, setImageUri] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCutModal, setShowCutModal] = useState(false);
  const [showClarityModal, setShowClarityModal] = useState(false);
  const [showColorModal, setShowColorModal] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);

  const isLooseDiamond = formData.category === 'Loose Diamond';

  const pickImage = async () => {
    try {
      // Request permissions first on iOS
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'נדרשת הרשאה',
            'אנחנו צריכים הרשאה לגלריה כדי לאפשר לך להעלות תמונות',
            [{ text: 'הבנתי' }]
          );
          return;
        }
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        if (asset.base64) {
          setImageUri(asset.uri);
          setImageBase64(asset.base64);
        } else {
          throw new Error('Could not get base64 data');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(
        'שגיאה',
        'אירעה שגיאה בבחירת התמונה. נסה שוב.',
        [{ text: 'אישור' }]
      );
    }
  };

  const uploadImage = async () => {
    if (!imageBase64) return null;

    try {
      const fileName = `${user?.id}/${Date.now()}.jpg`;
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, decode(imageBase64), {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    try {
      if (!user) {
        Alert.alert('שגיאה', 'יש להתחבר כדי להוסיף מוצר');
        return;
      }

      const requiredFields = ['title', 'price', 'description', 'category'];
      const missingFields = [];

      for (const field of requiredFields) {
        if (!formData[field]) {
          missingFields.push(field);
        }
      }

      if (formData.price && isNaN(parseFloat(formData.price))) {
        Alert.alert('שגיאה', 'נא להזין מחיר תקין');
        return;
      }

      if (isLooseDiamond) {
        if (!formData.weight) missingFields.push('weight');
        if (!formData.clarity) missingFields.push('clarity');
        if (!formData.color) missingFields.push('color');
        if (!formData.cut) missingFields.push('cut');
      }

      if (!imageUri) {
        missingFields.push('image');
      }

      if (missingFields.length > 0) {
        const fieldNames = {
          title: 'שם המוצר',
          price: 'מחיר',
          description: 'תיאור',
          category: 'סוג מוצר',
          weight: 'משקל',
          clarity: 'ניקיון',
          color: 'צבע',
          cut: 'חיתוך',
          image: 'תמונה'
        };
        
        const missingFieldsHebrew = missingFields.map(field => fieldNames[field]).join(', ');
        Alert.alert('שגיאה', `נא למלא את כל שדות החובה: ${missingFieldsHebrew}`);
        return;
      }

      setLoading(true);

      const imageUrl = await uploadImage();
      if (!imageUrl) throw new Error('Failed to upload image');

      const { error } = await supabase.from('products').insert({
        title: formData.title,
        price: parseFloat(formData.price),
        description: formData.description,
        category: formData.category,
        image_url: imageUrl,
        user_id: user.id,
        details: {
          weight: formData.weight,
          clarity: formData.clarity,
          color: formData.color,
          cut: formData.cut,
        },
      });

      if (error) throw error;

      Alert.alert('הצלחה', 'המוצר נוסף בהצלחה', [
        { 
          text: 'אישור', 
          onPress: () => {
            // Navigate to profile tab and reset the navigation stack
            router.replace('/(tabs)');
            router.push('/(tabs)/profile');
          }
        }
      ]);
    } catch (error) {
      console.error('Error creating product:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה בהוספת המוצר. נסה שוב מאוחר יותר.');
    } finally {
      setLoading(false);
    }
  };

  const SelectionModal = ({ 
    visible, 
    onClose, 
    title, 
    options, 
    onSelect,
    selected,
    isWeight = false
  }: { 
    visible: boolean; 
    onClose: () => void; 
    title: string;
    options: readonly string[];
    onSelect: (value: string) => void;
    selected: string;
    isWeight?: boolean;
  }) => (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <X size={24} color="#000" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalScrollView}>
            {options.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.modalOption,
                  selected === option && styles.modalOptionSelected
                ]}
                onPress={() => {
                  onSelect(option);
                  onClose();
                }}
              >
                <Text style={[
                  styles.modalOptionText,
                  selected === option && styles.modalOptionTextSelected
                ]}>
                  {isWeight ? `${option} קראט` : option}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageSection}>
        {imageUri ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.image} />
            <TouchableOpacity 
              style={styles.removeImageButton}
              onPress={() => {
                setImageUri('');
                setImageBase64('');
              }}
            >
              <X size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.uploadButton}
            onPress={pickImage}
          >
            <Camera size={32} color="#007AFF" />
            <Text style={styles.uploadText}>העלה תמונה</Text>
            <Text style={styles.uploadSubtext}>לחץ כאן לבחירת תמונה מהגלריה</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>סוג מוצר</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowCategoryModal(true)}
          >
            <Text style={styles.selectButtonText}>
              {formData.category || 'בחר סוג מוצר'}
            </Text>
            <ChevronDown size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>שם המוצר</Text>
          <TextInput
            style={styles.input}
            value={formData.title}
            onChangeText={(text) => setFormData({ ...formData, title: text })}
            placeholder={isLooseDiamond ? "לדוגמה: יהלום עגול 1 קראט" : "לדוגמה: טבעת יהלום סוליטר"}
            textAlign="right"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>מחיר</Text>
          <TextInput
            style={styles.input}
            value={formData.price}
            onChangeText={(text) => setFormData({ ...formData, price: text })}
            placeholder="הזן מחיר בדולרים"
            keyboardType="numeric"
            textAlign="right"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>תיאור</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            placeholder={isLooseDiamond ? "תאר את היהלום..." : "תאר את המוצר..."}
            multiline
            numberOfLines={4}
            textAlign="right"
            textAlignVertical="top"
          />
        </View>

        <Text style={styles.sectionTitle}>מפרט טכני</Text>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, isLooseDiamond && styles.requiredField]}>משקל (קראט)</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowWeightModal(true)}
          >
            <Text style={styles.selectButtonText}>
              {formData.weight ? `${formData.weight} קראט` : 'בחר משקל'}
            </Text>
            <ChevronDown size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, isLooseDiamond && styles.requiredField]}>ניקיון</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowClarityModal(true)}
          >
            <Text style={styles.selectButtonText}>
              {formData.clarity || 'בחר דרגת ניקיון'}
            </Text>
            <ChevronDown size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, isLooseDiamond && styles.requiredField]}>צבע</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowColorModal(true)}
          >
            <Text style={styles.selectButtonText}>
              {formData.color || 'בחר דרגת צבע'}
            </Text>
            <ChevronDown size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, isLooseDiamond && styles.requiredField]}>חיתוך</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowCutModal(true)}
          >
            <Text style={styles.selectButtonText}>
              {formData.cut || 'בחר סוג חיתוך'}
            </Text>
            <ChevronDown size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'מוסיף מוצר...' : 'פרסם מוצר'}
          </Text>
        </TouchableOpacity>
      </View>

      <SelectionModal
        visible={showWeightModal}
        onClose={() => setShowWeightModal(false)}
        title="בחר משקל"
        options={WEIGHT_OPTIONS}
        onSelect={(value) => setFormData({ ...formData, weight: value })}
        selected={formData.weight}
        isWeight={true}
      />

      <SelectionModal
        visible={showCutModal}
        onClose={() => setShowCutModal(false)}
        title="בחר סוג חיתוך"
        options={DIAMOND_CUTS}
        onSelect={(value) => setFormData({ ...formData, cut: value })}
        selected={formData.cut}
      />

      <SelectionModal
        visible={showClarityModal}
        onClose={() => setShowClarityModal(false)}
        title="בחר דרגת ניקיון"
        options={CLARITY_GRADES}
        onSelect={(value) => setFormData({ ...formData, clarity: value })}
        selected={formData.clarity}
      />

      <SelectionModal
        visible={showColorModal}
        onClose={() => setShowColorModal(false)}
        title="בחר דרגת צבע"
        options={COLOR_GRADES}
        onSelect={(value) => setFormData({ ...formData, color: value })}
        selected={formData.color}
      />

      <SelectionModal
        visible={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title="בחר סוג מוצר"
        options={PRODUCT_TYPES}
        onSelect={(value) => setFormData({ ...formData, category: value })}
        selected={formData.category}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  imageSection: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  uploadButton: {
    width: '100%',
    height: 200,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  uploadText: {
    marginTop: 12,
    fontSize: 16,
    color: '#007AFF',
    fontFamily: 'Heebo-Medium',
  },
  uploadSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: '#666',
    fontFamily: 'Heebo-Regular',
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'right',
    fontFamily: 'Heebo-Medium',
  },
  requiredField: {
    color: '#007AFF',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Heebo-Regular',
  },
  selectButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectButtonText: {
    fontSize: 16,
    fontFamily: 'Heebo-Regular',
    color: '#000',
    textAlign: 'right',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Heebo-Bold',
    marginBottom: 16,
    marginTop: 8,
    textAlign: 'right',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 32,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Heebo-Medium',
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
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Heebo-Bold',
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
    textAlign: 'right',
  },
  modalOptionTextSelected: {
    color: '#fff',
  },
});