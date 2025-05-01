import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { decode } from 'base64-arraybuffer';
import watchModels from '@/lib/watch-models.json';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

interface ImageData {
  uri: string;
  base64: string;
}

// Define watch models type
type WatchModelsType = typeof watchModels;

const PRODUCT_TYPES = [
  'Ring', 'Necklace', 'Bracelet', 'Earrings', 'Special pieces', 'Watches', 'Gems'
];

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

export default function useProductForm() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    description: '',
    category: '',
  });
  const [dynamicFields, setDynamicFields] = useState<Record<string, string>>({});
  const [dynamicErrors, setDynamicErrors] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [hasDiamond, setHasDiamond] = useState(false);
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
  const handleImageChange = async () => {
    try {
      if (typeof window === 'undefined') return;
      
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('We need access to your gallery to upload images');
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
        allowsMultipleSelection: true,
        selectionLimit: 5,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets
          .filter(asset => asset.base64)
          .map(asset => ({
            uri: asset.uri,
            base64: asset.base64!
          }));
        
        setImages(prev => [...prev, ...newImages]);
      }
    } catch (error) {
      alert('An error occurred while selecting images. Please try again.');
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // Validation (simplified for brevity)
  const validate = () => {
    const newErrors: Record<string, boolean> = {};
    
    if (!formData.category) newErrors.category = true;
    if (!formData.price) newErrors.price = true;
    if (!formData.description) newErrors.description = true;
    
    if (images.length === 0) {
      newErrors.images = true;
    }

    if (formData.category === 'Watches') {
      if (!dynamicFields.brand) newErrors.brand = true;
      if (!dynamicFields.model) newErrors.model = true;
      const diameter = Number(dynamicFields.diameter);
      if (!dynamicFields.diameter || isNaN(diameter) || diameter <= 0 || !(/^\d+(\.\d)?$/).test(dynamicFields.diameter)) {
        newErrors.diameter = true;
      }
    } else if (formData.category === 'Gems') {
      if (!dynamicFields.type) newErrors.type = true;
      if (!dynamicFields.origin) newErrors.origin = true;
      if (!dynamicFields.certification) newErrors.certification = true;
    } else {
      if (!formData.title) newErrors.title = true;
      if (!dynamicFields.material) newErrors.material = true;
      if (dynamicFields.material === 'Gold') {
        if (!dynamicFields.goldKarat) newErrors.goldKarat = true;
        if (!dynamicFields.goldColor) newErrors.goldColor = true;
      }
      if (!dynamicFields.weight || isNaN(Number(dynamicFields.weight)) || Number(dynamicFields.weight) <= 0) {
        newErrors.weight = true;
      }
      if (hasDiamond) {
        if (!dynamicFields.diamond_weight) newErrors.diamond_weight = true;
        if (!dynamicFields.diamond_color) newErrors.diamond_color = true;
        if (!dynamicFields.clarity) newErrors.clarity = true;
        if (!dynamicFields.side_stones) newErrors.side_stones = true;
        if (!dynamicFields.cut_grade) newErrors.cut_grade = true;
        if (!dynamicFields.certification) newErrors.certification = true;
      }
    }

    setErrors(newErrors);
    setDynamicErrors(newErrors);
    
    return Object.keys(newErrors).length === 0;
  };

  // Submit
  const handleSubmit = async () => {
    if (!validate()) return;
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

      const { data: product, error: productError } = await supabase
        .from('products')
        .insert(productInsertObj)
        .select()
        .single();

      if (productError || !product) throw productError || new Error('Product insert failed');

      // Upload all images and create product_images records
      for (const image of images) {
        const imagePath = `${user?.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
        
        // Upload image to storage
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(imagePath, decode(image.base64), {
            contentType: 'image/jpeg',
            upsert: true
          });
        
        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(imagePath);

        // Create product_images record
        const { error: imageRecordError } = await supabase
          .from('product_images')
          .insert({
            product_id: product.id,
            image_url: publicUrl
          });

        if (imageRecordError) throw imageRecordError;
      }

      // Success - reset form
      resetForm();
      router.replace('/');
    } catch (error) {
      alert('An error occurred while creating the product');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', price: '', description: '', category: '' });
    setDynamicFields({});
    setDynamicErrors({});
    setErrors({});
    setHasDiamond(false);
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
    loading,
    handleChange,
    handleDynamicChange,
    handleDiamondToggle,
    handleImageChange,
    handleSubmit,
    images,
    removeImage,
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
    resetForm
  };
} 