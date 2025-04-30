import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator, TouchableOpacity, Alert, Modal, FlatList, TextInput } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { ChevronRight, ArrowLeft, Camera, DollarSign, Check, X, Trash2, Tag } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

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
};

const CATEGORIES = [
  'Watches',
  'Jewelry',
  'Diamonds',
  'Gold',
  'Other'
];

export default function EditProductScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [showCategories, setShowCategories] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  useEffect(() => {
    console.log('Current imageUrls state:', imageUrls);
  }, [imageUrls]);

  const fetchProduct = async () => {
    try {
      if (!id) {
        console.error('No product ID provided');
        Alert.alert('Error', 'No product ID provided');
        return;
      }

      console.log('Attempting to fetch product with ID:', id);
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          title,
          description,
          price,
          user_id,
          product_images (
            id,
            image_url
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      if (!data) {
        console.error('No data returned from Supabase');
        Alert.alert('Error', 'Product not found');
        return;
      }
      
      console.log('Successfully fetched product data:', {
        id: data.id,
        title: data.title,
        hasDescription: !!data.description,
        hasImages: data.product_images?.length > 0
      });
      
      setProduct(data);
      setTitle(data.title || '');
      setDescription(data.description || '');
      setPrice(data.price ? data.price.toString() : '');
      
      // Get image URLs from product_images
      const imageUrls = data.product_images?.map(img => img.image_url) || [];
      setImageUrls(imageUrls);
      
      console.log('Set image URLs state:', imageUrls);
    } catch (error) {
      console.error('Detailed error when fetching product:', error);
      Alert.alert(
        'Error',
        'Failed to load product. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
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

        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(filePath, decode(base64Image), {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(filePath);

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
      // First update the product details
      const { error: productError } = await supabase
        .from('products')
        .update({
          title: title.trim(),
          description: description.trim(),
          price: parseFloat(price),
        })
        .eq('id', product.id)
        .eq('user_id', user.id);

      if (productError) throw productError;

      // Then update the product images
      // First delete all existing images
      const { error: deleteError } = await supabase
        .from('product_images')
        .delete()
        .eq('product_id', product.id);

      if (deleteError) throw deleteError;

      // Then insert new images
      const { error: insertError } = await supabase
        .from('product_images')
        .insert(
          imageUrls.map(url => ({
            product_id: product.id,
            image_url: url
          }))
        );

      if (insertError) throw insertError;

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
              const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', product.id)
                .eq('user_id', user.id);

              if (error) throw error;

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
              const { error } = await supabase
                .from('products')
                .update({ status: 'sold' })
                .eq('id', product.id)
                .eq('user_id', user.id);

              if (error) throw error;

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0E2657" />
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
          headerTitle: 'Edit Product',
          headerTitleStyle: {
            color: '#0E2657',
            fontSize: 18,
            fontWeight: '600',
          },
          headerShadowVisible: true,
          headerRight: () => (
            <View style={styles.headerButtons}>
              <TouchableOpacity 
                onPress={handleMarkAsSold}
                style={styles.headerButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Tag size={20} color="#4CAF50" strokeWidth={2} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={handleDelete}
                style={styles.headerButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Trash2 size={20} color="#DC2626" strokeWidth={2} />
              </TouchableOpacity>
            </View>
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
                  <TouchableOpacity 
                    style={styles.removeImageButton}
                    onPress={() => handleRemoveImage(index)}
                  >
                    <X size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))
            ) : null}
            <TouchableOpacity 
              style={styles.addImageButton}
              onPress={handleImagePick}
            >
              <Camera size={32} color="#7B8CA6" />
              <Text style={styles.addImageText}>Add Photo</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.formSection}>
            <Text style={styles.label}>Product Name</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter product name"
              placeholderTextColor="#7B8CA6"
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>Description</Text>
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
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>Price</Text>
            <View style={styles.priceInputContainer}>
              <DollarSign size={20} color="#7B8CA6" style={styles.priceIcon} />
              <TextInput
                style={styles.priceInput}
                value={price}
                onChangeText={setPrice}
                placeholder="0.00"
                placeholderTextColor="#7B8CA6"
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          onPress={handleSave}
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          disabled={saving}
        >
          <Check size={22} color="#fff" style={styles.saveIcon} strokeWidth={2.5} />
          <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>
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