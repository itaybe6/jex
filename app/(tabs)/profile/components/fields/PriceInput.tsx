import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

interface PriceInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
}

const PriceInput: React.FC<PriceInputProps> = ({ value, onChange, error }) => {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>Price</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={text => {
          const sanitized = text.replace(/[^0-9.]/g, '');
          onChange(sanitized);
        }}
        placeholder="Enter price"
        keyboardType="numeric"
        textAlign="left"
      />
      {error && <Text style={styles.errorText}>Price is required and must be a positive number</Text>}
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

export default PriceInput; 