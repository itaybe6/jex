import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Switch } from 'react-native';
import { Select } from '@/components/Select';
import { TextInput } from 'react-native';

interface SideStonesFieldsProps {
  hasSideStones: boolean;
  onToggle: (value: boolean) => void;
  fields: {
    side_stones_weight?: string;
    side_stones_color?: string;
    side_stones_clarity?: string;
  };
  errors: {
    side_stones_weight?: boolean;
    side_stones_color?: boolean;
    side_stones_clarity?: boolean;
  };
  onChange: (key: string, value: string) => void;
  showModals: Record<string, boolean>;
  setShowModals: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

const colorOptions = ['D', 'E', 'F', 'G', 'H'];
const clarityOptions = ['IF', 'VVS1', 'VVS2', 'VS1', 'VS2'];

const SideStonesFields: React.FC<SideStonesFieldsProps> = ({
  hasSideStones,
  onToggle,
  fields,
  errors,
  onChange,
  showModals,
  setShowModals,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.toggleContainer}>
        <Text style={styles.label}>Does the jewelry have side stones?</Text>
        <Switch
          value={hasSideStones}
          onValueChange={onToggle}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={hasSideStones ? '#f5dd4b' : '#f4f3f4'}
        />
      </View>

      {hasSideStones && (
        <>
          <View style={styles.field}>
            <Text style={styles.label}>Side Stones Weight</Text>
            <TextInput
              style={[styles.input, errors.side_stones_weight && styles.errorInput]}
              value={fields.side_stones_weight}
              onChangeText={(text) => onChange('side_stones_weight', text)}
              placeholder="Enter weight (e.g. 0.30)"
              placeholderTextColor="#888"
              keyboardType="numeric"
            />
            {errors.side_stones_weight && (
              <Text style={styles.errorText}>Required</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Side Stones Color</Text>
            <Select
              data={colorOptions}
              value={fields.side_stones_color || ''}
              onSelect={(value) => onChange('side_stones_color', value)}
              placeholder="Select color"
              showModal={showModals.side_stones_color}
              setShowModal={(value) =>
                setShowModals((prev) => ({ ...prev, side_stones_color: value }))
              }
            />
            {errors.side_stones_color && (
              <Text style={styles.errorText}>Required</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Side Stones Clarity</Text>
            <Select
              data={clarityOptions}
              value={fields.side_stones_clarity || ''}
              onSelect={(value) => onChange('side_stones_clarity', value)}
              placeholder="Select clarity"
              showModal={showModals.side_stones_clarity}
              setShowModal={(value) =>
                setShowModals((prev) => ({ ...prev, side_stones_clarity: value }))
              }
            />
            {errors.side_stones_clarity && (
              <Text style={styles.errorText}>Required</Text>
            )}
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    color: '#0E2657',
    fontSize: 16,
    marginBottom: 8,
    fontFamily: 'Montserrat-SemiBold',
  },
  input: {
    backgroundColor: '#F5F8FC',
    color: '#0E2657',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E3EAF3',
    padding: 12,
    fontFamily: 'Montserrat-Regular',
  },
  errorInput: {
    borderColor: '#ff4444',
    borderWidth: 1,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Montserrat-Regular',
  },
});

export default SideStonesFields; 