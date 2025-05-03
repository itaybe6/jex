import React from 'react';
import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { router } from 'expo-router';
// import { supabase } from '@/lib/supabase'; // Removed, migrate to fetch-based API
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

const JEWELRY_TYPES = ['Ring', 'Necklace', 'Bracelet', 'Earrings'];

const SHAPE_OPTIONS = [
  'Round', 'Oval', 'Cushion', 'Pear', 'Marquise', 'Heart', 'Emerald', 'Princess', 'Radiant', 'Asscher', 'Trillion', 'Baguette'
];

const CLARITY_OPTIONS = [
  'FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1', 'I2', 'I3'
];

const DIAMOND_COLOR_GRADES = [
  'D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z',
];
const DIAMOND_CLARITY_GRADES = [
  'I3','I2','I1','SI2','SI1','VS2','VS1','VVS2','VVS1','INTERNALLY'
];
const DIAMOND_CUT_GRADES = [
  'POOR','FAIR','GOOD','VERY GOOD','EXCELLENT'
];

export default function AddFilterScreen() {
  const { user } = useAuth();
  const [productType, setProductType] = useState<string>('Loose Diamond');
  const [dynamicFields, setDynamicFields] = useState<Record<string, any>>({});
  const [notifyOn, setNotifyOn] = useState<string[]>(['new_product']);

  const handleDynamicChange = (key: string, value: any) => {
    setDynamicFields(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      if (!user) return;
      let filterFields = { ...dynamicFields };
      if (filterFields.material !== 'GOLD') {
        delete filterFields.gold_color;
        delete filterFields.gold_karat;
      }
      // Create a filter object for each notifyOn type
      const newFilters = notifyOn.map(type => ({
        id: Math.random().toString(36).substr(2, 9),
        type: productType,
        ...filterFields,
        filter_type: type
      }));
      // const { data: existingData } = await supabase
      //   .from('notification_preferences')
      //   .select('*')
      //   .eq('user_id', user.id)
      //   .single();
      if (/* existingData */ false) {
        // const { error } = await supabase
        //   .from('notification_preferences')
        //   .update({
        //     specific_filters: [...(existingData.specific_filters || []), ...newFilters]
        //   })
        //   .eq('user_id', user.id);
        // if (error) throw error;
      } else {
        // const { error } = await supabase
        //   .from('notification_preferences')
        //   .insert({
        //     user_id: user.id,
        //     specific_filters: newFilters
        //   });
        // if (error) throw error;
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

  // Clear gold fields if material changes from GOLD to something else
  React.useEffect(() => {
    if (dynamicFields.material && dynamicFields.material !== 'GOLD') {
      if (dynamicFields.gold_color || dynamicFields.gold_karat) {
        setDynamicFields(prev => {
          const newFields = { ...prev };
          delete newFields.gold_color;
          delete newFields.gold_karat;
          return newFields;
        });
      }
    }
  }, [dynamicFields.material]);

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
              styles.typeButtonActive
            ]}
            disabled={true}
          >
            <Text style={[
              styles.typeButtonText,
              styles.typeButtonTextActive
            ]}>Product Listed</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Product Type</Text>
        
        <View style={styles.field}>
          <Select
            data={PRODUCT_TYPES}
            value={productType}
            onSelect={value => {
              setProductType(value);
              setDynamicFields({});
            }}
            placeholder="Select product type"
            style={styles.select}
          />
        </View>

        {/* Jewelry logic */}
        {productType === 'Jewelry' && (
          <>
            <View style={styles.field}>
              <Text style={styles.label}>Jewelry Type</Text>
              <Select
                data={JEWELRY_TYPES}
                value={dynamicFields.jewelryType || ''}
                onSelect={value => {
                  setDynamicFields(prev => ({ ...prev, jewelryType: value, subcategory: undefined }));
                }}
                placeholder="Select jewelry type"
                style={styles.select}
              />
            </View>
            {/* Subcategory only after jewelryType selected */}
            {dynamicFields.jewelryType && (
              <View style={styles.field}>
                <Text style={styles.label}>Subcategory</Text>
                <Select
                  data={FILTER_FIELDS_BY_CATEGORY[dynamicFields.jewelryType]?.[0]?.options || []}
                  value={dynamicFields.subcategory || ''}
                  onSelect={value => setDynamicFields(prev => ({ ...prev, subcategory: value }))}
                  placeholder="Select subcategory"
                  style={styles.select}
                />
              </View>
            )}
            {/* Render all fields except gold_color and gold_karat */}
            {FILTER_FIELDS_BY_CATEGORY[dynamicFields.jewelryType]?.slice(1)
              .filter(field => field.key !== 'gold_color' && field.key !== 'gold_karat')
              .map(field => {
                if (field.type === 'multi-select') {
                  const selected = dynamicFields[field.key] || [];
                  return (
                    <View style={styles.field} key={field.key}>
                      <Text style={styles.label}>{field.label}</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {(field.options || []).map((option: string) => (
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
                              setDynamicFields(prev => ({ ...prev, [field.key]: newValue }));
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
                          onChangeText={v => setDynamicFields(prev => ({ ...prev, [`${field.key}_from`]: v }))}
                        />
                        <TextInput
                          style={[styles.select, { flex: 1 }]}
                          keyboardType="numeric"
                          placeholder="To"
                          value={dynamicFields[`${field.key}_to`] || ''}
                          onChangeText={v => setDynamicFields(prev => ({ ...prev, [`${field.key}_to`]: v }))}
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
                          style={dynamicFields[field.key] === true ? [styles.typeButton, styles.typeButtonActive] : [styles.typeButton]}
                          onPress={() => setDynamicFields(prev => ({ ...prev, [field.key]: true }))}
                        >
                          <Text style={dynamicFields[field.key] === true ? [styles.typeButtonText, styles.typeButtonTextActive] : [styles.typeButtonText]}>Yes</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={dynamicFields[field.key] === false ? [styles.typeButton, styles.typeButtonActive] : [styles.typeButton]}
                          onPress={() => setDynamicFields(prev => ({ ...prev, [field.key]: false }))}
                        >
                          <Text style={dynamicFields[field.key] === false ? [styles.typeButtonText, styles.typeButtonTextActive] : [styles.typeButtonText]}>No</Text>
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
                      data={field.options || []}
                      value={dynamicFields[field.key] || ''}
                      onSelect={value => setDynamicFields(prev => ({ ...prev, [field.key]: value }))}
                      placeholder={`Select ${field.label}`}
                      style={styles.select}
                    />
                  </View>
                );
              })}
            {/* Render gold_color and gold_karat only if material === 'GOLD' */}
            {Array.isArray(dynamicFields.material) && dynamicFields.material.includes('GOLD') && (
              <>
                {/* Gold Color */}
                <View style={styles.field}>
                  <Text style={styles.label}>Gold Color</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {['WHITE', 'ROSE', 'YELLOW'].map(option => (
                      <TouchableOpacity
                        key={option}
                        style={Array.isArray(dynamicFields.gold_color) && dynamicFields.gold_color.includes(option)
                          ? [styles.typeButton, styles.typeButtonActive]
                          : [styles.typeButton]}
                        onPress={() => {
                          let newValue = Array.isArray(dynamicFields.gold_color) ? [...dynamicFields.gold_color] : [];
                          if (newValue.includes(option)) {
                            newValue = newValue.filter((v) => v !== option);
                          } else {
                            newValue.push(option);
                          }
                          setDynamicFields(prev => ({ ...prev, gold_color: newValue }));
                        }}
                      >
                        <Text style={Array.isArray(dynamicFields.gold_color) && dynamicFields.gold_color.includes(option)
                          ? [styles.typeButtonText, styles.typeButtonTextActive]
                          : [styles.typeButtonText]}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                {/* Gold Karat */}
                <View style={styles.field}>
                  <Text style={styles.label}>Gold Karat</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {['9K', '10K', '14K', '18K', '21K', '22K', '24K'].map(option => (
                      <TouchableOpacity
                        key={option}
                        style={Array.isArray(dynamicFields.gold_karat) && dynamicFields.gold_karat.includes(option)
                          ? [styles.typeButton, styles.typeButtonActive]
                          : [styles.typeButton]}
                        onPress={() => {
                          let newValue = Array.isArray(dynamicFields.gold_karat) ? [...dynamicFields.gold_karat] : [];
                          if (newValue.includes(option)) {
                            newValue = newValue.filter((v) => v !== option);
                          } else {
                            newValue.push(option);
                          }
                          setDynamicFields(prev => ({ ...prev, gold_karat: newValue }));
                        }}
                      >
                        <Text style={Array.isArray(dynamicFields.gold_karat) && dynamicFields.gold_karat.includes(option)
                          ? [styles.typeButtonText, styles.typeButtonTextActive]
                          : [styles.typeButtonText]}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}
          </>
        )}
        {/* Watch logic */}
        {productType === 'Watch' && (
          <>
            <View style={styles.field}>
              <Text style={styles.label}>Brand</Text>
              <Select
                data={Object.keys(WATCH_BRANDS_MODELS)}
                value={dynamicFields.brand || ''}
                onSelect={value => {
                  setDynamicFields(prev => ({ ...prev, brand: value, model: undefined }));
                }}
                placeholder="Select brand"
                style={styles.select}
              />
            </View>
            {dynamicFields.brand && (
              <View style={styles.field}>
                <Text style={styles.label}>Model</Text>
                <Select
                  data={WATCH_BRANDS_MODELS[dynamicFields.brand] || []}
                  value={dynamicFields.model || ''}
                  onSelect={value => setDynamicFields(prev => ({ ...prev, model: value }))}
                  placeholder="Select model"
                  style={styles.select}
                />
              </View>
            )}
            {/* Render other watch fields if needed */}
          </>
        )}
        {/* Other categories */}
        {productType === 'Gem' && (
          <>
            <View style={styles.field}>
              <Text style={styles.label}>Gem Type</Text>
              <Select
                data={GEM_TYPES}
                value={dynamicFields.type || ''}
                onSelect={value => setDynamicFields(prev => ({ ...prev, type: value }))}
                placeholder="Select Gem Type"
                style={styles.select}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Origin</Text>
              <Select
                data={['Natural', 'Lab Grown', 'Treated']}
                value={dynamicFields.origin || ''}
                onSelect={value => setDynamicFields(prev => ({ ...prev, origin: value }))}
                placeholder="Select Origin"
                style={styles.select}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Weight (Carat)</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  style={[styles.select, { flex: 1 }]}
                  keyboardType="numeric"
                  placeholder="From"
                  value={dynamicFields.weight_from || ''}
                  onChangeText={v => setDynamicFields(prev => ({ ...prev, weight_from: v }))}
                />
                <TextInput
                  style={[styles.select, { flex: 1 }]}
                  keyboardType="numeric"
                  placeholder="To"
                  value={dynamicFields.weight_to || ''}
                  onChangeText={v => setDynamicFields(prev => ({ ...prev, weight_to: v }))}
                />
              </View>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Shape</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.shapeScroll}
                contentContainerStyle={{ alignItems: 'center' }}
              >
                {SHAPE_OPTIONS.map((option: string) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.shapeChip,
                      Array.isArray(dynamicFields.shape) && dynamicFields.shape.includes(option) ? styles.shapeChipActive : undefined,
                    ]}
                    onPress={() => {
                      let newValue = Array.isArray(dynamicFields.shape) ? [...dynamicFields.shape] : [];
                      if (newValue.includes(option)) {
                        newValue = newValue.filter((v: string) => v !== option);
                      } else {
                        newValue.push(option);
                      }
                      setDynamicFields(prev => ({ ...prev, shape: newValue }));
                    }}
                  >
                    <Text
                      style={[
                        styles.shapeChipText,
                        Array.isArray(dynamicFields.shape) && dynamicFields.shape.includes(option) ? styles.shapeChipTextActive : undefined,
                      ]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Clarity</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {DIAMOND_CLARITY_GRADES.map(option => (
                  <TouchableOpacity
                    key={option}
                    style={Array.isArray(dynamicFields.clarity) && dynamicFields.clarity.includes(option) ? [styles.typeButton, styles.typeButtonActive] : [styles.typeButton]}
                    onPress={() => {
                      let newValue = Array.isArray(dynamicFields.clarity) ? [...dynamicFields.clarity] : [];
                      if (newValue.includes(option)) {
                        newValue = newValue.filter((v: string) => v !== option);
                      } else {
                        newValue.push(option);
                      }
                      setDynamicFields(prev => ({ ...prev, clarity: newValue }));
                    }}
                  >
                    <Text style={Array.isArray(dynamicFields.clarity) && dynamicFields.clarity.includes(option) ? [styles.typeButtonText, styles.typeButtonTextActive] : [styles.typeButtonText]}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Cut Grade</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {DIAMOND_CUT_GRADES.map(option => (
                  <TouchableOpacity
                    key={option}
                    style={Array.isArray(dynamicFields.cut_grade) && dynamicFields.cut_grade.includes(option) ? [styles.typeButton, styles.typeButtonActive] : [styles.typeButton]}
                    onPress={() => {
                      let newValue = Array.isArray(dynamicFields.cut_grade) ? [...dynamicFields.cut_grade] : [];
                      if (newValue.includes(option)) {
                        newValue = newValue.filter((v: string) => v !== option);
                      } else {
                        newValue.push(option);
                      }
                      setDynamicFields(prev => ({ ...prev, cut_grade: newValue }));
                    }}
                  >
                    <Text style={Array.isArray(dynamicFields.cut_grade) && dynamicFields.cut_grade.includes(option) ? [styles.typeButtonText, styles.typeButtonTextActive] : [styles.typeButtonText]}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}
        {(['Loose Diamond', 'Rough Diamond'].includes(productType)) && (
          <>
            {Array.isArray(FILTER_FIELDS_BY_CATEGORY[productType]) && FILTER_FIELDS_BY_CATEGORY[productType].map((field: any) => {
              if (field.type === 'multi-select') {
                const selected = dynamicFields[field.key] || [];
                return (
                  <View style={styles.field} key={field.key}>
                    <Text style={styles.label}>{field.label}</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {(field.options || []).map((option: string) => (
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
                            setDynamicFields(prev => ({ ...prev, [field.key]: newValue }));
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
                        onChangeText={v => setDynamicFields(prev => ({ ...prev, [`${field.key}_from`]: v }))}
                      />
                      <TextInput
                        style={[styles.select, { flex: 1 }]}
                        keyboardType="numeric"
                        placeholder="To"
                        value={dynamicFields[`${field.key}_to`] || ''}
                        onChangeText={v => setDynamicFields(prev => ({ ...prev, [`${field.key}_to`]: v }))}
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
                        style={dynamicFields[field.key] === true ? [styles.typeButton, styles.typeButtonActive] : [styles.typeButton]}
                        onPress={() => setDynamicFields(prev => ({ ...prev, [field.key]: true }))}
                      >
                        <Text style={dynamicFields[field.key] === true ? [styles.typeButtonText, styles.typeButtonTextActive] : [styles.typeButtonText]}>Yes</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={dynamicFields[field.key] === false ? [styles.typeButton, styles.typeButtonActive] : [styles.typeButton]}
                        onPress={() => setDynamicFields(prev => ({ ...prev, [field.key]: false }))}
                      >
                        <Text style={dynamicFields[field.key] === false ? [styles.typeButtonText, styles.typeButtonTextActive] : [styles.typeButtonText]}>No</Text>
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
                    data={field.options || []}
                    value={dynamicFields[field.key] || ''}
                    onSelect={value => setDynamicFields(prev => ({ ...prev, [field.key]: value }))}
                    placeholder={`Select ${field.label}`}
                    style={styles.select}
                  />
                </View>
              );
            })}
          </>
        )}
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
  shapeScroll: {
    minHeight: 48,
    maxHeight: 56,
    paddingVertical: 8,
  },
  shapeChip: {
    minWidth: 80,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E3EAF3',
  },
  shapeChipActive: {
    backgroundColor: '#0E2657',
    borderColor: '#0E2657',
  },
  shapeChipText: {
    textAlign: 'center',
    fontWeight: '600',
    color: '#222',
    fontSize: 14,
  },
  shapeChipTextActive: {
    color: '#fff',
  },
}); 