import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ArrowLeft, Plus, Trash } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

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
  type: 'product' | 'request';
  cut: string;
  clarity: string;
  color: string;
  weight: string;
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Filters</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/notifications/add-filter')}
            >
              <Plus size={20} color="#fff" />
              <Text style={styles.addButtonText}>Add Filter</Text>
            </TouchableOpacity>
          </View>

          {preferences.specific_filters.map((filter) => (
            <View key={filter.id} style={styles.filterCard}>
              <View style={styles.filterCardHeader}>
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>
                    {filter.type === 'product' ? 'Product' : 'Request'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleRemoveFilter(filter.id)}
                  style={styles.removeFilterButton}
                >
                  <Trash size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>

              <View style={styles.filterSpecs}>
                <View style={styles.filterSpecItem}>
                  <View style={styles.specBadge}>
                    <Text style={styles.specLabel}>Cut</Text>
                  </View>
                  <Text style={styles.specValue}>{filter.cut}</Text>
                </View>

                <View style={styles.filterSpecItem}>
                  <View style={styles.specBadge}>
                    <Text style={styles.specLabel}>Weight</Text>
                  </View>
                  <Text style={styles.specValue}>{filter.weight} ct</Text>
                </View>

                <View style={styles.filterSpecItem}>
                  <View style={styles.specBadge}>
                    <Text style={styles.specLabel}>Clarity</Text>
                  </View>
                  <Text style={styles.specValue}>{filter.clarity}</Text>
                </View>

                <View style={styles.filterSpecItem}>
                  <View style={styles.specBadge}>
                    <Text style={styles.specLabel}>Color</Text>
                  </View>
                  <Text style={styles.specValue}>{filter.color}</Text>
                </View>
              </View>
            </View>
          ))}

          {preferences.specific_filters.length === 0 && (
            <View style={styles.noFiltersContainer}>
              <Text style={styles.noFiltersText}>No active filters</Text>
              <Text style={styles.noFiltersSubtext}>
                Add filters to get notified about specific diamonds
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    backgroundColor: '#121212',
  },
  backButton: {
    marginRight: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Heebo-Bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    backgroundColor: '#121212',
  },
  section: {
    padding: 16,
    backgroundColor: '#121212',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Heebo-Bold',
    color: '#fff',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#6C5CE7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  addButtonText: {
    fontSize: 14,
    fontFamily: 'Heebo-Medium',
    color: '#fff',
  },
  filterCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#222',
  },
  filterCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterBadge: {
    backgroundColor: '#6C5CE720',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  filterBadgeText: {
    color: '#6C5CE7',
    fontSize: 14,
    fontFamily: 'Heebo-Medium',
  },
  removeFilterButton: {
    padding: 8,
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterSpecs: {
    gap: 12,
  },
  filterSpecItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  specBadge: {
    backgroundColor: '#222',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    width: 60,
  },
  specLabel: {
    fontSize: 12,
    color: '#aaa',
    fontFamily: 'Heebo-Medium',
    textAlign: 'center',
  },
  specValue: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'Heebo-Medium',
    flex: 1,
  },
  noFiltersContainer: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#222',
    borderStyle: 'dashed',
  },
  noFiltersText: {
    fontSize: 18,
    fontFamily: 'Heebo-Bold',
    marginBottom: 8,
    color: '#fff',
  },
  noFiltersSubtext: {
    fontSize: 14,
    color: '#aaa',
    fontFamily: 'Heebo-Regular',
    textAlign: 'center',
  },
}); 