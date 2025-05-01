import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

interface WeightInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
}

const WeightInput: React.FC<WeightInputProps> = ({ value, onChange, error }) => {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>Weight (Grams)</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={text => onChange(text.replace(/[^0-9.]/g, ''))}
        keyboardType="numeric"
        placeholder="Enter weight in grams"
      />
      {error && <Text style={styles.errorText}>Required field / Invalid number</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'left',
    fontFamily: 'Heebo-Medium',
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Heebo-Regular',
    color: '#fff',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Heebo-Regular',
  },
});

export default WeightInput; 