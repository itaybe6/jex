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
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Montserrat-Regular',
  },
});

export default DescriptionInput; 