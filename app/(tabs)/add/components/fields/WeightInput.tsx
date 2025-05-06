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
    color: '#0E2657',
    marginBottom: 8,
    textAlign: 'left',
    fontFamily: 'Montserrat-Medium',
  },
  input: {
    backgroundColor: '#F5F8FC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E3EAF3',
    padding: 12,
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
    color: '#0E2657',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Montserrat-Regular',
  },
});

export default WeightInput; 