import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, ActivityIndicator } from 'react-native';
import { FILTER_FIELDS_BY_CATEGORY, CATEGORY_LABELS } from '@/constants/filters';
import { FilterField, FilterState } from '@/types/filter';
import { Select } from '@/components/Select';
import { useLocalSearchParams } from 'expo-router';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from 'lib/supabaseApi';

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

  useEffect(() => {
    if (id) {
      const productId = Array.isArray(id) ? id[0] : id;
      fetchProduct(productId);
    }
  }, [id]);

  const fetchProduct = async (productId: string) => {
    setLoading(true);
    try {
      const url = `${SUPABASE_URL}/rest/v1/products?id=eq.${productId}&select=*`;
      const res = await fetch(url, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });
      const data = await res.json();
      const prod = data[0];
      setProduct(prod);
      setTitle(prod?.title || '');
      setDescription(prod?.description || '');
      setPrice(prod?.price ? prod.price.toString() : '');
      if (prod?.category) {
        setCategory(prod.category);
        const catFields = FILTER_FIELDS_BY_CATEGORY[prod.category] || [];
        setFields(catFields);
        const initial: FilterState = {};
        catFields.forEach(field => {
          let value = prod[field.key];
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
              let subValue = prod[sub.key];
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

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;
  if (!product) return <Text>לא נמצא מוצר</Text>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>עריכת מוצר</Text>
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
      <View style={styles.fieldSection}>
        <Text style={styles.label}>קטגוריה</Text>
        <Select
          data={CATEGORY_OPTIONS}
          value={category as any}
          onSelect={handleCategoryChange}
          placeholder="בחר קטגוריה"
        />
      </View>
      {fields.map(renderField)}
      <TouchableOpacity
        style={styles.saveButton}
        onPress={() => Alert.alert('ערכים', JSON.stringify({ title, description, price, ...form }, null, 2))}
      >
        <Text style={styles.saveButtonText}>שמור</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#0E2657',
    textAlign: 'center',
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