import React from 'react';
import { View, Text, StyleSheet, TextInput, Switch } from 'react-native';
import { Select } from '../../../../../components/Select';
import { GEM_TYPES } from '../../../../../constants/filters';

const SHAPE_OPTIONS = [
  'Round',
  'Oval',
  'Cushion',
  'Pear',
  'Marquise',
  'Heart',
  'Emerald',
  'Princess',
  'Radiant',
  'Asscher',
  'Trillion',
  'Baguette'
];

const CLARITY_OPTIONS = [
  'FL',
  'IF',
  'VVS1',
  'VVS2',
  'VS1',
  'VS2',
  'SI1',
  'SI2',
  'I1',
  'I2',
  'I3'
];

interface GemFieldsProps {
  type: string;
  origin: string;
  certification: string;
  weight: string;
  shape: string;
  clarity: string;
  transparency: boolean;
  hasCertification: boolean;
  dimensions: string;
  onTypeChange: (value: string) => void;
  onOriginChange: (value: string) => void;
  onCertificationChange: (value: string) => void;
  onWeightChange: (value: string) => void;
  onShapeChange: (value: string) => void;
  onClarityChange: (value: string) => void;
  onTransparencyChange: (value: boolean) => void;
  onHasCertificationChange: (value: boolean) => void;
  onDimensionsChange: (value: string) => void;
  errors: Record<string, boolean>;
}

export default function GemFields({
  type,
  origin,
  certification,
  weight,
  shape,
  clarity,
  transparency,
  hasCertification,
  dimensions,
  onTypeChange,
  onOriginChange,
  onCertificationChange,
  onWeightChange,
  onShapeChange,
  onClarityChange,
  onTransparencyChange,
  onHasCertificationChange,
  onDimensionsChange,
  errors
}: GemFieldsProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Gem Type</Text>
      <Select
        data={GEM_TYPES}
        value={type}
        onSelect={onTypeChange}
        placeholder="Select Gem Type"
      />
      {errors.type && <Text style={styles.error}>Required</Text>}

      <Text style={[styles.label, { marginTop: 16 }]}>Origin</Text>
      <Select
        data={['Natural', 'Lab Grown', 'Treated']}
        value={origin}
        onSelect={onOriginChange}
        placeholder="Select Origin"
      />
      {errors.origin && <Text style={styles.error}>Required</Text>}

      <Text style={[styles.label, { marginTop: 16 }]}>Weight (Carat)</Text>
      <TextInput
        style={styles.input}
        value={weight}
        onChangeText={onWeightChange}
        placeholder="Enter weight in carat"
        keyboardType="numeric"
        placeholderTextColor="#666"
      />
      {errors.weight && <Text style={styles.error}>Required</Text>}

      <Text style={[styles.label, { marginTop: 16 }]}>Shape</Text>
      <Select
        data={SHAPE_OPTIONS}
        value={shape}
        onSelect={onShapeChange}
        placeholder="Select Shape"
      />
      {errors.shape && <Text style={styles.error}>Required</Text>}

      <Text style={[styles.label, { marginTop: 16 }]}>Clarity</Text>
      <Select
        data={CLARITY_OPTIONS}
        value={clarity}
        onSelect={onClarityChange}
        placeholder="Select Clarity"
      />
      {errors.clarity && <Text style={styles.error}>Required</Text>}

      <View style={styles.switchContainer}>
        <Text style={styles.label}>Transparency</Text>
        <Switch
          value={transparency}
          onValueChange={onTransparencyChange}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={transparency ? '#f5dd4b' : '#f4f3f4'}
        />
      </View>

      <View style={styles.switchContainer}>
        <Text style={styles.label}>Has Certification</Text>
        <Switch
          value={hasCertification}
          onValueChange={onHasCertificationChange}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={hasCertification ? '#f5dd4b' : '#f4f3f4'}
        />
      </View>

      {hasCertification && (
        <>
          <Text style={[styles.label, { marginTop: 16 }]}>Certification</Text>
          <Select
            data={['GIA', 'IGI', 'HRD', 'EGL', 'SGL', 'CGL', 'IGL', 'AIG', 'None']}
            value={certification}
            onSelect={onCertificationChange}
            placeholder="Select Certification"
          />
          {errors.certification && <Text style={styles.error}>Required</Text>}
        </>
      )}

      <Text style={[styles.label, { marginTop: 16 }]}>Dimensions</Text>
      <TextInput
        style={styles.input}
        value={dimensions}
        onChangeText={onDimensionsChange}
        placeholder="Enter dimensions (e.g. 5.1 x 4.2 x 2.3 mm)"
        placeholderTextColor="#666"
      />
      {errors.dimensions && <Text style={styles.error}>Required</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  error: {
    color: 'red',
    marginTop: 4,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 8,
  },
}); 