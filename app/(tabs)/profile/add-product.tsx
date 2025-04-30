import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, Alert, Platform, Modal } from 'react-native';
import { Camera, X, ChevronDown } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import watchModels from '@/lib/watch-models.json';

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
  'I3',
  'I2',
  'I1',
  'SI2',
  'SI1',
  'VS2',
  'VS1',
  'VVS2',
  'VVS1',
  'INTERNALLY'
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
  'Ring',
  'Necklace',
  'Bracelet',
  'Earrings',
  'Special pieces',
  'Watches',
  'Gems'
] as const;

const WEIGHT_OPTIONS = Array.from({ length: 46 }, (_, i) => (0.5 + i * 0.1).toFixed(1));

const productOptions: Record<string, string[]> = {
  "Ring": [
    "Wedding ring",
    "Hand Chain Ring - Bracelet",
    "Classic ring",
    "Engagement ring",
    "Solitaire ring",
    "All around ring",
    "Band ring"
  ],
  "Necklace": [
    "Pendant",
    "Chain",
    "Cuban links"
  ],
  "Earrings": [
    "Stud earrings",
    "Drop earrings",
    "English lock earrings",
    "Hoop earrings",
    "Chandelier earrings"
  ],
  "Bracelet": [
    "Tennis",
    "Bangle",
    "Armlet",
    "Bracelet"
  ],
  "Special pieces": [
    "Crowns",
    "Cuff links",
    "Pins",
    "Belly chains"
  ],
  "Gems": [
    "Certificated",
    "None Certificated",
    "Natural",
    "Lab Grown",
    "Treated"
  ],
  "Watches": [
    "Rolex", "Omega", "Breitling", "IWC", "Tag Heuer", "Panerai", "Hublot",
    "Audemards Piguet", "Cartier", "Patek Philippe", "Zenith", "Tudor",
    "Chopard", "Bulgari", "Richard Mille"
  ]
};

const baseRingFields = [
  { label: "Material", type: "select", key: "material", options: ["Gold", "Platinum", "Silver"] },
  { label: "Gold Karat", type: "select", key: "goldKarat", options: ["9K", "10K", "14K", "18K", "21K", "22K", "24K"], condition: "material == 'Gold'" },
  { label: "Diamond Color", type: "select", key: "diamond_color", options: COLOR_GRADES },
  { label: "Clarity", type: "select", key: "clarity", options: ["I3", "I2", "I1", "SI2", "SI1", "VS2", "VS1", "VVS2", "VVS1", "INTERNALLY"] },
  { label: "Side Stones", type: "select", key: "side_stones", options: ["With Side Stones", "Without Side Stones"] },
  { label: "Cut Grade", type: "select", key: "cut_grade", options: ["POOR", "FAIR", "GOOD", "VERY GOOD", "EXCELLENT"] },
  { label: "Certification", type: "select", key: "certification", options: ["GIA", "IGI", "HRD", "EGL", "SGL", "CGL", "IGL", "AIG"] }
];

const productFieldsMap: Record<string, any[]> = {
  "Ring": baseRingFields,
  "Necklace": baseRingFields,
  "Earrings": baseRingFields,
  "Bracelet": baseRingFields,
  "Special pieces": baseRingFields,
  "Gems": [
    { label: "Certification", type: "select", key: "certification", options: ["GIA", "IGI", "None"] }
  ],
  "Watches": [
    { label: "Brand", type: "text", key: "brand" },
    { label: "Model", type: "text", key: "model" },
    { label: "Diameter (mm)", type: "number", key: "diameter" }
  ]
};

