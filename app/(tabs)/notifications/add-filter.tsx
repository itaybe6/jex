import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Icon } from '../../../components/Icon';
import { Select } from '../../../components/Select';

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

export default function AddFilterScreen() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<FilterState>({
    type: 'product',
    cut: DIAMOND_CUTS[0],
    clarity: CLARITY_GRADES[0],
    color: COLOR_GRADES[0],
    weight: DIAMOND_WEIGHTS[0],
    notifyOn: ['new_product', 'new_request']
  });

  const handleSave = async () => {
    try {
      if (!user) return;
      if (!filter.weight) {
        alert('Please enter diamond weight');
        return;
      }

      const newFilter = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'product',
        cut: filter.cut,
        clarity: filter.clarity,
        color: filter.color,
        weight: filter.weight
      };

      // First try to get existing preferences
      const { data: existingData } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (existingData) {
        // Update existing preferences
        const { error } = await supabase
          .from('notification_preferences')
          .update({
            specific_filters: [...(existingData.specific_filters || []), newFilter],
            enabled_types: filter.notifyOn
          })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Create new preferences
        const { error } = await supabase
          .from('notification_preferences')
          .insert({
            user_id: user.id,
            enabled_types: filter.notifyOn,
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

  const toggleNotificationType = (type: string) => {
    setFilter(prev => ({
      ...prev,
      notifyOn: prev.notifyOn.includes(type)
        ? prev.notifyOn.filter(t => t !== type)
        : [...prev.notifyOn, type]
    }));
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
              filter.notifyOn.includes('new_product') && styles.typeButtonActive
            ]}
            onPress={() => toggleNotificationType('new_product')}
          >
            <Text style={[
              styles.typeButtonText,
              filter.notifyOn.includes('new_product') && styles.typeButtonTextActive
            ]}>Product Listed</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.typeButton,
              filter.notifyOn.includes('new_request') && styles.typeButtonActive
            ]}
            onPress={() => toggleNotificationType('new_request')}
          >
            <Text style={[
              styles.typeButtonText,
              filter.notifyOn.includes('new_request') && styles.typeButtonTextActive
            ]}>Request Posted</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Diamond Specifications</Text>
        
        <View style={styles.field}>
          <Text style={styles.label}>Cut</Text>
          <Select<DiamondCut>
            data={DIAMOND_CUTS}
            value={filter.cut}
            onSelect={(value) => setFilter(prev => ({ ...prev, cut: value }))}
            placeholder="Select cut"
            style={styles.select}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Weight (carats)</Text>
          <Select<DiamondWeight>
            data={DIAMOND_WEIGHTS}
            value={filter.weight}
            onSelect={(value) => setFilter(prev => ({ ...prev, weight: value }))}
            placeholder="Select weight"
            style={styles.select}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Clarity</Text>
          <Select<ClarityGrade>
            data={CLARITY_GRADES}
            value={filter.clarity}
            onSelect={(value) => setFilter(prev => ({ ...prev, clarity: value }))}
            placeholder="Select clarity"
            style={styles.select}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Color</Text>
          <Select<ColorGrade>
            data={COLOR_GRADES}
            value={filter.color}
            onSelect={(value) => setFilter(prev => ({ ...prev, color: value }))}
            placeholder="Select color"
            style={styles.select}
          />
        </View>

        <TouchableOpacity 
          style={[
            styles.saveButton,
            (!filter.cut || !filter.weight || !filter.color || !filter.clarity || !filter.notifyOn.length) && styles.saveButtonDisabled
          ]}
          onPress={handleSave}
          disabled={!filter.cut || !filter.weight || !filter.color || !filter.clarity || !filter.notifyOn.length}
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