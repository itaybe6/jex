import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator, TouchableOpacity, Alert, Modal, FlatList, TextInput } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from 'lib/supabaseApi';

type ProductDetails = {
  id: string;
  title: string;
  price: number;
  description: string;
  user_id: string;
  product_images?: {
    id: string;
    image_url: string;
  }[];
  category: string;
};

const CATEGORIES = [
  'Watches',
  'Jewelry',
  'Diamonds',
  'Gold',
  'Other'
];

// Helper: mapping for friendly field names per table
const SPECS_LABELS: Record<string, Record<string, string>> = {
  watch_specs: {
    brand: 'Brand',
    model: 'Model',
    diameter: 'Diameter (mm)',
  },
  bracelet_specs: {
    subcategory: 'Subcategory',
    material: 'Material',
    gold_color: 'Gold Color',
    length: 'Length (cm)',
    clarity: 'Clarity',
    color: 'Color',
    weight: 'Weight (g)',
    has_diamond: 'Has Diamond',
    diamond_weight: 'Diamond Weight (ct)',
    gold_karat: 'Gold Karat',
    cut_grade: 'Cut Grade',
    certification: 'Certification',
    side_stones_d: 'Side Stones',
  },
  necklace_specs: {
    subcategory: 'Subcategory',
    material: 'Material',
    gold_color: 'Gold Color',
    length: 'Length (cm)',
    weight: 'Weight (g)',
    has_diamond: 'Has Diamond',
    diamond_weight: 'Diamond Weight (ct)',
    gold_karat: 'Gold Karat',
    color: 'Color',
    clarity: 'Clarity',
    cut_grade: 'Cut Grade',
    certification: 'Certification',
    side_stones_d: 'Side Stones',
  },
  earring_specs: {
    subcategory: 'Subcategory',
    material: 'Material',
    gold_color: 'Gold Color',
    clarity: 'Clarity',
    color: 'Color',
    certification: 'Certification',
    weight: 'Weight (g)',
    has_diamond: 'Has Diamond',
    diamond_weight: 'Diamond Weight (ct)',
    gold_karat: 'Gold Karat',
    cut_grade: 'Cut Grade',
    side_stones_d: 'Side Stones',
  },
  ring_specs: {
    subcategory: 'Subcategory',
    color: 'Color',
    clarity: 'Clarity',
    gold_color: 'Gold Color',
    material: 'Material',
    side_stones: 'Has Side Stones',
    cut_grade: 'Cut Grade',
    certification: 'Certification',
    weight: 'Weight (g)',
    has_diamond: 'Has Diamond',
    diamond_weight: 'Diamond Weight (ct)',
    gold_karat: 'Gold Karat',
    side_stones_d: 'Side Stones',
  },
  special_piece_specs: {
    subcategory: 'Subcategory',
    material: 'Material',
    gold_color: 'Gold Color',
    description: 'Description',
    weight: 'Weight (g)',
    has_diamond: 'Has Diamond',
    diamond_weight: 'Diamond Weight (ct)',
    gold_karat: 'Gold Karat',
    color: 'Color',
    clarity: 'Clarity',
    cut_grade: 'Cut Grade',
    certification: 'Certification',
    side_stones_d: 'Side Stones',
  },
  gem_specs: {
    type: 'Type',
    origin: 'Origin',
    has_certification: 'Has Certification',
    weight: 'Weight (ct)',
    shape: 'Shape',
    clarity: 'Clarity',
    transparency: 'Transparency',
    dimensions: 'Dimensions',
    certification: 'Certification',
  },
  loose_diamonds_specs: {
    weight: 'Weight (ct)',
    clarity: 'Clarity',
    color: 'Color',
    shape: 'Shape',
    cut: 'Cut',
    certificate: 'Certificate',
    fluorescence: 'Fluorescence',
    polish: 'Polish',
    symmetry: 'Symmetry',
    origin_type: 'Origin Type',
  },
  rough_diamond_specs: {
    weight: 'Weight (ct)',
    clarity: 'Clarity',
    color: 'Color',
  },
};

const SPECS_SECTION_TITLE: Record<string, string> = {
  watch_specs: 'Watch Details',
  bracelet_specs: 'Bracelet Details',
  necklace_specs: 'Necklace Details',
  earring_specs: 'Earring Details',
  ring_specs: 'Ring Details',
  special_piece_specs: 'Special Piece Details',
  gem_specs: 'Gem Details',
  loose_diamonds_specs: 'Loose Diamond Details',
  rough_diamond_specs: 'Rough Diamond Details',
};

