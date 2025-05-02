import React from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { Select } from '@/components/Select';

const CLARITY_OPTIONS = [
  'I3', 'I2', 'I1', 'SI2', 'SI1', 'VS2', 'VS1', 'VVS2', 'VVS1', 'FL', 'IF'
];
const COLOR_OPTIONS = [
  'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
];
const SHAPE_OPTIONS = [
  'Round', 'Pear', 'Cushion', 'Oval', 'Marquise', 'Heart', 'Emerald', 'Princess', 'Radiant', 'Asscher', 'Trillion', 'Baguette'
];
const CUT_OPTIONS = ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor'];
const CERTIFICATE_OPTIONS = ['GIA', 'IGI', 'HRD', 'EGL', 'SGL', 'CGL', 'IGL', 'AIG'];
const FLUORESCENCE_OPTIONS = ['None', 'Faint', 'Medium', 'Strong'];
const POLISH_OPTIONS = ['Excellent', 'Very Good', 'Good'];
const SYMMETRY_OPTIONS = ['Excellent', 'Very Good', 'Good'];
const ORIGIN_TYPE_OPTIONS = ['Natural', 'Lab Grown', 'Treated'];

interface LooseDiamondFieldsProps {
  weight: string;
  clarity: string;
  color: string;
  shape: string;
  cut: string;
  certificate: string;
  fluorescence: string;
  polish: string;
  symmetry: string;
  originType: string;
  onWeightChange: (value: string) => void;
  onClarityChange: (value: string) => void;
  onColorChange: (value: string) => void;
  onShapeChange: (value: string) => void;
  onCutChange: (value: string) => void;
  onCertificateChange: (value: string) => void;
  onFluorescenceChange: (value: string) => void;
  onPolishChange: (value: string) => void;
  onSymmetryChange: (value: string) => void;
  onOriginTypeChange: (value: string) => void;
  errors: Record<string, boolean>;
}

const LooseDiamondFields: React.FC<LooseDiamondFieldsProps> = ({
  weight,
  clarity,
  color,
  shape,
  cut,
  certificate,
  fluorescence,
  polish,
  symmetry,
  originType,
  onWeightChange,
  onClarityChange,
  onColorChange,
  onShapeChange,
  onCutChange,
  onCertificateChange,
  onFluorescenceChange,
  onPolishChange,
  onSymmetryChange,
  onOriginTypeChange,
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
        multiSelect={true}
      />
      {errors.clarity && <Text style={styles.error}>Required</Text>}

      <Text style={[styles.label, { marginTop: 16 }]}>Color</Text>
      <Select
        data={COLOR_OPTIONS}
        value={color}
        onSelect={onColorChange}
        placeholder="Select Color"
        multiSelect={true}
      />
      {errors.color && <Text style={styles.error}>Required</Text>}

      <Text style={[styles.label, { marginTop: 16 }]}>Shape</Text>
      <Select
        data={SHAPE_OPTIONS}
        value={shape}
        onSelect={onShapeChange}
        placeholder="Select Shape"
      />
      {errors.shape && <Text style={styles.error}>Required</Text>}

      {shape === 'Round' && (
        <>
          <Text style={[styles.label, { marginTop: 16 }]}>Cut</Text>
          <Select
            data={CUT_OPTIONS}
            value={cut}
            onSelect={onCutChange}
            placeholder="Select Cut"
          />
          {errors.cut && <Text style={styles.error}>Required</Text>}
        </>
      )}

      <Text style={[styles.label, { marginTop: 16 }]}>Certificate</Text>
      <Select
        data={CERTIFICATE_OPTIONS}
        value={certificate}
        onSelect={onCertificateChange}
        placeholder="Select Certificate"
      />
      {errors.certificate && <Text style={styles.error}>Required</Text>}

      <Text style={[styles.label, { marginTop: 16 }]}>Fluorescence</Text>
      <Select
        data={FLUORESCENCE_OPTIONS}
        value={fluorescence}
        onSelect={onFluorescenceChange}
        placeholder="Select Fluorescence"
      />
      {errors.fluorescence && <Text style={styles.error}>Required</Text>}

      <Text style={[styles.label, { marginTop: 16 }]}>Polish</Text>
      <Select
        data={POLISH_OPTIONS}
        value={polish}
        onSelect={onPolishChange}
        placeholder="Select Polish"
      />
      {errors.polish && <Text style={styles.error}>Required</Text>}

      <Text style={[styles.label, { marginTop: 16 }]}>Symmetry</Text>
      <Select
        data={SYMMETRY_OPTIONS}
        value={symmetry}
        onSelect={onSymmetryChange}
        placeholder="Select Symmetry"
      />
      {errors.symmetry && <Text style={styles.error}>Required</Text>}

      <Text style={[styles.label, { marginTop: 16 }]}>Origin Type</Text>
      <Select
        data={ORIGIN_TYPE_OPTIONS}
        value={originType}
        onSelect={onOriginTypeChange}
        placeholder="Select Origin Type"
      />
      {errors.originType && <Text style={styles.error}>Required</Text>}
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

export default LooseDiamondFields; 