export default function AddProductScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    description: '',
    category: '',
  });

  const [imageUri, setImageUri] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);
  const [showDynamicModals, setShowDynamicModals] = useState<Record<string, boolean>>({});

  const [dynamicFields, setDynamicFields] = useState<Record<string, string>>({});
  const [dynamicErrors, setDynamicErrors] = useState<Record<string, boolean>>({});

  const [hasDiamond, setHasDiamond] = useState(false);

  const isLooseDiamond = formData.category === 'Loose Diamond';

  useEffect(() => {
    const options = productOptions[formData.category] || [];
    setFormData((prev) => ({ ...prev, title: "" }));
  }, [formData.category]);

  useEffect(() => {
    const fields = productFieldsMap[formData.category] || [];
    const initial: Record<string, string> = {};
    fields.forEach(f => initial[f.key] = "");
    setDynamicFields(initial);
    setDynamicErrors({});
  }, [formData.category]);

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
      setLoading(true);
      setErrors({});
      const newErrors: Record<string, boolean> = {};
      
      // Basic validation
      if (!formData.category) newErrors.category = true;
      if (!imageUri) newErrors.image = true;
      if (!formData.price) newErrors.price = true;

      // Watch-specific validation
      if (formData.category === 'Watches') {
        if (!dynamicFields.brand) newErrors.brand = true;
        if (!dynamicFields.model) newErrors.model = true;
        const diameter = Number(dynamicFields.diameter);
        if (!dynamicFields.diameter || isNaN(diameter) || diameter <= 0 || !(/^\d+(\.\d)?$/).test(dynamicFields.diameter)) {
          newErrors.diameter = true;
        }
      } else {
        // Non-watch validation
        if (!formData.title) newErrors.title = true;
        if (!dynamicFields.weight || isNaN(Number(dynamicFields.weight)) || Number(dynamicFields.weight) <= 0) {
          newErrors.weight = true;
        }
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setDynamicErrors(newErrors);
        setLoading(false);
        return;
      }

      // Upload image
      const imagePath = `${user?.id}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(imagePath, decode(imageBase64), {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(imagePath);

      // Create product with the correct title based on product type
      const productTitle = formData.category === 'Watches' ? dynamicFields.brand : formData.title;
      
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          title: productTitle,
          description: formData.description,
          price: parseFloat(formData.price),
          image_url: publicUrl,
          user_id: user?.id,
          category: formData.category,
          status: 'available'
        })
        .select()
        .single();

      if (productError) throw productError;

      // Insert category-specific specs
      let specsError = null;

      switch (formData.category) {
        case 'Watches':
          const { error: watchError } = await supabase
            .from('watch_specs')
            .insert({
              product_id: product.id,
              brand: dynamicFields.brand,
              model: dynamicFields.model,
              diameter: dynamicFields.diameter ? parseFloat(dynamicFields.diameter) : null
            });
          specsError = watchError;
          break;

        case 'Ring':
        case 'Necklace':
        case 'Bracelet':
        case 'Earrings':
        case 'Special pieces':
          const { error: jewelryError } = await supabase
            .from('jewelry_specs')
            .insert({
              product_id: product.id,
              weight: dynamicFields.weight ? parseFloat(dynamicFields.weight) : null,
              material: dynamicFields.material,
              gold_karat: dynamicFields.material?.toUpperCase() === 'GOLD' ? dynamicFields.goldKarat : null,
              has_diamond: hasDiamond,
              diamond_weight: hasDiamond && dynamicFields.diamond_weight ? parseFloat(dynamicFields.diamond_weight) : null,
              diamond_color: hasDiamond ? dynamicFields.diamond_color : null,
              clarity: hasDiamond ? dynamicFields.clarity : null,
              cut_grade: hasDiamond ? dynamicFields.cut_grade : null,
              certification: hasDiamond ? dynamicFields.certification : null,
              side_stones: hasDiamond ? dynamicFields.side_stones === 'With Side Stones' : null
            });
          specsError = jewelryError;
          break;

        case 'Gems':
          const { error: gemError } = await supabase
            .from('gem_specs')
            .insert({
              product_id: product.id,
              weight: dynamicFields.weight ? parseFloat(dynamicFields.weight) : null,
              certification: dynamicFields.certification
            });
          specsError = gemError;
          break;
      }

      if (specsError) throw specsError;

      router.push('/profile');
    } catch (error) {
      console.error('Error creating product:', error);
      Alert.alert('Error', 'An error occurred while creating the product');
    } finally {
      setLoading(false);
    }
  };

  const validateDynamicFields = () => {
    const fields = productFieldsMap[formData.category] || [];
    const errors: Record<string, boolean> = {};
    let valid = true;
    fields.forEach(field => {
      if (!dynamicFields[field.key]) {
        errors[field.key] = true;
        valid = false;
      } else if (field.type === "number" && isNaN(Number(dynamicFields[field.key]))) {
        errors[field.key] = true;
        valid = false;
      }
    });
    setDynamicErrors(errors);
    return valid;
  };

  const toggleDynamicModal = (field: string, value: boolean) => {
    setShowDynamicModals(prev => ({ ...prev, [field]: value }));
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

  const renderDynamicFields = () => {
    const fields = productFieldsMap[formData.category] || [];
    let renderedFields: JSX.Element[] = [];

    if (formData.category === 'Watches') {
      // Brand field for watches
      renderedFields.push(
        <View key="brand" style={styles.inputGroup}>
          <Text style={styles.label}>Brand</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowBrandModal(true)}
          >
            <Text style={styles.selectButtonText}>
              {dynamicFields.brand || 'Select brand'}
            </Text>
            <ChevronDown size={20} color="#666" />
          </TouchableOpacity>
          {dynamicErrors.brand && <Text style={styles.errorText}>Required field</Text>}
        </View>
      );

      // Model field for watches - only show after brand is selected
      if (dynamicFields.brand) {
        const brandModels = watchModels[dynamicFields.brand as keyof typeof watchModels];
        
        if (brandModels) {
          // Brand exists in our JSON - show select
          renderedFields.push(
            <View key="model" style={styles.inputGroup}>
              <Text style={styles.label}>Model</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setShowModelModal(true)}
              >
                <Text style={styles.selectButtonText}>
                  {dynamicFields.model || 'Select model'}
                </Text>
                <ChevronDown size={20} color="#666" />
              </TouchableOpacity>
              {dynamicErrors.model && <Text style={styles.errorText}>Required field</Text>}
            </View>
          );
        } else {
          // Brand doesn't exist in our JSON - show text input
          renderedFields.push(
            <View key="model" style={styles.inputGroup}>
              <Text style={styles.label}>Model</Text>
              <TextInput
                style={styles.input}
                value={dynamicFields.model || ''}
                onChangeText={text => setDynamicFields(f => ({ ...f, model: text }))}
                placeholder="Enter watch model"
              />
              {dynamicErrors.model && <Text style={styles.errorText}>Required field</Text>}
            </View>
          );
        }
      }

      // Diameter field for watches
      renderedFields.push(
        <View key="diameter" style={styles.inputGroup}>
          <Text style={styles.label}>Diameter (mm)</Text>
          <TextInput
            style={styles.input}
            value={dynamicFields.diameter || ''}
            onChangeText={text => {
              const sanitized = text.replace(/[^0-9.]/g, '');
              const parts = sanitized.split('.');
              if (parts.length > 2) return;
              if (parts[1]?.length > 1) return;
              setDynamicFields(f => ({ ...f, diameter: sanitized }));
            }}
            keyboardType="numeric"
            placeholder="Enter watch diameter"
          />
          {dynamicErrors.diameter && <Text style={styles.errorText}>Required field / Invalid number</Text>}
        </View>
      );

      return renderedFields;
    }

    // Weight field is shown for non-watches
    renderedFields.push(
      <View key="weight" style={styles.inputGroup}>
        <Text style={styles.label}>Weight (Grams)</Text>
        <TextInput
          style={styles.input}
          value={dynamicFields.weight || ''}
          onChangeText={text => setDynamicFields(f => ({ ...f, weight: text }))}
          keyboardType="numeric"
          placeholder="Enter weight in grams"
        />
        {dynamicErrors.weight && <Text style={styles.errorText}>Required field / Invalid number</Text>}
      </View>
    );

    // Material field for non-watches
    const materialField = fields.find(f => f.key === 'material');
    if (materialField) {
      renderedFields.push(
        <View key={materialField.key} style={styles.inputGroup}>
          <Text style={styles.label}>{materialField.label}</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => toggleDynamicModal(materialField.key, true)}
          >
            <Text style={styles.selectButtonText}>
              {dynamicFields[materialField.key] || `Select ${materialField.label}`}
            </Text>
            <ChevronDown size={20} color="#666" />
          </TouchableOpacity>
          {dynamicErrors[materialField.key] && <Text style={styles.errorText}>Required field</Text>}
          <SelectionModal
            visible={!!showDynamicModals[materialField.key]}
            onClose={() => toggleDynamicModal(materialField.key, false)}
            title={`Select ${materialField.label}`}
            options={materialField.options}
            onSelect={(value) => {
              setDynamicFields(prev => ({ ...prev, [materialField.key]: value }));
              toggleDynamicModal(materialField.key, false);
            }}
            selected={dynamicFields[materialField.key] || ""}
          />
        </View>
      );
    }

    // Gold Karat only if Gold is selected
    if (materialField && materialField.options.includes('GOLD')) {
      renderedFields.push(
        <View key="goldKarat" style={styles.inputGroup}>
          <Text style={styles.label}>Gold Karat</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => toggleDynamicModal('goldKarat', true)}
          >
            <Text style={styles.selectButtonText}>
              {dynamicFields.goldKarat || 'Select Gold Karat'}
            </Text>
            <ChevronDown size={20} color="#666" />
          </TouchableOpacity>
          {dynamicErrors.goldKarat && <Text style={styles.errorText}>Required field</Text>}
          <SelectionModal
            visible={!!showDynamicModals['goldKarat']}
            onClose={() => toggleDynamicModal('goldKarat', false)}
            title="Select Gold Karat"
            options={["9K", "10K", "14K", "18K", "21K", "22K", "24K"]}
            onSelect={(value) => {
              setDynamicFields(prev => ({ ...prev, goldKarat: value }));
              toggleDynamicModal('goldKarat', false);
            }}
            selected={dynamicFields.goldKarat || ""}
          />
        </View>
      );
    }

    // Diamond checkbox for non-watches
    renderedFields.push(
      <View key="hasDiamond" style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <TouchableOpacity
          onPress={() => setHasDiamond(v => !v)}
          style={{ marginRight: 8, width: 24, height: 24, borderWidth: 1, borderColor: '#666', borderRadius: 4, backgroundColor: hasDiamond ? '#6C5CE7' : '#fff', justifyContent: 'center', alignItems: 'center' }}
        >
          {hasDiamond && <View style={{ width: 16, height: 16, backgroundColor: '#fff', borderRadius: 2 }} />}
        </TouchableOpacity>
        <Text style={styles.label}>Does this product include a diamond?</Text>
      </View>
    );

    // Diamond fields if hasDiamond is true
    if (hasDiamond) {
      renderedFields.push(
        <View key="diamondFields">
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Diamond Weight (Carat)</Text>
            <TextInput
              style={styles.input}
              value={dynamicFields.diamond_weight || ''}
              onChangeText={text => setDynamicFields(f => ({ ...f, diamond_weight: text }))}
              keyboardType="numeric"
              placeholder="Enter diamond weight in carat"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Diamond Color</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => toggleDynamicModal('diamond_color', true)}
            >
              <Text style={styles.selectButtonText}>
                {dynamicFields.diamond_color || 'Select Diamond Color'}
              </Text>
              <ChevronDown size={20} color="#666" />
            </TouchableOpacity>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Clarity</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => toggleDynamicModal('clarity', true)}
            >
              <Text style={styles.selectButtonText}>
                {dynamicFields.clarity || 'Select Clarity'}
              </Text>
              <ChevronDown size={20} color="#666" />
            </TouchableOpacity>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cut Grade</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => toggleDynamicModal('cut_grade', true)}
            >
              <Text style={styles.selectButtonText}>
                {dynamicFields.cut_grade || 'Select Cut Grade'}
              </Text>
              <ChevronDown size={20} color="#666" />
            </TouchableOpacity>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Certification</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => toggleDynamicModal('certification', true)}
            >
              <Text style={styles.selectButtonText}>
                {dynamicFields.certification || 'Select Certification'}
              </Text>
              <ChevronDown size={20} color="#666" />
            </TouchableOpacity>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Side Stones</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => toggleDynamicModal('side_stones', true)}
            >
              <Text style={styles.selectButtonText}>
                {dynamicFields.side_stones || 'Select Side Stones'}
              </Text>
              <ChevronDown size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return renderedFields;
  };

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
          {errors.category && <Text style={styles.errorText}>Required field</Text>}
        </View>

        {formData.category !== 'Watches' && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Product Name</Text>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder="Enter product name"
              textAlign="left"
            />
            {errors.title && <Text style={styles.errorText}>Required field</Text>}
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Price</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextInput
              style={[styles.input, { flex: 1, marginRight: 8 }]}
              value={formData.price}
              onChangeText={text => {
                const sanitized = text.replace(/[^0-9.]/g, '');
                setFormData({ ...formData, price: sanitized });
              }}
              placeholder="Enter price"
              keyboardType="numeric"
              textAlign="left"
            />
          </View>
          {errors.price && <Text style={styles.errorText}>Price is required and must be a positive number</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            placeholder="Describe the product..."
            multiline
            numberOfLines={4}
            textAlign="left"
            textAlignVertical="top"
          />
        </View>

        <Text style={styles.sectionTitle}>Technical Specifications</Text>

        {renderDynamicFields()}

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
        visible={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title="Select Product Type"
        options={PRODUCT_TYPES}
        onSelect={(value) => {
          setFormData({ ...formData, category: value });
          if (value === 'Watches') {
            // Reset any watch-specific fields when changing to watches
            setDynamicFields({});
          }
        }}
        selected={formData.category}
      />

      <SelectionModal
        visible={showBrandModal}
        onClose={() => setShowBrandModal(false)}
        title="Select Brand"
        options={Object.keys(watchModels)}
        onSelect={(value) => {
          setDynamicFields(f => ({ ...f, brand: value, model: '' }));
          setShowBrandModal(false);
        }}
        selected={dynamicFields.brand || ""}
      />

      {dynamicFields.brand && (
        <SelectionModal
          visible={showModelModal}
          onClose={() => setShowModelModal(false)}
          title="Select Model"
          options={watchModels[dynamicFields.brand as keyof typeof watchModels] || []}
          onSelect={(value) => {
            setDynamicFields(f => ({ ...f, model: value }));
            setShowModelModal(false);
          }}
          selected={dynamicFields.model || ""}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  imageSection: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
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
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#444',
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
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#6C5CE7',
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
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Heebo-Regular',
  },
});