import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Icon } from '../../../components/Icon';
import { Select } from '../../../components/Select';
import { FILTER_FIELDS_BY_CATEGORY, CATEGORY_LABELS, WATCH_BRANDS_MODELS, GEM_TYPES } from '@/constants/filters';

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
  'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W',
  'X', 'Y', 'Z',
] as const;

const DIAMOND_WEIGHTS = [
  '0.25', '0.30', '0.40', '0.50', '0.60', '0.70', '0.75',
  '0.80', '0.90', '1.00', '1.20', '1.50', '2.00', '2.50',
  '3.00', '4.00', '5.00'
] as const;

type DiamondCut = typeof DIAMOND_CUTS[number];
type ClarityGrade = typeof CLARITY_GRADES[number];
type ColorGrade = typeof COLOR_GRADES[number];
type DiamondWeight = typeof DIAMOND_WEIGHTS[number];

type FilterState = {
  type: string;
  cut: DiamondCut;
  clarity: ClarityGrade;
  color: ColorGrade;
  weight: DiamondWeight;
  notifyOn: string[];
};

type SelectValue = string;

const PRODUCT_TYPES = [
  'Jewelry',
  'Watch',
  'Gem',
  'Loose Diamond',
  'Rough Diamond',
];

export default function AddFilterScreen() {
  const { user } = useAuth();
  const [productType, setProductType] = useState<string>('Loose Diamond');
  const [dynamicFields, setDynamicFields] = useState<Record<string, any>>({});
  const [notifyOn, setNotifyOn] = useState<string[]>(['new_product', 'new_request']);

  const handleDynamicChange = (key: string, value: any) => {
    setDynamicFields(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      if (!user) return;
      const newFilter = {
        id: Math.random().toString(36).substr(2, 9),
        type: productType,
        ...dynamicFields
      };
      const { data: existingData } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (existingData) {
        const { error } = await supabase
          .from('notification_preferences')
          .update({
            specific_filters: [...(existingData.specific_filters || []), newFilter],
            enabled_types: notifyOn
          })
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('notification_preferences')
          .insert({
            user_id: user.id,
            enabled_types: notifyOn,
            specific_filters: [newFilter]
          });
        if (error) throw error;
      }
      router.back();
    } catch (error) {
      console.error('Error saving filter:', error);
      alert('Failed to save filter. Please try again.');
    }
  };

  const cutOptions = DIAMOND_CUTS.map(cut => ({ key: cut, value: cut }));
  const clarityOptions = CLARITY_GRADES.map(clarity => ({ key: clarity, value: clarity }));
  const colorOptions = COLOR_GRADES.map(color => ({ key: color, value: color }));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Icon name="arrow-left" size={24} color="#0E2657" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Filter</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Notify me when:</Text>
        <View style={styles.notificationTypes}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              notifyOn.includes('new_product') && styles.typeButtonActive
            ]}
            onPress={() => setNotifyOn(prev => prev.includes('new_product') ? prev.filter(t => t !== 'new_product') : [...prev, 'new_product'])}
          >
            <Text style={[
              styles.typeButtonText,
              notifyOn.includes('new_product') && styles.typeButtonTextActive
            ]}>Product Listed</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.typeButton,
              notifyOn.includes('new_request') && styles.typeButtonActive
            ]}
            onPress={() => setNotifyOn(prev => prev.includes('new_request') ? prev.filter(t => t !== 'new_request') : [...prev, 'new_request'])}
          >
            <Text style={[
              styles.typeButtonText,
              notifyOn.includes('new_request') && styles.typeButtonTextActive
            ]}>Request Posted</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Product Type</Text>
        
        <View style={styles.field}>
          <Select
            data={PRODUCT_TYPES}
            value={productType}
            onSelect={setProductType}
            placeholder="Select product type"
            style={styles.select}
          />
        </View>

        {/* Render dynamic fields for the selected product type */}
        {Array.isArray(FILTER_FIELDS_BY_CATEGORY[productType]) && FILTER_FIELDS_BY_CATEGORY[productType].map((field: any) => {
          if (field.type === 'multi-select') {
            const selected = dynamicFields[field.key] || [];
            return (
              <View style={styles.field} key={field.key}>
                <Text style={styles.label}>{field.label}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {field.options.map((option: string) => (
                    <TouchableOpacity
                      key={option}
                      style={
                        Array.isArray(selected) && selected.includes(option)
                          ? [styles.typeButton, typeof styles.typeButtonActive === 'object' ? styles.typeButtonActive : {}]
                          : [styles.typeButton]
                      }
                      onPress={() => {
                        let newValue = Array.isArray(selected) ? [...selected] : [];
                        if (newValue.includes(option)) {
                          newValue = newValue.filter((v: string) => v !== option);
                        } else {
                          newValue.push(option);
                        }
                        handleDynamicChange(field.key, newValue);
                      }}
                    >
                      <Text style={
                        Array.isArray(selected) && selected.includes(option)
                          ? [styles.typeButtonText, typeof styles.typeButtonTextActive === 'object' ? styles.typeButtonTextActive : {}]
                          : [styles.typeButtonText]
                      }>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          }
          if (field.type === 'range') {
            return (
              <View style={styles.field} key={field.key}>
                <Text style={styles.label}>{field.label}</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    style={[styles.select, { flex: 1 }]}
                    keyboardType="numeric"
                    placeholder="From"
                    value={dynamicFields[`${field.key}_from`] || ''}
                    onChangeText={v => handleDynamicChange(`${field.key}_from`, v)}
                  />
                  <TextInput
                    style={[styles.select, { flex: 1 }]}
                    keyboardType="numeric"
                    placeholder="To"
                    value={dynamicFields[`${field.key}_to`] || ''}
                    onChangeText={v => handleDynamicChange(`${field.key}_to`, v)}
                  />
                </View>
              </View>
            );
          }
          if (field.type === 'boolean') {
            return (
              <View style={styles.field} key={field.key}>
                <Text style={styles.label}>{field.label}</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    style={[styles.typeButton, dynamicFields[field.key] === true && styles.typeButtonActive]}
                    onPress={() => handleDynamicChange(field.key, true)}
                  >
                    <Text style={[styles.typeButtonText, dynamicFields[field.key] === true && styles.typeButtonTextActive]}>Yes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.typeButton, dynamicFields[field.key] === false && styles.typeButtonActive]}
                    onPress={() => handleDynamicChange(field.key, false)}
                  >
                    <Text style={[styles.typeButtonText, dynamicFields[field.key] === false && styles.typeButtonTextActive]}>No</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }
          // Default: single select
          return (
            <View style={styles.field} key={field.key}>
              <Text style={styles.label}>{field.label}</Text>
              <Select
                data={field.options}
                value={dynamicFields[field.key] || ''}
                onSelect={value => handleDynamicChange(field.key, value)}
                placeholder={`Select ${field.label}`}
                style={styles.select}
              />
            </View>
          );
        })}

        <TouchableOpacity 
          style={[
            styles.saveButton,
            (!productType || !notifyOn.length) ? styles.saveButtonDisabled : undefined
          ]}
          onPress={handleSave}
          disabled={!productType || !notifyOn.length}
        >
          <Text style={styles.saveButtonText}>Save Filter</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 6,
    paddingTop: 20,
    marginBottom: 0,
    backgroundColor: '#F5F8FC',
  },
  backButton: {
    marginRight: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Montserrat-Bold',
    color: '#111827',
  },
  content: {
    flex: 1,
    backgroundColor: '#F5F8FC',
    padding: 20,
    paddingBottom: 96,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat-SemiBold',
    color: '#111827',
    marginBottom: 16,
    marginTop: 12,
  },
  notificationTypes: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  typeButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  typeButtonActive: {
    backgroundColor: '#0E2657',
  },
  typeButtonText: {
    fontSize: 14,
    fontFamily: 'Montserrat-SemiBold',
    color: '#6B7280',
    textAlign: 'center',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    color: '#111827',
    marginBottom: 8,
  },
  select: {
    borderWidth: 1,
    borderColor: '#E3EAF3',
    borderRadius: 16,
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: '#0E2657',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 48,
  },
  saveButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
  },
}); 