import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Select } from '../../../../../components/Select';
import { GEM_TYPES } from '../../../../../constants/filters';

const CERTIFICATION_OPTIONS = [
  'GIA',
  'IGI',
  'HRD',
  'EGL',
  'SGL',
  'CGL',
  'IGL',
  'AIG',
  'None'
];

interface GemFieldsProps {
  type: string;
  origin: string;
  certification: string;
  onTypeChange: (value: string) => void;
  onOriginChange: (value: string) => void;
  onCertificationChange: (value: string) => void;
  errors: Record<string, boolean>;
}

export default function GemFields({
  type,
  origin,
  certification,
  onTypeChange,
  onOriginChange,
  onCertificationChange,
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

      <Text style={[styles.label, { marginTop: 16 }]}>Certification</Text>
      <Select
        data={CERTIFICATION_OPTIONS}
        value={certification}
        onSelect={onCertificationChange}
        placeholder="Select Certification"
      />
      {errors.certification && <Text style={styles.error}>Required</Text>}
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
}); 