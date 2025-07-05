import { useState, useEffect } from 'react';
import { Alert, Platform, Linking } from 'react-native';
import { createProduct, SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabaseApi';
import { useAuth } from '@/hooks/useAuth';
import { decode } from 'base64-arraybuffer';
import watchModels from '@/lib/watch-models.json';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { notifyMatchingUsersOnNewProduct } from '@/utils/notificationMatcher';

interface ImageData {
  uri: string;
  base64: string;
}

// Define watch models type
type WatchModelsType = typeof watchModels;

const PRODUCT_TYPES = [
  'Ring', 'Necklace', 'Bracelet', 'Earrings', 'Special pieces', 'Watches', 'Gems', 'Rough Diamond', 'Loose Diamond'
];

const JEWELRY_TYPES = ['Ring', 'Necklace', 'Bracelet', 'Earrings', 'Special pieces'];

const productOptions: Record<string, string[]> = {
  Ring: [
    'Wedding ring', 'Hand Chain Ring - Bracelet', 'Classic ring', 'Engagement ring', 'Solitaire ring', 'All around ring', 'Band ring'
  ],
  Necklace: [
    'Pendant', 'Chain', 'Cuban links'
  ],
  Earrings: [
    'Stud earrings', 'Drop earrings', 'English lock earrings', 'Hoop earrings', 'Chandelier earrings'
  ],
  Bracelet: [
    'Tennis', 'Bangle', 'Armlet', 'Bracelet'
  ],
  'Special pieces': [
    'Crowns', 'Cuff links', 'Pins', 'Belly chains'
  ],
  Gems: [
    'Certificated', 'None Certificated', 'Natural', 'Lab Grown', 'Treated'
  ],
  Watches: Object.keys(watchModels)
};

// Handle other product types...
interface JewelrySpecsData {
  product_id: string;
  material: string;
  weight: string;
  gold_karat?: string;
  gold_color?: string;
  diamond_details?: {
    weight: string;
    color: string;
    clarity: string;
    cut_grade: string;
    certification: string;
  };
  side_stones_details?: {
    weight: string;
    color: string;
    clarity: string;
  };
}

export default function useProductForm() {
  const { user, accessToken } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    subcategory: '',
    price: '',
    description: '',
    category: '',
  });
  const [dynamicFields, setDynamicFields] = useState<Record<string, string>>({});
  const [dynamicErrors, setDynamicErrors] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [hasDiamond, setHasDiamond] = useState(false);
  const [hasSideStones, setHasSideStones] = useState(false);
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDynamicModals, setShowDynamicModals] = useState<Record<string, boolean>>({});

  // Options
  const productTypeOptions = PRODUCT_TYPES;
  const brandOptions = formData.category && productOptions[formData.category] ? productOptions[formData.category] : [];
  const modelOptions = (formData.category === 'Watches' && dynamicFields.brand && 
    (watchModels as WatchModelsType)[dynamicFields.brand as keyof WatchModelsType]) 
    ? (watchModels as WatchModelsType)[dynamicFields.brand as keyof WatchModelsType] 
    : [];

  // Reset dynamic fields on category change
  useEffect(() => {
    setDynamicFields({});
    setDynamicErrors({});
    setShowDynamicModals({});
    setHasDiamond(false);
    setHasSideStones(false);
    setShowBrandModal(false);
    setShowModelModal(false);
  }, [formData.category]);

  // Handlers
  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: false }));
  };
  const handleDynamicChange = (key: string, value: string) => {
    setDynamicFields(prev => ({ ...prev, [key]: value }));
    setDynamicErrors(prev => ({ ...prev, [key]: false }));
  };
  const handleDiamondToggle = () => {
    setHasDiamond(v => !v);
  };
  const handleSideStonesToggle = (value: boolean) => {
    setHasSideStones(value);
    if (!value) {
      // Clear side stones fields when toggled off
      const newFields = { ...dynamicFields };
      delete newFields.side_stones_weight;
      delete newFields.side_stones_color;
      delete newFields.side_stones_clarity;
      setDynamicFields(newFields);
    }
  };
  const handleImageChange = async () => {
    try {
      // Check current image count first
      if (images.length >= 5) {
        Alert.alert(
          'Image Limit',
          'You can upload up to 5 images only. Please remove an existing image before adding a new one.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Show options to user
      Alert.alert(
        'Select Image Source',
        'Where would you like to pick an image from?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Gallery', onPress: () => setTimeout(() => pickFromGallery(), 100) },
          { text: 'Camera', onPress: () => setTimeout(() => pickFromCamera(), 100) }
        ]
      );
    } catch (error) {
      console.error('Error in handleImageChange:', error);
      Alert.alert('Error', 'An error occurred while picking images. Please try again.', [{ text: 'OK' }]);
    }
  };

  const pickFromGallery = async () => {
    try {
      // Request gallery permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need access to your gallery to upload images. Please enable the permission in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }

      // Configure ImagePicker options based on platform
      const pickerOptions: any = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        // allowsEditing: true, // Disabled due to iOS bug: base64 is not always returned when editing is enabled
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
        selectionLimit: 5 - images.length, // Limit based on remaining slots
      };

      // Add allowsMultipleSelection only for supported platforms
      if (Platform.OS === 'android' || (Platform.OS === 'ios' && parseInt(Platform.Version as string, 10) >= 14)) {
        pickerOptions.allowsMultipleSelection = true;
      }

      const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newImages = result.assets
          .filter(asset => asset.base64 && asset.uri)
          .map(asset => ({
            uri: asset.uri,
            base64: asset.base64!
          }));
        
        if (newImages.length > 0) {
          setImages(prev => [...prev, ...newImages]);
        } else {
          Alert.alert(
            'Error',
            'Could not process the selected images. Please try again.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Error in pickFromGallery:', error);
      handleImageError(error);
    }
  };

  const pickFromCamera = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need access to your camera to take a photo. Please enable the permission in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        // allowsEditing: true, // Disabled due to iOS bug: base64 is not always returned when editing is enabled
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.base64 && asset.uri) {
          const newImage = {
            uri: asset.uri,
            base64: asset.base64
          };
          setImages(prev => [...prev, newImage]);
        } else {
          Alert.alert(
            'Error',
            'Could not process the captured image. Please try again.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Error in pickFromCamera:', error);
      handleImageError(error);
    }
  };

  const handleImageError = (error: any) => {
    // Provide specific error messages based on error type
    let errorMessage = 'An error occurred while picking images. Please try again.';
    
    if (error instanceof Error) {
      if (error.message.includes('permission')) {
        errorMessage = 'No permission to access camera/gallery. Please enable permissions in your device settings.';
      } else if (error.message.includes('cancelled')) {
        // User cancelled, no need to show error
        return;
      } else if (error.message.includes('storage')) {
        errorMessage = 'Not enough storage space on device. Please free up space and try again.';
      } else if (error.message.includes('camera')) {
        errorMessage = 'No access to camera. Please check that the camera is available and try again.';
      }
    }
    
    Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // Validation (simplified for brevity)
  const validate = () => {
    const newErrors: Record<string, boolean> = {};
    const newDynamicErrors: Record<string, boolean> = {};
    
    if (!formData.category) newErrors.category = true;
    if (!formData.price) newErrors.price = true;
    if (!formData.description) newErrors.description = true;
    
    if (images.length === 0) {
      newErrors.images = true;
    }

    if (formData.category === 'Watches') {
      if (!dynamicFields.brand) newDynamicErrors.brand = true;
      if (!dynamicFields.model) newDynamicErrors.model = true;
      const diameter = Number(dynamicFields.diameter);
      if (!dynamicFields.diameter || isNaN(diameter) || diameter <= 0 || !(/^\d+(\.\d)?$/).test(dynamicFields.diameter)) {
        newDynamicErrors.diameter = true;
      }
    } else if (formData.category === 'Gems') {
      if (!dynamicFields.type) newDynamicErrors.type = true;
      if (!dynamicFields.origin) newDynamicErrors.origin = true;
      if (!dynamicFields.weight || isNaN(Number(dynamicFields.weight)) || Number(dynamicFields.weight) <= 0) {
        newDynamicErrors.weight = true;
      }
      if (!dynamicFields.shape) newDynamicErrors.shape = true;
      if (!dynamicFields.clarity) newDynamicErrors.clarity = true;
      if (!dynamicFields.dimensions) newDynamicErrors.dimensions = true;
      if (dynamicFields.hasCertification === 'true' && !dynamicFields.certification) {
        newDynamicErrors.certification = true;
      }
    } else if (formData.category === 'Rough Diamond') {
      if (!dynamicFields.weight || isNaN(Number(dynamicFields.weight)) || Number(dynamicFields.weight) <= 0) {
        newDynamicErrors.weight = true;
      }
      if (!dynamicFields.clarity) newDynamicErrors.clarity = true;
      if (!dynamicFields.color) newDynamicErrors.color = true;
    } else if (formData.category === 'Loose Diamond') {
      if (!dynamicFields.weight || isNaN(Number(dynamicFields.weight)) || Number(dynamicFields.weight) <= 0) {
        newDynamicErrors.weight = true;
      }
      if (!dynamicFields.clarity) newDynamicErrors.clarity = true;
      if (!dynamicFields.color) newDynamicErrors.color = true;
      if (!dynamicFields.shape) newDynamicErrors.shape = true;
      if (!dynamicFields.originType) newDynamicErrors.originType = true;
      if (dynamicFields.shape === 'Round' && !dynamicFields.cut) newDynamicErrors.cut = true;
    } else {
      if (!formData.title) newErrors.title = true;
      if (!dynamicFields.material) newDynamicErrors.material = true;
      if (dynamicFields.material === 'Gold') {
        if (!dynamicFields.goldKarat) newDynamicErrors.goldKarat = true;
        if (!dynamicFields.goldColor) newDynamicErrors.goldColor = true;
      }
      if (!dynamicFields.weight || isNaN(Number(dynamicFields.weight)) || Number(dynamicFields.weight) <= 0) {
        newDynamicErrors.weight = true;
      }
      if (hasDiamond) {
        if (!dynamicFields.diamond_weight) newDynamicErrors.diamond_weight = true;
        if (!dynamicFields.diamond_color) newDynamicErrors.diamond_color = true;
        if (!dynamicFields.clarity) newDynamicErrors.clarity = true;
        if (!dynamicFields.cut_grade) newDynamicErrors.cut_grade = true;
        if (!dynamicFields.certification) newDynamicErrors.certification = true;
        if (!dynamicFields.shape) newDynamicErrors.shape = true;
        if (!dynamicFields.polish) newDynamicErrors.polish = true;
        if (!dynamicFields.symmetry) newDynamicErrors.symmetry = true;
        if (!dynamicFields.fluorescence) newDynamicErrors.fluorescence = true;
      }
      if (hasSideStones) {
        if (!dynamicFields.side_stones_weight) newDynamicErrors.side_stones_weight = true;
        if (!dynamicFields.side_stones_color) newDynamicErrors.side_stones_color = true;
        if (!dynamicFields.side_stones_clarity) newDynamicErrors.side_stones_clarity = true;
      }
    }

    setErrors(newErrors);
    setDynamicErrors(newDynamicErrors);
    
    const allErrorValues = [
      ...Object.values(newErrors),
      ...Object.values(newDynamicErrors)
    ];
    return !allErrorValues.some(v => v === true);
  };

  // Submit
  const handleSubmit = async () => {
    console.log('--- Trying to submit product ---');
    const isValid = validate();
    console.log('Validation result:', isValid);
    console.log('Errors:', errors, dynamicErrors);
    if (!isValid) {
      Alert.alert(
        'Error in Data',
        'Please check that all required fields are filled and try again.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    if (!user?.id) {
      Alert.alert(
        'Error in Authorization',
        'You do not have permission to perform this action. Please log in again.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    try {
      setLoading(true);
      
      // Create product first (without image_url)
      const productType = formData.category;
      const productTitle = productType === 'Watches' ? dynamicFields.brand : formData.title;
      const productInsertObj = {
        title: productTitle,
        description: formData.description,
        price: parseFloat(formData.price),
        category: productType,
        user_id: user?.id
      };

      // Debug logs
      console.log('user:', user);
      console.log('accessToken:', accessToken);
      console.log('productInsertObj:', productInsertObj);

      console.log('--- Creating New Product ---');
      const productArr = await createProduct(productInsertObj, accessToken);
      const product = Array.isArray(productArr) ? productArr[0] : productArr;
      if (!product) throw new Error('Product insert failed');

      // Upload all images first
      const uploadedImages = [];
      let imageUploadErrors = 0;
      
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        try {
          console.log(`Uploading image ${i + 1}/${images.length}`);
          
          const imagePath = `${user?.id}/${product.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
          
          // Upload image to storage via Supabase Storage REST API
          const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/product-images/${imagePath}`, {
            method: 'POST',
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/octet-stream',
            },
            body: decode(image.base64)
          });
          
          if (!uploadRes.ok) {
            const err = await uploadRes.text();
            console.error(`Error uploading image ${i + 1}:`, err);
            imageUploadErrors++;
            continue;
          }
          
          // Get public URL (Supabase public URL is predictable)
          const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/product-images/${imagePath}`;
          uploadedImages.push(publicUrl);
          
          // Create product_images record
          const imageRecordRes = await fetch(`${SUPABASE_URL}/rest/v1/product_images`, {
            method: 'POST',
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
              Prefer: 'return=representation'
            },
            body: JSON.stringify({
              product_id: product.id,
              image_url: publicUrl
            })
          });
          
          if (!imageRecordRes.ok) {
            const err = await imageRecordRes.text();
            console.error(`Error creating image record for image ${i + 1}:`, err);
            imageUploadErrors++;
          }
        } catch (imageError) {
          console.error(`Error processing image ${i + 1}:`, imageError);
          imageUploadErrors++;
        }
      }
      
      // Show warning if some images failed to upload
      if (imageUploadErrors > 0) {
        Alert.alert(
          'Warning',
          `${imageUploadErrors} images failed to upload. The product will be saved with the uploaded images.`,
          [{ text: 'Continue' }]
        );
      }

      // Insert specs data
      if (productType === 'Gems') {
        const specsData = {
          product_id: product.id,
          type: dynamicFields.type,
          origin: dynamicFields.origin,
          weight: dynamicFields.weight,
          shape: dynamicFields.shape,
          clarity: dynamicFields.clarity,
          transparency: dynamicFields.transparency === 'true',
          has_certification: dynamicFields.hasCertification === 'true',
          certification: dynamicFields.hasCertification === 'true' ? dynamicFields.certification : null,
          dimensions: dynamicFields.dimensions
        };
        const specsRes = await fetch(`${SUPABASE_URL}/rest/v1/gem_specs`, {
          method: 'POST',
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation'
          },
          body: JSON.stringify(specsData)
        });
        if (!specsRes.ok) {
          const err = await specsRes.text();
          console.error('Error inserting gem specs:', err);
          throw new Error(err);
        }
      } else if (productType === 'Rough Diamond') {
        const specsData = {
          product_id: product.id,
          weight: dynamicFields.weight,
          clarity: dynamicFields.clarity,
          color: dynamicFields.color
        };
        const specsRes = await fetch(`${SUPABASE_URL}/rest/v1/rough_diamond_specs`, {
          method: 'POST',
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation'
          },
          body: JSON.stringify(specsData)
        });
        if (!specsRes.ok) {
          const err = await specsRes.text();
          console.error('Error inserting rough diamond specs:', err);
          throw new Error(err);
        }
      } else if (productType === 'Loose Diamond') {
        const specsData: Record<string, any> = {
          product_id: product.id,
        };
        if (dynamicFields.weight) specsData.weight = dynamicFields.weight;
        if (dynamicFields.clarity) specsData.clarity = dynamicFields.clarity;
        if (dynamicFields.color) specsData.color = dynamicFields.color;
        if (dynamicFields.shape) specsData.shape = dynamicFields.shape;
        if (dynamicFields.shape === 'Round' && dynamicFields.cut) specsData.cut = dynamicFields.cut;
        if (dynamicFields.certificate) specsData.certificate = dynamicFields.certificate;
        if (dynamicFields.fluorescence) specsData.fluorescence = dynamicFields.fluorescence;
        if (dynamicFields.polish) specsData.polish = dynamicFields.polish;
        if (dynamicFields.symmetry) specsData.symmetry = dynamicFields.symmetry;
        if (dynamicFields.originType) specsData.origin_type = dynamicFields.originType;
        Object.keys(specsData).forEach(key => {
          if (specsData[key] === '' || specsData[key] === undefined) delete specsData[key];
        });
        const specsRes = await fetch(`${SUPABASE_URL}/rest/v1/loose_diamonds_specs`, {
          method: 'POST',
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation'
          },
          body: JSON.stringify(specsData)
        });
        if (!specsRes.ok) {
          const err = await specsRes.text();
          console.error('Error inserting loose diamond specs:', err);
          throw new Error(err);
        }
      } else if (productType === 'Watches') {
        const specsData = {
          product_id: product.id,
          brand: dynamicFields.brand,
          model: dynamicFields.model,
          diameter: dynamicFields.diameter ? Number(dynamicFields.diameter) : null
        };
        const specsRes = await fetch(`${SUPABASE_URL}/rest/v1/watch_specs`, {
          method: 'POST',
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation'
          },
          body: JSON.stringify(specsData)
        });
        if (!specsRes.ok) {
          const err = await specsRes.text();
          console.error('Error inserting watches_specs:', err);
          throw new Error(err);
        }
      } else {
        const specsData: Record<string, any> = {
          product_id: product.id,
          material: dynamicFields.material,
          weight: dynamicFields.weight,
          subcategory: formData.title,
        };
        if (formData.subcategory) {
          specsData.subcategory = formData.subcategory;
        }
        if (dynamicFields.material === 'Gold') {
          specsData.gold_karat = dynamicFields.goldKarat;
          specsData.gold_color = dynamicFields.goldColor;
        }
        if (hasDiamond) {
          specsData.has_diamond = true;
          specsData.diamond_weight = dynamicFields.diamond_weight;
          specsData.clarity = dynamicFields.clarity;
          specsData.color = dynamicFields.diamond_color;
          specsData.cut_grade = dynamicFields.cut_grade;
          specsData.certification = dynamicFields.certification;
          specsData.shape = dynamicFields.shape;
          specsData.polish = dynamicFields.polish;
          specsData.symmetry = dynamicFields.symmetry;
          specsData.fluorescence = dynamicFields.fluorescence;
        }
        if (hasSideStones) {
          specsData.side_stones_details = {
            weight: dynamicFields.side_stones_weight,
            color: dynamicFields.side_stones_color,
            clarity: dynamicFields.side_stones_clarity
          };
        }
        let specsTable = productType.toLowerCase();
        if (specsTable === 'special pieces') {
          specsTable = 'special_piece';
        } else if (specsTable === 'earrings') {
          specsTable = 'earring';
        }
        specsTable += '_specs';
        const specsRes = await fetch(`${SUPABASE_URL}/rest/v1/${specsTable}`, {
          method: 'POST',
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation'
          },
          body: JSON.stringify(specsData)
        });
        if (!specsRes.ok) {
          const err = await specsRes.text();
          console.error(`Error inserting ${specsTable}:`, err);
          throw new Error(err);
        }
      }

      // Success - reset form and navigate
      await notifyMatchingUsersOnNewProduct(product, accessToken || '');
      resetForm();
      router.replace('/');
    } catch (error) {
      console.error('Error in Creating Product:', error);
      
      let errorMessage = 'An error occurred while creating the product. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network connection error. Please check your connection and try again.';
        } else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
          errorMessage = 'No permission to perform this action. Please log in again.';
        } else if (error.message.includes('storage') || error.message.includes('quota')) {
          errorMessage = 'Data storage error. Please try again later.';
        } else if (error.message.includes('validation')) {
          errorMessage = 'The entered data is invalid. Please check the details and try again.';
        }
      }
      
      Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', subcategory: '', price: '', description: '', category: '' });
    setDynamicFields({});
    setDynamicErrors({});
    setErrors({});
    setHasDiamond(false);
    setHasSideStones(false);
    setImages([]);
    setShowBrandModal(false);
    setShowModelModal(false);
    setShowCategoryModal(false);
    setShowDynamicModals({});
  };

  return {
    formData,
    dynamicFields,
    errors,
    dynamicErrors,
    hasDiamond,
    hasSideStones,
    loading,
    handleChange,
    handleDynamicChange,
    handleDiamondToggle,
    handleSideStonesToggle,
    handleImageChange,
    handleSubmit,
    productTypeOptions,
    brandOptions,
    modelOptions,
    showBrandModal,
    setShowBrandModal,
    showModelModal,
    setShowModelModal,
    showCategoryModal,
    setShowCategoryModal,
    showDynamicModals,
    setShowDynamicModals,
    resetForm,
    images,
    removeImage
  };
}