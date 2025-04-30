import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { decode } from 'base64-arraybuffer';
import watchModels from '@/lib/watch-models.json';

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
  const [imageUri, setImageUri] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDynamicModals, setShowDynamicModals] = useState<Record<string, boolean>>({});

  // Options
  const productTypeOptions = PRODUCT_TYPES;
  const brandOptions = formData.category && productOptions[formData.category] ? productOptions[formData.category] : [];
  const modelOptions = (formData.category === 'Watches' && dynamicFields.brand && watchModels[dynamicFields.brand]) ? watchModels[dynamicFields.brand] : [];

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
      const ImagePicker = await import('expo-image-picker');
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
      alert('An error occurred while selecting the image. Please try again.');
    }
  };

  // Validation (simplified for brevity)
  const validate = () => {
    const newErrors: Record<string, boolean> = {};
    if (!formData.category) newErrors.category = true;
    if (!imageUri) newErrors.image = true;
    if (!formData.price) newErrors.price = true;
    if (!formData.description) newErrors.description = true;
    if (formData.category === 'Watches') {
      if (!dynamicFields.brand) newErrors.brand = true;
      if (!dynamicFields.model) newErrors.model = true;
      const diameter = Number(dynamicFields.diameter);
      if (!dynamicFields.diameter || isNaN(diameter) || diameter <= 0 || !(/^\d+(\.\d)?$/).test(dynamicFields.diameter)) {
        newErrors.diameter = true;
      }
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
              gold_karat: dynamicFields.material === 'Gold' ? dynamicFields.goldKarat : null,
              gold_color: dynamicFields.material === 'Gold' ? dynamicFields.goldColor : null,
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
      // Success - reset form
      resetForm();
      alert('Product added successfully!');
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
    setImageUri('');
    setImageBase64('');
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
    imageUri,
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