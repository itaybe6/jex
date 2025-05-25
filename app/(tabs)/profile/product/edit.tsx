import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, ActivityIndicator, Image } from 'react-native';
import { FILTER_FIELDS_BY_CATEGORY, CATEGORY_LABELS } from '@/constants/filters';
import { FilterField, FilterState } from '@/types/filter';
import { Select } from '@/components/Select';
import { useLocalSearchParams } from 'expo-router';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from 'lib/supabaseApi';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { useAuth } from '@/hooks/useAuth';
import { router } from 'expo-router';

const CATEGORY_OPTIONS = Object.keys(FILTER_FIELDS_BY_CATEGORY);

function getInitialState(fields: FilterField[]): FilterState {
  const state: FilterState = {};
  fields.forEach(field => {
    if (field.type === 'multi-select') state[field.key] = [];
    else if (field.type === 'boolean') state[field.key] = false;
    else state[field.key] = '';
    if (field.subFields) {
      Object.assign(state, getInitialState(field.subFields));
    }
  });
  return state;
}

function getSpecsTableByCategory(category: string): string | null {
  switch (category) {
    case 'Watches': return 'watch_specs';
    case 'Ring':
    case 'Rings':
    case 'Jewelry': return 'ring_specs';
    case 'Necklace':
    case 'Necklaces': return 'necklace_specs';
    case 'Bracelet':
    case 'Bracelets': return 'bracelet_specs';
    case 'Earrings': return 'earring_specs';
    case 'Diamonds':
    case 'Gems': return 'gem_specs';
    case 'Loose Diamond': return 'loose_diamonds_specs';
    case 'Rough Diamond': return 'rough_diamond_specs';
    case 'Gold':
    case 'Special piece':
    case 'Special pieces':
    case 'special_piece':
    case 'special pieces':
    case 'מוצר מיוחד': return 'special_piece_specs';
    default: return null;
  }
}

