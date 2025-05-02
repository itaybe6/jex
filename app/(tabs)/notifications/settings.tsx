import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Icon } from '../../../components/Icon';
import React from 'react';
import { FILTER_FIELDS_BY_CATEGORY, CATEGORY_LABELS } from '@/constants/filters';

const DIAMOND_CUTS = [
  'Round',
  'Princess',
  'Oval',
  'Marquise',
  'Pear',
  'Emerald',
  'Radiant',
  'Heart',
  'Cushion',
  'Asscher',
] as const;

const CLARITY_GRADES = [
  'FL (Flawless)',
  'IF (Internally Flawless)',
  'VVS1 (Very Very Slightly Included 1)',
  'VVS2 (Very Very Slightly Included 2)',
  'VS1 (Very Slightly Included 1)',
  'VS2 (Very Slightly Included 2)',
  'SI1 (Slightly Included 1)',
  'SI2 (Slightly Included 2)',
  'I1 (Included 1)',
  'I2 (Included 2)',
  'I3 (Included 3)',
] as const;

const COLOR_GRADES = [
  'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W',
  'X', 'Y', 'Z',
] as const;

type SpecificFilter = {
  id: string;
  type: string;
  filter_type?: string;
  jewelryType?: string;
  [key: string]: any;
};

type NotificationPreferences = {
  enabled_types: string[];
  specific_filters: SpecificFilter[];
};

export default function NotificationSettingsScreen() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enabled_types: [],
    specific_filters: []
  });

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user]);

  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        fetchPreferences();
      }
    }, [user])
  );

  const fetchPreferences = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setPreferences(data);
      } else {
        const defaultPreferences = {
          enabled_types: ['new_product', 'new_request'],
          specific_filters: []
        };

        const { error: insertError } = await supabase
          .from('notification_preferences')
          .insert({
            user_id: user.id,
            ...defaultPreferences
          });

        if (insertError) throw insertError;
        setPreferences(defaultPreferences);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    }
  };

  const handleRemoveFilter = async (filterId: string) => {
    try {
      const updatedPreferences = {
        ...preferences,
        specific_filters: preferences.specific_filters.filter(f => f.id !== filterId)
      };

      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user?.id,
          ...updatedPreferences
        });

      if (error) throw error;

      setPreferences(updatedPreferences);
    } catch (error) {
      console.error('Error removing filter:', error);
    }
  };

  const handleEditFilter = (filterId: string) => {
    router.push({
      pathname: '/notifications/add-filter',
      params: { editId: filterId }
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Icon name="arrow-left" size={24} color="#0E2657" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Settings</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/(tabs)/notifications/add-filter')}
        >
          <Icon name="plus" size={20} color="#0E2657" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Active Filters</Text>
        
        {preferences?.specific_filters.map((filter, index) => {
          // Determine the product type and fields
          const type = filter.type;
          // Try to get the fields for this type/category
          let fields = FILTER_FIELDS_BY_CATEGORY[type] || [];
          // If it's a jewelry subcategory (Ring, Necklace, etc.), use that
          if (!fields.length && filter.jewelryType && FILTER_FIELDS_BY_CATEGORY[filter.jewelryType]) {
            fields = FILTER_FIELDS_BY_CATEGORY[filter.jewelryType];
          }
          // Always show filter_type (new_product/new_request) as a badge
          const filterTypeLabel = filter.filter_type === 'new_product' ? 'Product' : filter.filter_type === 'new_request' ? 'Request' : filter.filter_type;
          // Helper to render a value (array, range, etc.)
          const renderValue = (field: any, filter: any) => {
            if (field.type === 'range') {
              const from = filter[`${field.key}_from`];
              const to = filter[`${field.key}_to`];
              if (from || to) {
                return `${from || ''}${from && to ? ' - ' : ''}${to || ''} ${field.label.toLowerCase().includes('weight') ? 'ct' : ''}`;
              }
              return null;
            }
            if (Array.isArray(filter[field.key])) {
              return filter[field.key].join(', ');
            }
            if (typeof filter[field.key] === 'boolean') {
              return filter[field.key] ? 'Yes' : 'No';
            }
            return filter[field.key] || null;
          };
          // Only show fields with a value
          const shownFields = fields.filter(field => renderValue(field, filter));
          return (
            <View key={filter.id} style={styles.filterItem}>
              <View style={styles.filterContent}>
                <View style={styles.filterHeader}>
                  <Text style={styles.filterType}>
                    {CATEGORY_LABELS[type] || type}
                    {filterTypeLabel ? ` • ${filterTypeLabel}` : ''}
                  </Text>
                  <View style={styles.filterActions}>
                    <TouchableOpacity 
                      onPress={() => handleEditFilter(filter.id)}
                      style={styles.actionButton}
                    >
                      <Icon name="edit-2" size={16} color="#0E2657" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => handleRemoveFilter(filter.id)}
                      style={[styles.actionButton, styles.deleteButton]}
                    >
                      <Icon name="trash-2" size={16} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.filterDetails}>
                  {shownFields.map(field => (
                    <View style={styles.filterProperty} key={field.key}>
                      <Text style={styles.propertyLabel}>{field.label}</Text>
                      <Text style={styles.propertyValue}>{renderValue(field, filter)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          );
        })}

        {preferences.specific_filters.length === 0 && (
          <View style={styles.noFiltersContainer}>
            <Text style={styles.noFiltersText}>No active filters</Text>
            <Text style={styles.noFiltersSubtext}>
              Add filters to get notified about specific diamonds
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F8FC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Montserrat-Bold',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F8FC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: '#F5F8FC',
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    color: '#6B7280',
    marginTop: 24,
    marginBottom: 16,
    marginHorizontal: 20,
  },
  filterItem: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  filterContent: {
    padding: 16,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterType: {
    fontSize: 14,
    fontFamily: 'Montserrat-SemiBold',
    color: '#0E2657',
  },
  filterActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F8FC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
  },
  filterDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  filterProperty: {
    flex: 1,
    minWidth: '45%',
  },
  propertyLabel: {
    fontSize: 12,
    fontFamily: 'Montserrat-Medium',
    color: '#6B7280',
    marginBottom: 4,
  },
  propertyValue: {
    fontSize: 14,
    fontFamily: 'Montserrat-SemiBold',
    color: '#111827',
  },
  noFiltersContainer: {
    margin: 20,
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  noFiltersText: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    color: '#111827',
    marginBottom: 8,
  },
  noFiltersSubtext: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
}); 