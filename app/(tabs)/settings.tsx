import React, { JSX } from 'react';
import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useRouter } from 'expo-router';
// import { useAuth } from '../../context/AuthContext';
import { getToken, saveToken } from '../../lib/secureStorage';

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
      const refreshToken = await getToken('refresh_token');
      if (!token || !refreshToken) {
        Alert.alert('Error', 'No active session found');
        return;
      }

      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/auth/v1/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Logout error:', response.status, errorText);
        if (response.status === 403 || errorText.includes('bad_jwt')) {
          await saveToken('access_token', '');
          await saveToken('refresh_token', '');
          router.replace('/(auth)/sign-in');
          return;
        }
        throw new Error('Failed to sign out: ' + errorText);
      }

      // Clear tokens after logout
      await saveToken('access_token', '');
      await saveToken('refresh_token', '');
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

      {/* <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <SettingItem
          icon={<Ionicons name="notifications-outline" size={24} color="#888" />}
          title="Push Notifications"
          value={notificationsEnabled}
          onPress={() => setNotificationsEnabled(!notificationsEnabled)}
        />
      </View> */}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security</Text>
        <SettingItem
          icon={<Ionicons name="lock-closed-outline" size={24} color="#888" />}
          title="Change Password"
          onPress={() => router.push('/settings/change-password')}
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
          onPress={() => router.push('/about')}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Verifications</Text>
        <SettingItem
          icon={<Ionicons name="card-outline" size={24} color="#888" />}
          title="ID Verification"
          onPress={() => router.push('/id-verification')}
        />
        <SettingItem
          icon={<Ionicons name="pricetag-outline" size={24} color="#888" />}
          title="Exchange Badge Verification"
          onPress={() => router.push('/exchange-badge-verification')}
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
    backgroundColor: '#F5F8FC',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E3EAF3',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Montserrat-Bold',
    color: '#0E2657',
  },
  section: {
    marginTop: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    paddingBottom: 8,
    marginBottom: 8,
    shadowColor: '#0E2657',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Montserrat-Medium',
    color: '#7B8CA6',
    marginBottom: 8,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E3EAF3',
    borderRadius: 12,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
    color: '#0E2657',
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValueText: {
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
    color: '#7B8CA6',
  },
  arrow: {
    fontSize: 24,
    color: '#7B8CA6',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    margin: 20,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD6D6',
    justifyContent: 'center',
  },
  signOutText: {
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
    color: '#FF3B30',
  },
});