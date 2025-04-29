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
  'Special pieces',
  'Watches',
  'Gems',
  'Rough Diamonds',
] as const;

const WEIGHT_OPTIONS = Array.from({ length: 46 }, (_, i) => (0.5 + i * 0.1).toFixed(1));

const CURRENCY_OPTIONS = [
  { label: '₪', value: 'ILS' },
  { label: '$', value: 'USD' },
  { label: '€', value: 'EUR' },
];

type DiamondCut = typeof DIAMOND_CUTS[number];
type ProductType = typeof PRODUCT_TYPES[number];
type ClarityGrade = typeof CLARITY_GRADES[number];
type ColorGrade = typeof COLOR_GRADES[number];

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
  "Loose Diamond": [
    "Certificated",
    "None Certificated",
    "Natural",
    "Lab Grown",
    "Treated"
  ],
  "Rough Diamonds": [],
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
  { label: "Diamond Size (Carat) From", type: "number", key: "diamondSizeFrom" },
  { label: "Diamond Size (Carat) To", type: "number", key: "diamondSizeTo" },
  { label: "Diamond Color", type: "select", key: "diamondColor", options: ["D", "E", "F", "G", "H", "I", "J", "K", "Z"] },
  { label: "Clarity", type: "select", key: "clarity", options: ["I3", "I2", "I1", "SI2", "SI1", "VS2", "VS1", "VVS2", "VVS1", "IF", "FL"] },
  { label: "Side Stones", type: "select", key: "sideStones", options: ["With Side Stones", "Without Side Stones"] },
  { label: "Cut Grade", type: "select", key: "cutGrade", options: ["POOR", "FAIR", "GOOD", "VERY GOOD", "EXCELLENT"] },
  { label: "Certification", type: "select", key: "certification", options: ["GIA", "IGI", "HRD", "EGL", "SGL", "CGL", "IGL", "AIG"] },
  { label: "Gold Color", type: "select", key: "goldColor", options: ["WHITE", "ROSE", "YELLOW"] },
  { label: "Material", type: "select", key: "material", options: ["GOLD", "PLATINUM", "SILVER"] },
  { label: "Gold Karat", type: "select", key: "goldKarat", options: ["9K", "10K", "14K", "18K", "21K", "22K", "24K"] }
];