export default function EditProductScreen() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);
  const [category, setCategory] = useState<string>('');
  const [fields, setFields] = useState<FilterField[]>([]);
  const [form, setForm] = useState<FilterState>({});
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [images, setImages] = useState<{ id?: string; url: string; isNew?: boolean }[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);
  const { user, accessToken } = useAuth();

  useEffect(() => {
    if (id) {
      const productId = Array.isArray(id) ? id[0] : id;
      fetchProduct(productId);
    }
  }, [id]);

  const fetchProduct = async (productId: string) => {
    setLoading(true);
    try {
      const url = `${SUPABASE_URL}/rest/v1/products?id=eq.${productId}&select=*,product_images(id,image_url)`;
      const res = await fetch(url, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
        },
      });
      const data = await res.json();
      const prod = data[0];
      setProduct(prod);
      setTitle(prod?.title || '');
      setDescription(prod?.description || '');
      setPrice(prod?.price ? prod.price.toString() : '');
      setImages(
        prod?.product_images?.map((img: any) => ({ id: img.id, url: img.image_url })) || []
      );
      if (prod?.category) {
        setCategory(prod.category);
        const catFields = FILTER_FIELDS_BY_CATEGORY[prod.category] || [];
        const specsTable = getSpecsTableByCategory(prod.category);
        let specs = {};
        if (specsTable) {
          const specsUrl = `${SUPABASE_URL}/rest/v1/${specsTable}?product_id=eq.${prod.id}`;
          const specsRes = await fetch(specsUrl, {
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
            },
          });
          const specsData = await specsRes.json();
          if (Array.isArray(specsData) && specsData.length > 0) {
            specs = specsData[0];
          }
        }
        const merged = { ...prod, ...specs };
        const initial: FilterState = {};
        catFields.forEach(field => {
          let value = merged[field.key];
          if (field.type === 'multi-select') {
            if (Array.isArray(value)) {
              initial[field.key] = value;
            } else if (typeof value === 'string') {
              initial[field.key] = value.split(',').map(v => v.trim()).filter(Boolean);
            } else {
              initial[field.key] = [];
            }
          } else if (field.type === 'boolean') {
            initial[field.key] = !!value;
          } else {
            initial[field.key] = value !== undefined && value !== null ? value : '';
          }
          if (field.subFields) {
            field.subFields.forEach(sub => {
              let subValue = merged[sub.key];
              if (sub.type === 'multi-select') {
                if (Array.isArray(subValue)) {
                  initial[sub.key] = subValue;
                } else if (typeof subValue === 'string') {
                  initial[sub.key] = subValue.split(',').map(v => v.trim()).filter(Boolean);
                } else {
                  initial[sub.key] = [];
                }
              } else if (sub.type === 'boolean') {
                initial[sub.key] = !!subValue;
              } else {
                initial[sub.key] = subValue !== undefined && subValue !== null ? subValue : '';
              }
            });
          }
        });
        setForm(initial);
      }
    } catch (e) {
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    const catFields = FILTER_FIELDS_BY_CATEGORY[cat] || [];
    setFields(catFields);
    setForm(getInitialState(catFields));
  };

  const handleFieldChange = (key: string, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleMultiSelect = (key: string, option: string) => {
    setForm(prev => {
      const arr = Array.isArray(prev[key]) ? prev[key] as string[] : [];
      if (arr.includes(option)) {
        return { ...prev, [key]: arr.filter(v => v !== option) };
      } else {
        return { ...prev, [key]: [...arr, option] };
      }
    });
  };

  const isFieldVisible = (field: FilterField) => {
    if (!field.condition) return true;
    const selected = form[field.condition.field];
    if (!selected) return false;
    if (Array.isArray(selected)) {
      return field.condition.includes.some(val => selected.includes(val));
    }
    return field.condition.includes.includes(selected as string);
  };

  const renderField = (field: FilterField) => {
    if (!isFieldVisible(field)) return null;
    switch (field.type) {
      case 'multi-select':
        return (
          <View key={field.key} style={styles.fieldSection}>
            <Text style={styles.label}>{field.label}</Text>
            <View style={styles.chipContainer}>
              {field.options?.map(option => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.chip,
                    (form[field.key] as string[]).includes(option) && styles.chipSelected
                  ]}
                  onPress={() => handleMultiSelect(field.key, option)}
                >
                  <Text style={[
                    styles.chipText,
                    (form[field.key] as string[]).includes(option) && styles.chipTextSelected
                  ]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 'range':
        return (
          <View key={field.key} style={styles.fieldSection}>
            <Text style={styles.label}>{field.label}</Text>
            <View style={styles.rangeRow}>
              <TextInput
                style={styles.input}
                placeholder="From"
                keyboardType="numeric"
                value={form[`${field.key}_from`] as string || ''}
                onChangeText={text => handleFieldChange(`${field.key}_from`, text)}
              />
              <Text style={{ marginHorizontal: 8 }}>-</Text>
              <TextInput
                style={styles.input}
                placeholder="To"
                keyboardType="numeric"
                value={form[`${field.key}_to`] as string || ''}
                onChangeText={text => handleFieldChange(`${field.key}_to`, text)}
              />
            </View>
          </View>
        );
      case 'boolean':
        return (
          <View key={field.key} style={styles.fieldSection}>
            <Text style={styles.label}>{field.label}</Text>
            <TouchableOpacity
              style={[styles.toggle, form[field.key] ? styles.toggleOn : null]}
              onPress={() => handleFieldChange(field.key, !form[field.key])}
            >
              <Text style={styles.toggleText}>{form[field.key] ? 'כן' : 'לא'}</Text>
            </TouchableOpacity>
            {form[field.key] && field.subFields?.map(renderField)}
          </View>
        );
      case 'text':
      case 'number':
        return (
          <View key={field.key} style={styles.fieldSection}>
            <Text style={styles.label}>{field.label}</Text>
            <TextInput
              style={styles.input}
              value={form[field.key] as string || ''}
              onChangeText={text => handleFieldChange(field.key, text)}
              keyboardType={field.type === 'number' ? 'numeric' : 'default'}
            />
          </View>
        );
      default:
        return null;
    }
  };

  const handleAddPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
        allowsMultipleSelection: true,
        selectionLimit: 5,
      });
      if (!result.canceled && result.assets) {
        const newImages: { url: string; isNew: boolean; base64: string }[] = [];
        for (const asset of result.assets) {
          if (!asset.base64) continue;
          newImages.push({ url: asset.uri, isNew: true, base64: asset.base64 });
        }
        setImages(prev => [...prev, ...newImages]);
      }
    } catch (error) {
      Alert.alert('שגיאה', 'העלאת תמונה נכשלה');
    }
  };

  const handleRemoveImage = async (index: number) => {
    const img = images[index];
    if (img.id) {
      setDeletedImageIds(prev => [...prev, img.id!]);
    }
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const updateProduct = async () => {
    if (!product) return;
    if (!title.trim() || !price.trim() || images.length === 0) {
      Alert.alert('Error', 'Please fill in all required fields and add at least one image');
      return;
    }
    try {
      // 1. עדכון products
      const patchUrl = `${SUPABASE_URL}/rest/v1/products?id=eq.${product.id}`;
      const patchBody: any = {
        title: title.trim(),
        description: description.trim(),
        price: parseFloat(price),
        category,
      };
      const res = await fetch(patchUrl, {
        method: 'PATCH',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation'
        },
        body: JSON.stringify(patchBody)
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error('Product update error: ' + errText);
      }
      for (const imgId of deletedImageIds) {
        await fetch(`${SUPABASE_URL}/rest/v1/product_images?id=eq.${imgId}`, {
          method: 'DELETE',
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
          },
        });
      }
      for (const img of images) {
        if (img.isNew && (img as any).base64) {
          const filePath = `products/${product.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
          const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/product-images/${filePath}`, {
            method: 'POST',
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/octet-stream',
            },
            body: decode((img as any).base64)
          });
          if (!uploadRes.ok) {
            const err = await uploadRes.text();
            console.error('Error uploading image:', err);
            continue;
          }
          const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/product-images/${filePath}`;
          await fetch(`${SUPABASE_URL}/rest/v1/product_images`, {
            method: 'POST',
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
              Prefer: 'return=representation'
            },
            body: JSON.stringify({ product_id: product.id, image_url: publicUrl })
          });
        } else if (!img.id) {
          await fetch(`${SUPABASE_URL}/rest/v1/product_images`, {
            method: 'POST',
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
              Prefer: 'return=representation'
            },
            body: JSON.stringify({ product_id: product.id, image_url: img.url })
          });
        }
      }
      Alert.alert('Success', 'Product updated successfully');
      setDeletedImageIds([]);
      router.replace(`/(tabs)/profile/product/${product.id}`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update product');
    }
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;
  if (!product) return <Text>לא נמצא מוצר</Text>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <View style={styles.fieldSection}>
        <Text style={styles.label}>Product Name</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Enter product name"
        />
      </View>
      <View style={styles.fieldSection}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, { minHeight: 60 }]}
          value={description}
          onChangeText={setDescription}
          placeholder="Enter product description"
          multiline
        />
      </View>
      <View style={styles.fieldSection}>
        <Text style={styles.label}>Price</Text>
        <TextInput
          style={styles.input}
          value={price}
          onChangeText={setPrice}
          placeholder="0.00"
          keyboardType="decimal-pad"
        />
      </View>
      <View style={{ marginBottom: 20 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
          {images.map((img, idx) => (
            <View key={img.url + idx} style={{ position: 'relative', width: 120, height: 120, borderRadius: 12, overflow: 'hidden' }}>
              <Image source={{ uri: img.url }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
              <TouchableOpacity
                style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, padding: 4 }}
                onPress={() => handleRemoveImage(idx)}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            style={{ width: 120, height: 120, backgroundColor: '#F5F8FC', borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}
            onPress={handleAddPhoto}
          >
            <Text style={{ fontSize: 32, color: '#7B8CA6' }}>+</Text>
            <Text style={{ color: '#7B8CA6', fontSize: 14, marginTop: 8 }}>Add Photo</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      <TouchableOpacity
        style={styles.saveButton}
        onPress={updateProduct}
      >
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  fieldSection: {
    marginBottom: 18,
  },
  label: {
    fontSize: 16,
    color: '#0E2657',
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#F5F8FC',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#0E2657',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#E3EAF3',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    backgroundColor: '#0E2657',
  },
  chipText: {
    color: '#0E2657',
    fontSize: 15,
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toggle: {
    backgroundColor: '#E3EAF3',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 18,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  toggleOn: {
    backgroundColor: '#0E2657',
  },
  toggleText: {
    color: '#0E2657',
    fontSize: 15,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#0E2657',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
}); 