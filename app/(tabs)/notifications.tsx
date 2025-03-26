import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Alert } from 'react-native';
import { Settings, X, Plus, Trash } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

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

export default function NotificationsScreen() {
  const { user } = useAuth();
  const [showPreferences, setShowPreferences] = useState(false);
  const [showAddFilter, setShowAddFilter] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enabled_types: [],
    specific_filters: []
  });

  const [newFilter, setNewFilter] = useState<Partial<SpecificFilter>>({
    type: 'product',
    cut: '',
    clarity: '',
    color: '',
    weight: ''
  });

  useEffect(() => {
    if (user) {
      fetchPreferences();
      registerForPushNotifications();
    }
  }, [user]);

  const registerForPushNotifications = async () => {
    if (Platform.OS === 'web') return;

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });

      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ push_token: token.data })
          .eq('id', user.id);

        if (error) {
          console.error('Error saving push token:', error);
        }
      }
    } catch (error) {
      console.error('Error registering for push notifications:', error);
    }
  };

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

  const handleAddFilter = async () => {
    try {
      if (!newFilter.cut || !newFilter.clarity || !newFilter.color || !newFilter.weight) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }

      const filter: SpecificFilter = {
        id: Math.random().toString(36).substr(2, 9),
        type: newFilter.type || 'product',
        cut: newFilter.cut,
        clarity: newFilter.clarity,
        color: newFilter.color,
        weight: newFilter.weight
      };

      const updatedPreferences = {
        ...preferences,
        specific_filters: [...preferences.specific_filters, filter]
      };

      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user?.id,
          ...updatedPreferences
        });

      if (error) throw error;

      setPreferences(updatedPreferences);
      setShowAddFilter(false);
      setNewFilter({
        type: 'product',
        cut: '',
        clarity: '',
        color: '',
        weight: ''
      });
    } catch (error) {
      console.error('Error adding filter:', error);
      Alert.alert('Error', 'Failed to add filter. Please try again.');
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
      Alert.alert('Error', 'Failed to remove filter. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setShowPreferences(true)}
        >
          <Settings size={20} color="#007AFF" />
          <Text style={styles.editButtonText}>Edit Preferences</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showPreferences}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPreferences(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notification Settings</Text>
              <TouchableOpacity 
                onPress={() => setShowPreferences(false)}
                style={styles.modalCloseButton}
              >
                <X size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.filtersHeader}>
                <Text style={styles.filtersTitle}>Active Filters</Text>
                <TouchableOpacity
                  style={styles.addFilterButton}
                  onPress={() => {
                    setShowPreferences(false);
                    setShowAddFilter(true);
                  }}
                >
                  <Plus size={20} color="#fff" />
                  <Text style={styles.addFilterText}>Add Filter</Text>
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
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Heebo-Bold',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f0f9ff',
  },
  editButtonText: {
    fontSize: 14,
    fontFamily: 'Heebo-Medium',
    color: '#007AFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: 'Heebo-Bold',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  filtersTitle: {
    fontSize: 20,
    fontFamily: 'Heebo-Bold',
    color: '#000',
  },
  addFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  addFilterText: {
    fontSize: 14,
    fontFamily: 'Heebo-Medium',
    color: '#fff',
  },
  filterCard: {
    backgroundColor: '#fff',
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
    borderColor: '#f0f0f0',
  },
  filterCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterBadge: {
    backgroundColor: '#007AFF15',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  filterBadgeText: {
    color: '#007AFF',
    fontSize: 14,
    fontFamily: 'Heebo-Medium',
  },
  removeFilterButton: {
    padding: 8,
    backgroundColor: '#fff',
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
    backgroundColor: '#f5f5f5',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    width: 60,
  },
  specLabel: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Heebo-Medium',
    textAlign: 'center',
  },
  specValue: {
    fontSize: 14,
    color: '#000',
    fontFamily: 'Heebo-Medium',
    flex: 1,
  },
  noFiltersContainer: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  noFiltersText: {
    fontSize: 18,
    fontFamily: 'Heebo-Bold',
    marginBottom: 8,
    color: '#333',
  },
  noFiltersSubtext: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Heebo-Regular',
    textAlign: 'center',
  },
});