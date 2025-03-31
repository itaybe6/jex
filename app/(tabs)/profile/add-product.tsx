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
  const [errors, setErrors] = useState<Record<string, boolean>>({});
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
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'We need access to your gallery to upload images',
            [{ text: 'OK' }]
          );
          return;
        }
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
        'Error',
        'An error occurred while selecting the image. Please try again.',
        [{ text: 'OK' }]
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
      if (!user?.id) {
        Alert.alert('Error', 'You must be logged in to add a product');
        return;
      }

      setLoading(true);
      
      // Reset errors
      setErrors({});
      
      // Validate required fields
      const requiredFields = ['title', 'price', 'description', 'category'] as const;
      const missingFields: string[] = [];
      const newErrors: Record<string, boolean> = {};

      for (const field of requiredFields) {
        if (!formData[field]) {
          missingFields.push(field);
          newErrors[field] = true;
        }
      }

      // Validate price
      if (formData.price && isNaN(parseFloat(formData.price))) {
        newErrors.price = true;
        Alert.alert('Error', 'Please enter a valid price');
        setLoading(false);
        setErrors(newErrors);
        return;
      }

      // Check diamond fields if it's a loose diamond
      if (formData.category === 'Loose Diamond') {
        const diamondFields = ['weight', 'clarity', 'color', 'cut'] as const;
        for (const field of diamondFields) {
          if (!formData[field]) {
            missingFields.push(field);
            newErrors[field] = true;
          }
        }
      }

      // Check image
      if (!imageUri) {
        missingFields.push('image');
        newErrors.image = true;
      }

      if (missingFields.length > 0) {
        const fieldNames: Record<string, string> = {
          title: 'Product Name',
          price: 'Price',
          description: 'Description',
          category: 'Product Type',
          weight: 'Weight',
          clarity: 'Clarity',
          color: 'Color',
          cut: 'Cut',
          image: 'Image'
        };
        
        setErrors(newErrors);
        Alert.alert(
          'Missing Fields',
          `Please fill in all required fields: ${missingFields.map(field => fieldNames[field]).join(', ')}`
        );
        setLoading(false);
        return;
      }

      // Upload image first
      const imageUrl = await uploadImage();
      if (!imageUrl) {
        Alert.alert('Error', 'Failed to upload image. Please try again.');
        setLoading(false);
        return;
      }

      // Create the product
      const productData = {
        title: formData.title,
        price: parseFloat(formData.price),
        description: formData.description,
        category: formData.category,
        image_url: imageUrl,
        user_id: user.id,
        details: formData.category === 'Loose Diamond' ? {
          weight: formData.weight,
          clarity: formData.clarity,
          color: formData.color,
          cut: formData.cut,
        } : null,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        Alert.alert('Error', 'Failed to create product. Please try again.');
        setLoading(false);
        return;
      }

      setLoading(false);
      router.replace('/(tabs)');
      
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      Alert.alert('Error', 'An error occurred while adding the product. Please try again.');
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
                  {isWeight ? `${option} Carat` : option}
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
            <Text style={styles.uploadText}>Upload Image</Text>
            <Text style={styles.uploadSubtext}>Tap here to select an image from gallery</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Product Type</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowCategoryModal(true)}
          >
            <Text style={styles.selectButtonText}>
              {formData.category || 'Select product type'}
            </Text>
            <ChevronDown size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Product Name</Text>
          <TextInput
            style={styles.input}
            value={formData.title}
            onChangeText={(text) => setFormData({ ...formData, title: text })}
            placeholder={isLooseDiamond ? "Example: 1 Carat Round Diamond" : "Example: Solitaire Diamond Ring"}
            textAlign="left"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Price</Text>
          <TextInput
            style={styles.input}
            value={formData.price}
            onChangeText={(text) => setFormData({ ...formData, price: text })}
            placeholder="Enter price in USD"
            keyboardType="numeric"
            textAlign="left"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            placeholder={isLooseDiamond ? "Describe the diamond..." : "Describe the product..."}
            multiline
            numberOfLines={4}
            textAlign="left"
            textAlignVertical="top"
          />
        </View>

        <Text style={styles.sectionTitle}>Technical Specifications</Text>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, isLooseDiamond && styles.requiredField]}>Weight (Carat)</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowWeightModal(true)}
          >
            <Text style={styles.selectButtonText}>
              {formData.weight ? `${formData.weight} Carat` : 'Select weight'}
            </Text>
            <ChevronDown size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, isLooseDiamond && styles.requiredField]}>Clarity</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowClarityModal(true)}
          >
            <Text style={styles.selectButtonText}>
              {formData.clarity || 'Select clarity grade'}
            </Text>
            <ChevronDown size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, isLooseDiamond && styles.requiredField]}>Color</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowColorModal(true)}
          >
            <Text style={styles.selectButtonText}>
              {formData.color || 'Select color grade'}
            </Text>
            <ChevronDown size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, isLooseDiamond && styles.requiredField]}>Cut</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowCutModal(true)}
          >
            <Text style={styles.selectButtonText}>
              {formData.cut || 'Select cut type'}
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
            {loading ? 'Adding product...' : 'Publish Product'}
          </Text>
        </TouchableOpacity>
      </View>

      <SelectionModal
        visible={showWeightModal}
        onClose={() => setShowWeightModal(false)}
        title="Select Weight"
        options={WEIGHT_OPTIONS}
        onSelect={(value) => setFormData({ ...formData, weight: value })}
        selected={formData.weight}
        isWeight={true}
      />

      <SelectionModal
        visible={showCutModal}
        onClose={() => setShowCutModal(false)}
        title="Select Cut Type"
        options={DIAMOND_CUTS}
        onSelect={(value) => setFormData({ ...formData, cut: value })}
        selected={formData.cut}
      />

      <SelectionModal
        visible={showClarityModal}
        onClose={() => setShowClarityModal(false)}
        title="Select Clarity Grade"
        options={CLARITY_GRADES}
        onSelect={(value) => setFormData({ ...formData, clarity: value })}
        selected={formData.clarity}
      />

      <SelectionModal
        visible={showColorModal}
        onClose={() => setShowColorModal(false)}
        title="Select Color Grade"
        options={COLOR_GRADES}
        onSelect={(value) => setFormData({ ...formData, color: value })}
        selected={formData.color}
      />

      <SelectionModal
        visible={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title="Select Product Type"
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
    textAlign: 'left',
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
    textAlign: 'left',
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
    textAlign: 'left',
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
    textAlign: 'left',
  },
  modalOptionTextSelected: {
    color: '#fff',
  },
});