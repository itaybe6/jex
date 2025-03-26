import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft } from 'lucide-react-native';

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

export default function AddFilterScreen() {
  const { user } = useAuth();
  const [filter, setFilter] = useState({
    type: 'product',
    cut: DIAMOND_CUTS[0],
    clarity: CLARITY_GRADES[0],
    color: COLOR_GRADES[0],
    weight: '',
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
            specific_filters: [...existingData.specific_filters, newFilter],
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Notification Filter</Text>
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
            ]}>New Product Listed</Text>
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
            ]}>New Request Posted</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Diamond Specifications</Text>
        
        <View style={styles.field}>
          <Text style={styles.label}>Cut</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={filter.cut}
              onValueChange={(value) => setFilter(prev => ({ ...prev, cut: value }))}
              style={styles.picker}
            >
              {DIAMOND_CUTS.map((cut) => (
                <Picker.Item key={cut} label={cut} value={cut} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Weight (carats)</Text>
          <TextInput
            style={styles.input}
            value={filter.weight}
            onChangeText={(value) => setFilter(prev => ({ ...prev, weight: value }))}
            placeholder="Enter weight in carats"
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Clarity</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={filter.clarity}
              onValueChange={(value) => setFilter(prev => ({ ...prev, clarity: value }))}
              style={styles.picker}
            >
              {CLARITY_GRADES.map((clarity) => (
                <Picker.Item key={clarity} label={clarity} value={clarity} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Color</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={filter.color}
              onValueChange={(value) => setFilter(prev => ({ ...prev, color: value }))}
              style={styles.picker}
            >
              {COLOR_GRADES.map((color) => (
                <Picker.Item key={color} label={color} value={color} />
              ))}
            </Picker>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Filter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Heebo-Bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Heebo-Bold',
    marginBottom: 16,
    marginTop: 24,
  },
  notificationTypes: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  typeButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#007AFF15',
    borderColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 14,
    fontFamily: 'Heebo-Medium',
    color: '#666',
    textAlign: 'center',
  },
  typeButtonTextActive: {
    color: '#007AFF',
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Heebo-Medium',
    marginBottom: 8,
    color: '#333',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
  },
  picker: {
    height: 50,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Heebo-Bold',
  },
}); 