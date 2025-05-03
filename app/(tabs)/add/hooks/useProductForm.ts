import { useState, useEffect } from 'react';
// Removed all supabase imports due to migration to fetch-based supabaseApi
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
  'Ring', 'Necklace', 'Bracelet', 'Earrings', 'Special pieces', 'Watches', 'Gems', 'Rough Diamond'
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
      if (!dynamicFields.weight || isNaN(Number(dynamicFields.weight)) || Number(dynamicFields.weight) <= 0) {
        newErrors.weight = true;
      }
      if (!dynamicFields.shape) newErrors.shape = true;
      if (!dynamicFields.clarity) newErrors.clarity = true;
      if (!dynamicFields.dimensions) newErrors.dimensions = true;
      if (dynamicFields.hasCertification === 'true' && !dynamicFields.certification) {
        newErrors.certification = true;
      }
    } else if (formData.category === 'Rough Diamond') {
      if (!dynamicFields.weight || isNaN(Number(dynamicFields.weight)) || Number(dynamicFields.weight) <= 0) {
        newErrors.weight = true;
      }
      if (!dynamicFields.clarity) newErrors.clarity = true;
      if (!dynamicFields.color) newErrors.color = true;
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
      if (hasSideStones) {
        if (!dynamicFields.side_stones_weight) newErrors.side_stones_weight = true;
        if (!dynamicFields.side_stones_color) newErrors.side_stones_color = true;
        if (!dynamicFields.side_stones_clarity) newErrors.side_stones_clarity = true;
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

      // Insert product using fetch
      const productRes = await fetch('https://yjmppxihvkfcnptdvevi.supabase.co/rest/v1/products', {
        method: 'POST',
        headers: {
          apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqbXBweGlodmtmY25wdGR2ZXZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3NjYzNTgsImV4cCI6MjA1NzM0MjM1OH0.6r_Io46qV2xhDX7Oy1MxEPhsxwqn_-AqEMUNSO6_Wbs',
          Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqbXBweGlodmtmY25wdGR2ZXZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3NjYzNTgsImV4cCI6MjA1NzM0MjM1OH0.6r_Io46qV2xhDX7Oy1MxEPhsxwqn_-AqEMUNSO6_Wbs',
          'Content-Type': 'application/json',
          Prefer: 'return=representation'
        },
        body: JSON.stringify(productInsertObj)
      });
      if (!productRes.ok) throw new Error('Product insert failed');
      const [product] = await productRes.json();
      if (!product) throw new Error('Product insert failed');

      // TODO: Image upload to Supabase Storage is not possible with fetch and anon key directly from client. You may need a backend or use another service.
      // For now, skip image upload and product_images table.

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
        const specsRes = await fetch('https://yjmppxihvkfcnptdvevi.supabase.co/rest/v1/gem_specs', {
          method: 'POST',
          headers: {
            apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqbXBweGlodmtmY25wdGR2ZXZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3NjYzNTgsImV4cCI6MjA1NzM0MjM1OH0.6r_Io46qV2xhDX7Oy1MxEPhsxwqn_-AqEMUNSO6_Wbs',
            Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqbXBweGlodmtmY25wdGR2ZXZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3NjYzNTgsImV4cCI6MjA1NzM0MjM1OH0.6r_Io46qV2xhDX7Oy1MxEPhsxwqn_-AqEMUNSO6_Wbs',
            'Content-Type': 'application/json',
            Prefer: 'return=representation'
          },
          body: JSON.stringify(specsData)
        });
        if (!specsRes.ok) throw new Error('Error inserting gem specs');
      } else if (productType === 'Rough Diamond') {
        const specsData = {
          product_id: product.id,
          weight: dynamicFields.weight,
          clarity: dynamicFields.clarity,
          color: dynamicFields.color
        };
        const specsRes = await fetch('https://yjmppxihvkfcnptdvevi.supabase.co/rest/v1/rough_diamond_specs', {
          method: 'POST',
          headers: {
            apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqbXBweGlodmtmY25wdGR2ZXZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3NjYzNTgsImV4cCI6MjA1NzM0MjM1OH0.6r_Io46qV2xhDX7Oy1MxEPhsxwqn_-AqEMUNSO6_Wbs',
            Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqbXBweGlodmtmY25wdGR2ZXZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3NjYzNTgsImV4cCI6MjA1NzM0MjM1OH0.6r_Io46qV2xhDX7Oy1MxEPhsxwqn_-AqEMUNSO6_Wbs',
            'Content-Type': 'application/json',
            Prefer: 'return=representation'
          },
          body: JSON.stringify(specsData)
        });
        if (!specsRes.ok) throw new Error('Error inserting rough diamond specs');
      } else {
        // Handle other product types...
        const specsData: JewelrySpecsData = {
          product_id: product.id,
          material: dynamicFields.material,
          weight: dynamicFields.weight,
        };
        if (dynamicFields.material === 'Gold') {
          specsData.gold_karat = dynamicFields.goldKarat;
          specsData.gold_color = dynamicFields.goldColor;
        }
        if (hasDiamond) {
          specsData.diamond_details = {
            weight: dynamicFields.diamond_weight,
            color: dynamicFields.diamond_color,
            clarity: dynamicFields.clarity,
            cut_grade: dynamicFields.cut_grade,
            certification: dynamicFields.certification
          };
        }
        if (hasSideStones) {
          specsData.side_stones_details = {
            weight: dynamicFields.side_stones_weight,
            color: dynamicFields.side_stones_color,
            clarity: dynamicFields.side_stones_clarity
          };
        }
        // Insert into appropriate specs table
        let specsTable = productType.toLowerCase();
        if (specsTable === 'special pieces') {
          specsTable = 'special_piece';
        } else if (specsTable === 'earrings') {
          specsTable = 'earring';
        }
        specsTable += '_specs';
        const specsRes = await fetch(`https://yjmppxihvkfcnptdvevi.supabase.co/rest/v1/${specsTable}`, {
          method: 'POST',
          headers: {
            apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqbXBweGlodmtmY25wdGR2ZXZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3NjYzNTgsImV4cCI6MjA1NzM0MjM1OH0.6r_Io46qV2xhDX7Oy1MxEPhsxwqn_-AqEMUNSO6_Wbs',
            Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqbXBweGlodmtmY25wdGR2ZXZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3NjYzNTgsImV4cCI6MjA1NzM0MjM1OH0.6r_Io46qV2xhDX7Oy1MxEPhsxwqn_-AqEMUNSO6_Wbs',
            'Content-Type': 'application/json',
            Prefer: 'return=representation'
          },
          body: JSON.stringify(specsData)
        });
        if (!specsRes.ok) throw new Error(`Error inserting ${specsTable}`);
      }
      // Success - reset form and navigate
      resetForm();
      router.replace('/');
    } catch (error) {
      console.error('שגיאה ביצירת מוצר:', error);
      alert('An error occurred while creating the product. Please try again.');
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