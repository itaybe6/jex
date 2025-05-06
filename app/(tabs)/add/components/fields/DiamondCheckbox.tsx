import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface DiamondCheckboxProps {
  value: boolean;
  onToggle: () => void;
}

const DiamondCheckbox: React.FC<DiamondCheckboxProps> = ({ value, onToggle }) => {
  return (
    <View style={styles.checkboxRow}>
      <TouchableOpacity
        onPress={onToggle}
        style={styles.checkbox}
      >
        {value && <View style={styles.checkboxInner} />}
      </TouchableOpacity>
      <Text style={styles.label}>Does this product include a diamond?</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    marginRight: 8,
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: '#666',
    borderRadius: 4,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxInner: {
    width: 16,
    height: 16,
    backgroundColor: '#0E2657',
    borderRadius: 2,
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Montserrat-Medium',
  },
});

export default DiamondCheckbox; 