// Add a Field component for consistent display
const Field = ({ label, value }: { label: string; value: any }) => (
  value !== null && value !== '' ? (
    <View style={styles.formSection}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.input}>{String(value)}</Text>
    </View>
  ) : null
);

export default function ProductScreen() {
  const { id } = useLocalSearchParams();
  const { user, accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [specs, setSpecs] = useState<any>(null);
  const [specsLoading, setSpecsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saleModalVisible, setSaleModalVisible] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [selectedBuyer, setSelectedBuyer] = useState<any>(null);
  const [saleError, setSaleError] = useState<string | null>(null);
  const [saleLoading, setSaleLoading] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (product && product.category) {
      fetchSpecs(product.category);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  const fetchProduct = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!id) {
        setError('No product ID provided');
        setLoading(false);
        return;
      }
      const url = `${SUPABASE_URL}/rest/v1/products?id=eq.${id}&select=*,product_images(id,image_url)`;
      const res = await fetch(url, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch product');
      const data = await res.json();
      console.log('Fetched product:', data);
      const product = data[0];
      if (!product) {
        setError('Product not found');
        setLoading(false);
        return;
      }
      console.log('Product category:', product.category);
      setProduct(product);
      setTitle(product.title || '');
      setDescription(product.description || '');
      setPrice(product.price ? product.price.toString() : '');
      const imageUrls = product.product_images?.map((img: any) => img.image_url) || [];
      setImageUrls(imageUrls);
    } catch (error) {
      setError('Failed to load product. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecs = async (category: string) => {
    setSpecsLoading(true);
    setSpecs(null);
    setError(null);
    // Map category to table name
    const categoryToTable: Record<string, string> = {
      Watches: 'watch_specs',
      Jewelry: 'ring_specs',
      Rings: 'ring_specs',
      Necklaces: 'necklace_specs',
      Bracelets: 'bracelet_specs',
      Earrings: 'earring_specs',
      Diamonds: 'gem_specs',
      Gems: 'gem_specs',
      'Loose Diamond': 'loose_diamonds_specs',
      Ring: 'ring_specs',
      'Rough Diamond': 'rough_diamond_specs',
      Gold: 'special_piece_specs',
      Other: 'special_piece_specs',
      // Add more mappings as needed
    };
    const table = categoryToTable[category] || null;
    if (!table) {
      setSpecsLoading(false);
      setSpecs(null);
      return;
    }
    try {
      const url = `${SUPABASE_URL}/rest/v1/${table}?product_id=eq.${id}`;
      const res = await fetch(url, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch specs');
      const data = await res.json();
      console.log('Fetched specs:', table, data);
      setSpecs(data[0] || null);
    } catch (error) {
      setError('Failed to load product details.');
    } finally {
      setSpecsLoading(false);
    }
  };

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        const base64Image = result.assets[0].base64;
        const filePath = `products/${user?.id}/${Date.now()}.jpg`;

        // TODO: Replace with fetch-based migration
        // const { error: uploadError } = await supabase.storage
        //   .from('products')
        //   .upload(filePath, decode(base64Image), {
        //     contentType: 'image/jpeg',
        //     upsert: true,
        //   });

        if (false) throw new Error('Upload error');

        const { data: { publicUrl } } = { data: { publicUrl: 'https://example.com/image.jpg' } };

        setImageUrls([publicUrl]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to upload image');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!user || !product) return;

    if (!title.trim() || !price.trim() || imageUrls.length === 0) {
      Alert.alert('Error', 'Please fill in all required fields and add at least one image');
      return;
    }

    setSaving(true);
    try {
      // Update the product details
      const res = await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${product.id}&user_id=eq.${user.id}`, {
        method: 'PATCH',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation'
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          price: parseFloat(price),
        })
      });
      if (!res.ok) throw new Error('Product update error');

      // Delete all existing images
      await fetch(`${SUPABASE_URL}/rest/v1/product_images?product_id=eq.${product.id}`, {
        method: 'DELETE',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
        },
      });

      // Insert new images
      for (const url of imageUrls) {
        const imgRes = await fetch(`${SUPABASE_URL}/rest/v1/product_images`, {
          method: 'POST',
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation'
          },
          body: JSON.stringify({
            product_id: product.id,
            image_url: url
          })
        });
        if (!imgRes.ok) throw new Error('Image insert error');
      }

      Alert.alert('Success', 'Product updated successfully');
      router.back();
    } catch (error) {
      console.error('Error updating product:', error);
      Alert.alert('Error', 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !product) return;

    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete product
              const res = await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${product.id}&user_id=eq.${user.id}`, {
                method: 'DELETE',
                headers: {
                  apikey: SUPABASE_ANON_KEY,
                  Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
                },
              });
              if (!res.ok) throw new Error('Product delete error');

              // Delete product images
              await fetch(`${SUPABASE_URL}/rest/v1/product_images?product_id=eq.${product.id}`, {
                method: 'DELETE',
                headers: {
                  apikey: SUPABASE_ANON_KEY,
                  Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
                },
              });

              Alert.alert('Success', 'Product deleted successfully');
              router.back();
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('Error', 'Failed to delete product');
            }
          }
        }
      ]
    );
  };

  const handleMarkAsSold = async () => {
    if (!user || !product) return;

    Alert.alert(
      'Mark as Sold',
      'Are you sure you want to mark this product as sold? This will remove it from your catalog.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Mark as Sold',
          onPress: async () => {
            try {
              const res = await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${product.id}&user_id=eq.${user.id}`, {
                method: 'PATCH',
                headers: {
                  apikey: SUPABASE_ANON_KEY,
                  Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
                  'Content-Type': 'application/json',
                  Prefer: 'return=representation'
                },
                body: JSON.stringify({ status: 'sold' })
              });
              if (!res.ok) throw new Error('Product mark as sold error');

              Alert.alert('Success', 'Product marked as sold');
              router.back();
            } catch (error) {
              console.error('Error marking product as sold:', error);
              Alert.alert('Error', 'Failed to mark product as sold');
            }
          }
        }
      ]
    );
  };

  const searchProfiles = async (query: string) => {
    setUserSearchLoading(true);
    setSaleError(null);
    try {
      if (!query.trim()) {
        setUserSearchResults([]);
        setUserSearchLoading(false);
        return;
      }
      const url = `${SUPABASE_URL}/rest/v1/profiles?select=id,full_name,avatar_url,title&full_name=ilike.*${query.trim()}*&limit=20`;
      const res = await fetch(url, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      setUserSearchResults(Array.isArray(data) ? data.filter((u: any) => u.id !== user?.id) : []);
    } catch (error) {
      setSaleError('שגיאה בחיפוש משתמשים');
      setUserSearchResults([]);
    } finally {
      setUserSearchLoading(false);
    }
  };

  useEffect(() => {
    if (saleModalVisible && userSearch.length > 0) {
      const timer = setTimeout(() => {
        searchProfiles(userSearch);
      }, 300);
      return () => clearTimeout(timer);
    } else if (!userSearch) {
      setUserSearchResults([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userSearch, saleModalVisible]);

  const checkPendingTransaction = async (buyerId: string) => {
    if (!product?.id) return false;
    const url = `${SUPABASE_URL}/rest/v1/transactions?product_id=eq.${product.id}&buyer_id=eq.${buyerId}&status=eq.pending&select=id`;
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
      },
    });
    const data = await res.json();
    return Array.isArray(data) && data.length > 0;
  };

  const handleStartSale = async () => {
    if (!selectedBuyer || !user || !product) return;
    setSaleLoading(true);
    setSaleError(null);
    try {
      // Prevent duplicate pending transaction
      const exists = await checkPendingTransaction(selectedBuyer.id);
      if (exists) {
        setSaleError('A pending transaction with this user for this product already exists.');
        setSaleLoading(false);
        return;
      }
      // Fetch seller profile (for avatar and name)
      let sellerName = user.full_name || user.user_metadata?.full_name || '';
      let sellerAvatar = user.avatar_url || user.user_metadata?.avatar_url || null;
      // If missing, fetch from profiles table
      if (!sellerAvatar || !sellerName) {
        try {
          const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=full_name,avatar_url`, {
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
            },
          });
          const profileData = await profileRes.json();
          if (profileData && profileData.length > 0) {
            if (!sellerName) sellerName = profileData[0].full_name;
            if (!sellerAvatar) sellerAvatar = profileData[0].avatar_url;
          }
        } catch (e) {
          // fallback: do nothing
        }
      }
      // Debug: Log avatar sources
      console.log('Avatar debug:', { direct: user.avatar_url, metadata: user.user_metadata?.avatar_url, user });
      // Fetch product image
      let productImage = product.product_images && product.product_images.length > 0 ? product.product_images[0].image_url : null;
      // Debug: Log seller info before sending notification
      console.log('Sending notification with seller info:', { sellerName, sellerAvatar, user });
      // Create transaction
      const txRes = await fetch(`${SUPABASE_URL}/rest/v1/transactions`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          seller_id: user.id,
          buyer_id: selectedBuyer.id,
          product_id: product.id,
          status: 'pending',
          created_at: new Date().toISOString(),
        }),
      });
      const txData = await txRes.json();
      if (!txRes.ok) throw new Error(txData?.message || 'Error creating transaction');
      // Send notification to buyer
      await fetch(`${SUPABASE_URL}/rest/v1/notifications`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: selectedBuyer.id,
          type: 'transaction_offer',
          product_id: product.id,
          data: {
            message: `The seller has offered you a deal for the product "${product.title}"`,
            seller_id: user.id,
            seller_name: sellerName,
            seller_avatar_url: sellerAvatar,
            product_title: product.title,
            product_image_url: productImage,
          },
          read: false,
        }),
      });
      setSaleModalVisible(false);
      setSelectedBuyer(null);
      setUserSearch('');
      setUserSearchResults([]);
      Alert.alert('Success', 'Sale offer sent successfully!');
    } catch (error: any) {
      setSaleError(error?.message || 'Error starting sale');
    } finally {
      setSaleLoading(false);
    }
  };

  if (loading || specsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0E2657" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: 'red', fontSize: 16 }}>{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <Stack.Screen
        options={{
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTintColor: '#0E2657',
          headerTitle: 'Product',
          headerTitleStyle: {
            color: '#0E2657',
            fontSize: 18,
            fontWeight: '600',
          },
          headerShadowVisible: true,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.replace('/(tabs)/profile')} style={{ paddingHorizontal: 8 }}>
              <Ionicons name="arrow-back" size={24} color="#0E2657" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            !editMode && user?.id === product?.user_id ? (
              <TouchableOpacity onPress={() => setEditMode(true)} style={{ paddingHorizontal: 8 }}>
                <Ionicons name="create-outline" size={22} color="#0E2657" />
              </TouchableOpacity>
            ) : null
          ),
        }}
      />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imagesContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.imagesScrollContainer}
          >
            {imageUrls && imageUrls.length > 0 ? (
              imageUrls.map((url, index) => (
                <View key={url} style={styles.imageWrapper}>
                  <Image
                    source={{ uri: url }}
                    style={styles.image}
                    onError={(error) => console.log('Image loading error:', error)}
                  />
                  {editMode && (
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => handleRemoveImage(index)}
                    >
                      <Ionicons name="close" size={16} color="#fff" />
                    </TouchableOpacity>
                  )}
                </View>
              ))
            ) : null}
            {editMode && (
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={handleImagePick}
              >
                <Ionicons name="camera" size={32} color="#7B8CA6" />
                <Text style={styles.addImageText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.formSection}>
            <Text style={styles.label}>Product Name</Text>
            {editMode ? (
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter product name"
                placeholderTextColor="#7B8CA6"
              />
            ) : (
              <Text style={styles.input}>{product?.title}</Text>
            )}
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>Description</Text>
            {editMode ? (
              <TextInput
                style={[styles.input, styles.descriptionInput]}
                value={description}
                onChangeText={setDescription}
                placeholder="Enter product description"
                placeholderTextColor="#7B8CA6"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            ) : (
              <Text style={[styles.input, { minHeight: 60 }]}>{product?.description}</Text>
            )}
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>Price</Text>
            {editMode ? (
              <View style={styles.priceInputContainer}>
                <Ionicons name="pricetag" size={20} color="#7B8CA6" style={styles.priceIcon} />
                <TextInput
                  style={styles.priceInput}
                  value={price}
                  onChangeText={setPrice}
                  placeholder="0.00"
                  placeholderTextColor="#7B8CA6"
                  keyboardType="decimal-pad"
                />
              </View>
            ) : (
              <Text style={styles.input}>{product?.price?.toLocaleString()} ₪</Text>
            )}
          </View>
        </View>
        {/* Specs Section */}
        {specs && (
          <View style={styles.formContainer}>
            <Text style={[styles.label, { fontSize: 18, marginBottom: 8 }]}> 
              {SPECS_SECTION_TITLE[product?.category?.toLowerCase() + '_specs'] || 'Product Details'}
            </Text>
            {/* Generic fields for all specs */}
            {Object.entries(specs).map(([key, value]) => {
              if (["id", "product_id", "created_at", "has_side_stones", "has_diamond", "material", "gold_karat", "gold_color"].includes(key)) return null;
              if (value === null || value === '') return null;
              const tableKey = product?.category?.toLowerCase() + '_specs';
              const label = SPECS_LABELS[tableKey]?.[key] || key;
              if (key.endsWith('_d') && typeof value === 'object' && value !== null) {
                return (
                  <Field key={key} label={label} value={JSON.stringify(value, null, 2)} />
                );
              }
              return <Field key={key} label={label} value={value} />;
            })}
            {/* material === 'gold' */}
            {specs.material && specs.material.toLowerCase() === 'gold' && (
              <>
                {specs.gold_karat && <Field label="Gold Karat" value={specs.gold_karat} />}
                {specs.gold_color && <Field label="Gold Color" value={specs.gold_color} />}
              </>
            )}
            {/* has_diamond */}
            {specs.has_diamond && (
              <>
                {specs.diamond_weight && <Field label="Diamond Weight" value={specs.diamond_weight} />}
                {specs.cut_grade && <Field label="Cut Grade" value={specs.cut_grade} />}
                {specs.certification && <Field label="Certification" value={specs.certification} />}
              </>
            )}
            {/* has_side_stones */}
            {specs.has_side_stones && specs.side_stones_details && (
              <Field label="Side Stones Details" value={JSON.stringify(specs.side_stones_details, null, 2)} />
            )}
          </View>
        )}
        {/* --- Start Sale Button --- */}
        {user?.id === product?.user_id && !editMode && (
          <View style={{ marginHorizontal: 16, marginTop: 16 }}>
            <TouchableOpacity
              style={{
                backgroundColor: '#0E2657',
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
              }}
              onPress={() => setSaleModalVisible(true)}
            >
              <Ionicons name="swap-horizontal" size={22} color="#fff" style={{ marginRight: 8 }} />
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Start Sale</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      {editMode && (
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            onPress={async () => {
              await handleSave();
              setEditMode(false);
            }}
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            disabled={saving}
          >
            <Ionicons name="checkmark" size={22} color="#fff" style={styles.saveIcon} strokeWidth={2.5} />
            <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
          </TouchableOpacity>
        </View>
      )}
      {/* --- Sale Modal --- */}
      <Modal
        visible={saleModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setSaleModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '90%', maxWidth: 400 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12, color: '#0E2657' }}>בחר קונה</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 }}
              placeholder="חפש משתמש לפי שם..."
              value={userSearch}
              onChangeText={setUserSearch}
              autoFocus
            />
            {userSearchLoading ? (
              <ActivityIndicator size="small" color="#0E2657" />
            ) : (
              <FlatList
                data={userSearchResults}
                keyExtractor={item => item.id}
                style={{ maxHeight: 200, marginBottom: 8 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4, backgroundColor: selectedBuyer?.id === item.id ? '#F5F8FC' : 'transparent', borderRadius: 8 }}
                    onPress={() => setSelectedBuyer(item)}
                  >
                    <Image source={{ uri: item.avatar_url || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=800&auto=format&fit=crop&q=60' }} style={{ width: 36, height: 36, borderRadius: 18, marginRight: 10 }} />
                    <View>
                      <Text style={{ fontSize: 16, color: '#0E2657', fontWeight: '500' }}>{item.full_name}</Text>
                      {item.title && <Text style={{ fontSize: 13, color: '#7B8CA6' }}>{item.title}</Text>}
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={userSearch.length > 0 && !userSearchLoading ? (
                  <Text style={{ color: '#7B8CA6', textAlign: 'center', marginTop: 12 }}>לא נמצאו משתמשים</Text>
                ) : null}
              />
            )}
            {saleError && <Text style={{ color: 'red', marginBottom: 8 }}>{saleError}</Text>}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
              <TouchableOpacity onPress={() => setSaleModalVisible(false)} style={{ marginRight: 16 }}>
                <Text style={{ color: '#0E2657', fontSize: 16 }}>ביטול</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleStartSale}
                disabled={!selectedBuyer || saleLoading}
                style={{ backgroundColor: selectedBuyer ? '#0E2657' : '#B0B8C1', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 20 }}
              >
                <Text style={{ color: '#fff', fontSize: 16 }}>{saleLoading ? 'שולח...' : 'אישור'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  imagesContainer: {
    marginBottom: 20,
  },
  imagesScrollContainer: {
    gap: 12,
  },
  imageWrapper: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 4,
  },
  addImageButton: {
    width: 120,
    height: 120,
    backgroundColor: '#F5F8FC',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageText: {
    color: '#7B8CA6',
    fontSize: 14,
    marginTop: 8,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 20,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  actionButton: {
    padding: 4,
  },
  saveButton: {
    backgroundColor: '#0E2657',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveIcon: {
    marginRight: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 20,
    shadowColor: '#0E2657',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  formSection: {
    gap: 8,
  },
  label: {
    color: '#0E2657',
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#F5F8FC',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#0E2657',
  },
  descriptionInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F8FC',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  priceIcon: {
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#0E2657',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 16,
    paddingRight: 8,
  },
  headerButton: {
    padding: 4,
  },
});