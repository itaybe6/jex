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
  const [expandedFilterId, setExpandedFilterId] = useState<string | null>(null);

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
      const updatedFilters = preferences.specific_filters.filter(f => f.id !== filterId);

      const { error } = await supabase
        .from('notification_preferences')
        .update({ specific_filters: updatedFilters })
        .eq('user_id', user?.id);

      if (error) throw error;

      setPreferences(prev => ({
        ...prev,
        specific_filters: updatedFilters
      }));
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

  // מיפוי סוג מוצר לשם תצוגה ולסדר שדות
  const FILTER_TYPE_LABELS: Record<string, string> = {
    'Jewelry': 'Jewelry Filter',
    'Watches': 'Watch Filter',
    'Gems': 'Gem Filter',
    'Rough Diamond': 'Rough Diamond Filter',
    'Loose Diamond': 'Loose Diamond Filter',
  };

  const FILTER_FIELDS_ORDER: Record<string, string[]> = {
    'Jewelry': ['jewelryType', 'subcategory', 'material', 'goldColor', 'goldKarat', 'has_side_stones', 'clarity', 'color'],
    'Watches': ['brand', 'model'],
    'Gems': ['gem_type', 'origin', 'weight_from', 'weight_to', 'shape', 'clarity', 'color', 'cut_grade'],
    'Rough Diamond': ['clarity', 'color', 'cut_grade', 'weight_from', 'weight_to', 'shape'],
    'Loose Diamond': ['clarity', 'color', 'cut_grade', 'weight_from', 'weight_to', 'shape'],
  };

  // פונקציה להצגת ערך שדה
  const renderFieldValue = (field: string, filter: any) => {
    if (field.endsWith('_from') || field.endsWith('_to')) return null; // נטפל בטווחים בנפרד
    if (['weight_from', 'weight_to'].includes(field)) return null;
    if (Array.isArray(filter[field])) return filter[field].join(', ');
    if (typeof filter[field] === 'boolean') return filter[field] ? 'Yes' : 'No';
    return filter[field] || null;
  };

  // פונקציה להצגת טווח משקל
  const renderWeightRange = (filter: any) => {
    const from = filter['weight_from'];
    const to = filter['weight_to'];
    if (from || to) {
      return `Weight: ${from || ''}${from && to ? ' - ' : ''}${to || ''} ct`;
    }
    return null;
  };

  // פונקציה להצגת כותרת לפי סוג
  const getFilterTitle = (filter: any) => {
    if (FILTER_TYPE_LABELS[filter.type]) return FILTER_TYPE_LABELS[filter.type];
    if (filter.jewelryType && FILTER_TYPE_LABELS[filter.jewelryType]) return FILTER_TYPE_LABELS[filter.jewelryType];
    return filter.type ? `${filter.type} Filter` : 'Filter';
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
          const isExpanded = expandedFilterId === filter.id;
          const type = filter.type || filter.jewelryType || 'Other';
          const fieldsOrder = FILTER_FIELDS_ORDER[type] || Object.keys(filter);
          // סינון שדות ריקים
          const shownFields = fieldsOrder.filter(field => renderFieldValue(field, filter));
          // הוספת טווח משקל אם רלוונטי
          const weightRange = renderWeightRange(filter);
          return (
            <View key={filter.id} style={styles.filterItem}>
              <TouchableOpacity
                style={styles.filterCompactHeader}
                onPress={() => setExpandedFilterId(isExpanded ? null : filter.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.filterType}>{getFilterTitle(filter)}</Text>
                <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="#0E2657" />
              </TouchableOpacity>
              {isExpanded && (
                <View style={styles.filterExpandedContent}>
                  {weightRange && (
                    <View style={styles.filterProperty}>
                      <Text style={styles.propertyLabel}>Weight</Text>
                      <Text style={styles.propertyValue}>{weightRange.replace('Weight: ', '')}</Text>
                    </View>
                  )}
                  {shownFields.map(field => (
                    <View style={styles.filterProperty} key={field}>
                      <Text style={styles.propertyLabel}>{field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Text>
                      <Text style={styles.propertyValue}>{renderFieldValue(field, filter)}</Text>
                    </View>
                  ))}
                  <View style={styles.filterActionsExpanded}>
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
              )}
              {!isExpanded && (
                <View style={styles.filterActionsCompact}>
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
              )}
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
  filterCompactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  filterType: {
    fontSize: 14,
    fontFamily: 'Montserrat-SemiBold',
    color: '#0E2657',
  },
  filterExpandedContent: {
    padding: 16,
  },
  filterProperty: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  propertyLabel: {
    fontSize: 12,
    fontFamily: 'Montserrat-Medium',
    color: '#6B7280',
  },
  propertyValue: {
    fontSize: 14,
    fontFamily: 'Montserrat-SemiBold',
    color: '#111827',
  },
  filterActionsCompact: {
    flexDirection: 'row',
    gap: 8,
    padding: 16,
  },
  filterActionsExpanded: {
    flexDirection: 'row',
    gap: 8,
    padding: 16,
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