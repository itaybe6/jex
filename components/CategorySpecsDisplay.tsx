import React from 'react';
import { View, Text } from 'react-native';
import { FILTER_FIELDS_BY_CATEGORY } from '../constants/filters';
import { FilterField } from '../types/filter';

interface CategorySpecsDisplayProps {
  category: string;
  details: any;
}

const styles = {
  detailRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailLabel: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    color: '#7B8CA6',
    flex: 1,
  },
  detailValue: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    color: '#2C3E50',
    flex: 2,
    textAlign: 'right' as const,
  },
};

export function CategorySpecsDisplay({ category, details }: CategorySpecsDisplayProps) {
  const fields: FilterField[] | undefined = FILTER_FIELDS_BY_CATEGORY[category];
  
  if (!fields) {
    return (
      <View style={{ paddingVertical: 8 }}>
        <Text style={{ color: '#7B8CA6', fontFamily: 'Montserrat-Regular', fontSize: 16 }}>
          Unknown category
        </Text>
      </View>
    );
  }

  return (
    <View>
      {fields.map(({ key, label }) => {
        // Hide price field if not present in details (for requests)
        if ((key === 'price' || label === 'Price ($)') && (details?.[key] == null || details?.[key] === '')) {
          return null;
        }
        
        return (
          <View style={styles.detailRow} key={key}>
            <Text style={styles.detailLabel}>{label}:</Text>
            <Text style={styles.detailValue}>
              {details?.[key] != null && details?.[key] !== '' ? String(details[key]) : 'Not specified'}
            </Text>
          </View>
        );
      })}
    </View>
  );
} 