import React, { JSX } from 'react';
import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useRouter } from 'expo-router';
// import { useAuth } from '../../context/AuthContext';
import { getToken } from '../../lib/secureStorage';

type SettingItemProps = {
  icon: JSX.Element;
  title: string;
  value?: boolean | string;
  onPress: () => void;
  showArrow?: boolean;
};

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleSignOut = async () => {
    try {
      const token = await getToken('access_token');
      if (!token) {
        Alert.alert('Error', 'No active session found');
        return;
      }

      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/auth/v1/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to sign out');
      }

      await getToken('access_token');
      router.replace('/(auth)/sign-in');
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  const SettingItem = ({ icon, title, value, onPress, showArrow = true }: SettingItemProps) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingContent}>
        {icon}
        <Text style={styles.settingTitle}>{title}</Text>
      </View>
      <View style={styles.settingValue}>
        {typeof value === 'boolean' ? (
          <Switch
            value={value}
            onValueChange={onPress}
            trackColor={{ false: '#2a2a2a', true: '#6C5CE7' }}
            thumbColor={value ? '#fff' : '#888'}
          />
        ) : (
          <>
            {value && <Text style={styles.settingValueText}>{value}</Text>}
            {showArrow && (
              <Text style={styles.arrow}>›</Text>
            )}
          </>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <SettingItem
          icon={<Ionicons name="notifications-outline" size={24} color="#888" />}
          title="Push Notifications"
          value={notificationsEnabled}
          onPress={() => setNotificationsEnabled(!notificationsEnabled)}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security</Text>
        <SettingItem
          icon={<Ionicons name="lock-closed-outline" size={24} color="#888" />}
          title="Change Password"
          onPress={() => router.push('/settings/change-password')}
        />
        <SettingItem
          icon={<Ionicons name="shield-checkmark-outline" size={24} color="#888" />}
          title="Two-Factor Authentication"
          onPress={() => {}}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <SettingItem
          icon={<Ionicons name="help-circle-outline" size={24} color="#888" />}
          title="Help Center"
          onPress={() => {}}
        />
        <SettingItem
          icon={<Ionicons name="information-circle-outline" size={24} color="#888" />}
          title="About"
          onPress={() => {}}
        />
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={24} color="#ff6b6b" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Heebo-Bold',
    color: '#fff',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Heebo-Medium',
    color: '#888',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: 'Heebo-Regular',
    color: '#fff',
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValueText: {
    fontSize: 16,
    fontFamily: 'Heebo-Regular',
    color: '#888',
  },
  arrow: {
    fontSize: 24,
    color: '#888',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    margin: 16,
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
  },
  signOutText: {
    fontSize: 16,
    fontFamily: 'Heebo-Medium',
    color: '#ff6b6b',
  },
});