import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

interface DescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
}

const DescriptionInput: React.FC<DescriptionInputProps> = ({ value, onChange, error }) => {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={value}
        onChangeText={onChange}
        placeholder="Describe the product..."
        multiline
        numberOfLines={4}
        textAlign="left"
        textAlignVertical="top"
      />
      {error && <Text style={styles.errorText}>Description is required</Text>}
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
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Heebo-Regular',
  },
});

export default DescriptionInput; 