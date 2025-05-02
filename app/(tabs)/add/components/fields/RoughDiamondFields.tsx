import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Select } from '@/components/Select';

const CLARITY_OPTIONS = [
  'I3', 'I2', 'I1', 'SI2', 'SI1', 'VS2', 'VS1', 'VVS2', 'VVS1', 'FL', 'IF'
];
const COLOR_OPTIONS = [
  'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
];

interface RoughDiamondFieldsProps {
  weight: string;
  clarity: string;
  color: string;
  onWeightChange: (value: string) => void;
  onClarityChange: (value: string) => void;
  onColorChange: (value: string) => void;
  errors: Record<string, boolean>;
}

const RoughDiamondFields: React.FC<RoughDiamondFieldsProps> = ({
  weight,
  clarity,
  color,
  onWeightChange,
  onClarityChange,
  onColorChange,
  errors
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Weight (Carat)</Text>
      <TextInput
        style={styles.input}
        value={weight}
        onChangeText={text => onWeightChange(text.replace(/[^0-9.]/g, ''))}
        keyboardType="numeric"
        placeholder="Enter weight in carat"
        placeholderTextColor="#666"
      />
      {errors.weight && <Text style={styles.error}>Required / Invalid</Text>}

      <Text style={[styles.label, { marginTop: 16 }]}>Clarity</Text>
      <Select
        data={CLARITY_OPTIONS}
        value={clarity}
        onSelect={onClarityChange}
        placeholder="Select Clarity"
      />
      {errors.clarity && <Text style={styles.error}>Required</Text>}

      <Text style={[styles.label, { marginTop: 16 }]}>Color</Text>
      <Select
        data={COLOR_OPTIONS}
        value={color}
        onSelect={onColorChange}
        placeholder="Select Color"
      />
      {errors.color && <Text style={styles.error}>Required</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 0,
    marginBottom: 20,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
  },
  error: {
    color: 'red',
    marginTop: 4,
    marginBottom: 8,
  },
});

export default RoughDiamondFields; 