const productFieldsMap: Record<string, any[]> = {
  "Ring": baseRingFields,
  "Necklace": baseRingFields,
  "Earrings": baseRingFields,
  "Bracelet": baseRingFields,
  "Special pieces": baseRingFields,
  "Loose Diamond": [
    { label: "Diamond Shape", type: "select", key: "diamondShape", options: ["Round", "Oval", "Princess", "Emerald", "Cushion", "Heart", "Marquise", "Asscher", "Pear", "Trapeze", "Baguette"] },
    { label: "Certification", type: "select", key: "certification", options: ["GIA", "IGI", "HRD", "EGL", "SGL", "CGL", "IGL", "AIG", "None"] },
    { label: "Origin", type: "select", key: "origin", options: ["Natural", "Lab Grown", "Treated"] },
    { label: "Lab Grown Type", type: "select", key: "labGrownType", options: ["CVD", "HPHT"], condition: "origin == 'Lab Grown'" },
    { label: "Treatment Type", type: "select", key: "treatmentType", options: ["Laser Drill", "Fracture Filling", "HPHT Color"], condition: "origin == 'Treated'" }
  ],
  "Gems": [
    { label: "Certification", type: "select", key: "certification", options: ["GIA", "IGI", "None"] },
    { label: "Origin", type: "select", key: "origin", options: ["Natural", "Lab Grown", "Treated"] }
  ],
  "Watches": [
    { label: "Brand", type: "text", key: "brand" },
    { label: "Model", type: "text", key: "model" },
    { label: "Diameter (mm)", type: "number", key: "diameter" }
  ],
  "Rough Diamonds": []
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
  const [showProductNameModal, setShowProductNameModal] = useState(false);
  const [productNameOptions, setProductNameOptions] = useState<string[]>([]);

  const [dynamicFields, setDynamicFields] = useState<Record<string, string>>({});
  const [dynamicErrors, setDynamicErrors] = useState<Record<string, boolean>>({});
  const [showDynamicSelect, setShowDynamicSelect] = useState<Record<string, boolean>>({});

  const [currency, setCurrency] = useState('ILS');
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);

  const isLooseDiamond = formData.category === 'Loose Diamond';

  useEffect(() => {
    const options = productOptions[formData.category] || [];
    setProductNameOptions(options);
    // Reset product name if type changes
    setFormData((prev) => ({ ...prev, title: "" }));
  }, [formData.category]);

  useEffect(() => {
    const fields = productFieldsMap[formData.category] || [];
    const initial: Record<string, string> = {};
    fields.forEach(f => initial[f.key] = "");
    setDynamicFields(initial);
    setDynamicErrors({});
    setShowDynamicSelect({});
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
      if (!formData.title && formData.category !== 'Watches') newErrors.title = true;
      if (!formData.price) newErrors.price = true;
      if (!formData.category) newErrors.category = true;
      if (!imageUri) newErrors.image = true;

      // ולידציה ל-Watches
      if (formData.category === 'Watches') {
        if (!dynamicFields.brand) newErrors.brand = true;
        if (!dynamicFields.model) newErrors.model = true;
        if (!dynamicFields.diameter || isNaN(Number(dynamicFields.diameter))) newErrors.diameter = true;
      }
      // ולידציה ל-Loose Diamond (קיים)
      if (formData.category === 'Loose Diamond') {
        if (!dynamicFields.weight) newErrors.weight = true;
        if (!dynamicFields.clarity) newErrors.clarity = true;
        if (!dynamicFields.color) newErrors.color = true;
        if (!dynamicFields.cut) newErrors.cut = true;
      }
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setLoading(false);
        return;
      }

      // ננקה ערכי gold אם צריך
      let fieldsToSend = { ...dynamicFields };
      if (fieldsToSend.material?.toUpperCase?.() !== 'GOLD') {
        delete fieldsToSend.goldColor;
        delete fieldsToSend.goldKarat;
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

      // Create product
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price),
          currency: currency,
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
        case 'Watch':
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

        case 'Loose Diamond':
          const { error: diamondError } = await supabase
            .from('diamond_specs')
            .insert({
              product_id: product.id,
              shape: dynamicFields.shape,
              weight: dynamicFields.weight ? parseFloat(dynamicFields.weight) : null,
              color: dynamicFields.color,
              clarity: dynamicFields.clarity,
              cut_grade: dynamicFields.cut_grade,
              certificate: dynamicFields.certificate,
              origin: dynamicFields.origin,
              lab_grown_type: dynamicFields.lab_grown_type,
              treatment_type: dynamicFields.treatment_type
            });
          specsError = diamondError;
          break;

        case 'Gems':
          const { error: gemError } = await supabase
            .from('gem_specs')
            .insert({
              product_id: product.id,
              type: dynamicFields.type,
              origin: dynamicFields.origin,
              certification: dynamicFields.certification
            });
          specsError = gemError;
          break;

        case 'Ring':
        case 'Necklace':
        case 'Bracelet':
        case 'Earrings':
          const { error: jewelryError } = await supabase
            .from('jewelry_specs')
            .insert({
              product_id: product.id,
              diamond_size_from: dynamicFields.diamond_size_from ? parseFloat(dynamicFields.diamond_size_from) : null,
              diamond_size_to: dynamicFields.diamond_size_to ? parseFloat(dynamicFields.diamond_size_to) : null,
              color: dynamicFields.color,
              clarity: dynamicFields.clarity,
              gold_color: dynamicFields.gold_color,
              material: dynamicFields.material,
              gold_karat: dynamicFields.gold_karat,
              side_stones: dynamicFields.side_stones === 'true',
              cut_grade: dynamicFields.cut_grade,
              certification: dynamicFields.certification
            });
          specsError = jewelryError;
          break;
      }

      if (specsError) throw specsError;

      // עדכון עם שמירה ל-watch_specs אם מדובר בשעון
      if (formData.category === 'Watches') {
        const { error: watchSpecsError } = await supabase
          .from('watch_specs')
          .insert({
            product_id: product.id,
            brand: dynamicFields.brand,
            model: dynamicFields.model,
            diameter: dynamicFields.diameter ? parseFloat(dynamicFields.diameter) : null
          });
        if (watchSpecsError) throw watchSpecsError;
      }

      router.push('/profile');
    } catch (error) {
      console.error('Error creating product:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה בעת יצירת המוצר');
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
    const materialValue = dynamicFields['material']?.toUpperCase?.() || dynamicFields['material'];
    let renderedFields: JSX.Element[] = [];
    fields.forEach(field => {
      if (formData.category === 'Watches' && field.key === 'brand') return;
      if (field.key === 'material') {
        // הצגת שדה Material
        renderedFields.push(
          <View key={field.key} style={styles.inputGroup}>
            <Text style={styles.label}>{field.label}</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowDynamicSelect(s => ({ ...s, [field.key]: true }))}
            >
              <Text style={styles.selectButtonText}>
                {(dynamicFields as Record<string, string>)[field.key] || `בחר ${field.label}`}
              </Text>
              <ChevronDown size={20} color="#666" />
            </TouchableOpacity>
            {(dynamicErrors as Record<string, boolean>)[field.key] && <Text style={styles.errorText}>שדה חובה</Text>}
            <SelectionModal
              visible={!!(showDynamicSelect as Record<string, boolean>)[field.key]}
              onClose={() => setShowDynamicSelect(s => ({ ...s, [field.key]: false }))}
              title={field.label}
              options={field.options}
              onSelect={value => {
                setDynamicFields((f: Record<string, string>) => {
                  if (value.toUpperCase() !== 'GOLD') {
                    const { goldColor, goldKarat, ...rest } = f;
                    return { ...rest, [field.key]: value };
                  }
                  return { ...f, [field.key]: value };
                });
                setShowDynamicSelect(s => ({ ...s, [field.key]: false }));
              }}
              selected={(dynamicFields as Record<string, string>)[field.key] || ""}
            />
          </View>
        );
        // אם נבחר Gold - הצג מיד אחרי Material את Gold Color
        if (materialValue === 'GOLD') {
          const goldColorField = fields.find(f => f.key === 'goldColor');
          if (goldColorField) {
            renderedFields.push(
              <View key={goldColorField.key} style={styles.inputGroup}>
                <Text style={styles.label}>{goldColorField.label}</Text>
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => setShowDynamicSelect(s => ({ ...s, [goldColorField.key]: true }))}
                >
                  <Text style={styles.selectButtonText}>
                    {(dynamicFields as Record<string, string>)[goldColorField.key] || `בחר ${goldColorField.label}`}
                  </Text>
                  <ChevronDown size={20} color="#666" />
                </TouchableOpacity>
                {(dynamicErrors as Record<string, boolean>)[goldColorField.key] && <Text style={styles.errorText}>שדה חובה</Text>}
                <SelectionModal
                  visible={!!(showDynamicSelect as Record<string, boolean>)[goldColorField.key]}
                  onClose={() => setShowDynamicSelect(s => ({ ...s, [goldColorField.key]: false }))}
                  title={goldColorField.label}
                  options={goldColorField.options}
                  onSelect={value => {
                    setDynamicFields((f: Record<string, string>) => ({ ...f, [goldColorField.key]: value }));
                    setShowDynamicSelect(s => ({ ...s, [goldColorField.key]: false }));
                  }}
                  selected={(dynamicFields as Record<string, string>)[goldColorField.key] || ""}
                />
              </View>
            );
          }
        }
        // אם נבחר Gold - הצג Gold Karat אחרי Gold Color
        if (materialValue === 'GOLD') {
          const goldKaratField = fields.find(f => f.key === 'goldKarat');
          if (goldKaratField) {
            renderedFields.push(
              <View key={goldKaratField.key} style={styles.inputGroup}>
                <Text style={styles.label}>{goldKaratField.label}</Text>
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => setShowDynamicSelect(s => ({ ...s, [goldKaratField.key]: true }))}
                >
                  <Text style={styles.selectButtonText}>
                    {(dynamicFields as Record<string, string>)[goldKaratField.key] || `בחר ${goldKaratField.label}`}
                  </Text>
                  <ChevronDown size={20} color="#666" />
                </TouchableOpacity>
                {(dynamicErrors as Record<string, boolean>)[goldKaratField.key] && <Text style={styles.errorText}>שדה חובה</Text>}
                <SelectionModal
                  visible={!!(showDynamicSelect as Record<string, boolean>)[goldKaratField.key]}
                  onClose={() => setShowDynamicSelect(s => ({ ...s, [goldKaratField.key]: false }))}
                  title={goldKaratField.label}
                  options={goldKaratField.options}
                  onSelect={value => {
                    setDynamicFields((f: Record<string, string>) => ({ ...f, [goldKaratField.key]: value }));
                    setShowDynamicSelect(s => ({ ...s, [goldKaratField.key]: false }));
                  }}
                  selected={(dynamicFields as Record<string, string>)[goldKaratField.key] || ""}
                />
              </View>
            );
          }
        }
        return;
      }
      // תנאי לשדה תלוי כללי
      if (field.condition) {
        const [depKey, depVal] = field.condition.split(" == ");
        if ((dynamicFields as Record<string, string>)[depKey.trim()] !== depVal.replace(/'/g, "").trim()) return;
      }
      // דילוג על goldColor/goldKarat כי כבר טופלו
      if ((field.key === 'goldColor' || field.key === 'goldKarat')) return;
      if (field.type === "select") {
        renderedFields.push(
          <View key={field.key} style={styles.inputGroup}>
            <Text style={styles.label}>{field.label}</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowDynamicSelect(s => ({ ...s, [field.key]: true }))}
            >
              <Text style={styles.selectButtonText}>
                {(dynamicFields as Record<string, string>)[field.key] || `בחר ${field.label}`}
              </Text>
              <ChevronDown size={20} color="#666" />
            </TouchableOpacity>
            {(dynamicErrors as Record<string, boolean>)[field.key] && <Text style={styles.errorText}>שדה חובה</Text>}
            <SelectionModal
              visible={!!(showDynamicSelect as Record<string, boolean>)[field.key]}
              onClose={() => setShowDynamicSelect(s => ({ ...s, [field.key]: false }))}
              title={field.label}
              options={field.options}
              onSelect={value => {
                setDynamicFields((f: Record<string, string>) => ({ ...f, [field.key]: value }));
                setShowDynamicSelect(s => ({ ...s, [field.key]: false }));
              }}
              selected={(dynamicFields as Record<string, string>)[field.key] || ""}
            />
          </View>
        );
        return;
      }
      if (field.type === "number") {
        renderedFields.push(
          <View key={field.key} style={styles.inputGroup}>
            <Text style={styles.label}>{field.label}</Text>
            <TextInput
              style={styles.input}
              value={(dynamicFields as Record<string, string>)[field.key]}
              onChangeText={text => setDynamicFields(f => ({ ...f, [field.key]: text }))}
              keyboardType="numeric"
            />
            {(dynamicErrors as Record<string, boolean>)[field.key] && <Text style={styles.errorText}>שדה חובה/מספר לא תקין</Text>}
          </View>
        );
        return;
      }
      if (field.type === "text") {
        renderedFields.push(
          <View key={field.key} style={styles.inputGroup}>
            <Text style={styles.label}>{field.label}</Text>
            <TextInput
              style={styles.input}
              value={(dynamicFields as Record<string, string>)[field.key]}
              onChangeText={text => setDynamicFields(f => ({ ...f, [field.key]: text }))}
              placeholder={`Enter ${field.label}`}
            />
            {(dynamicErrors as Record<string, boolean>)[field.key] && <Text style={styles.errorText}>שדה חובה</Text>}
          </View>
        );
        return;
      }
    });
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
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            {formData.category === 'Watches' ? 'Brand' : 'Product Name'}
          </Text>
          {productNameOptions.length > 0 ? (
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowProductNameModal(true)}
            >
              <Text style={styles.selectButtonText}>
                {formData.category === 'Watches'
                  ? (dynamicFields.brand || 'Select brand')
                  : (formData.title || 'Select product name')}
              </Text>
              <ChevronDown size={20} color="#666" />
            </TouchableOpacity>
          ) : (
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder={isLooseDiamond ? "Example: 1 Carat Round Diamond" : "Example: Solitaire Diamond Ring"}
              textAlign="left"
            />
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Price</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextInput
              style={[styles.input, { flex: 1, marginRight: 8 }]}
              value={formData.price}
              onChangeText={text => {
                // Allow only positive numbers
                const sanitized = text.replace(/[^0-9.]/g, '');
                setFormData({ ...formData, price: sanitized });
              }}
              placeholder="Enter price"
              keyboardType="numeric"
              textAlign="left"
            />
            <TouchableOpacity
              style={styles.currencyButton}
              onPress={() => setShowCurrencyModal(true)}
            >
              <Text style={styles.currencyButtonText}>
                {CURRENCY_OPTIONS.find(opt => opt.value === currency)?.label || '₪'}
              </Text>
              <ChevronDown size={16} color="#666" />
            </TouchableOpacity>
          </View>
          {errors.price && <Text style={styles.errorText}>Price is required and must be a positive number</Text>}
          <SelectionModal
            visible={showCurrencyModal}
            onClose={() => setShowCurrencyModal(false)}
            title="Select Currency"
            options={CURRENCY_OPTIONS.map(opt => opt.label)}
            onSelect={label => {
              const selected = CURRENCY_OPTIONS.find(opt => opt.label === label);
              if (selected) setCurrency(selected.value);
              setShowCurrencyModal(false);
            }}
            selected={CURRENCY_OPTIONS.find(opt => opt.value === currency)?.label || ''}
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

      <SelectionModal
        visible={showProductNameModal}
        onClose={() => setShowProductNameModal(false)}
        title={formData.category === 'Watches' ? 'Select Brand' : 'Select Product Name'}
        options={productNameOptions}
        onSelect={(value) => {
          if (formData.category === 'Watches') {
            setDynamicFields(f => ({ ...f, brand: value }));
          } else {
            setFormData({ ...formData, title: value });
          }
        }}
        selected={formData.category === 'Watches' ? (dynamicFields.brand || '') : (formData.title || '')}
      />
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
  currencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#444',
  },
  currencyButtonText: {
    fontSize: 18,
    color: '#fff',
    marginRight: 4,
    fontFamily: 'Heebo-Medium',
  },
});