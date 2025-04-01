import React from 'react';
import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { LogOut, Bell, Lock, Shield, CircleHelp as HelpCircle, Info } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

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
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace('/(auth)/sign-in');
    } catch (error) {
      console.error('Error signing out:', error);
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
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={value ? '#007AFF' : '#f4f3f4'}
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
          icon={<Bell size={24} color="#666" />}
          title="Push Notifications"
          value={notificationsEnabled}
          onPress={() => setNotificationsEnabled(!notificationsEnabled)}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security</Text>
        <SettingItem
          icon={<Lock size={24} color="#666" />}
          title="Change Password"
          onPress={() => {}}
        />
        <SettingItem
          icon={<Shield size={24} color="#666" />}
          title="Two-Factor Authentication"
          onPress={() => {}}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <SettingItem
          icon={<HelpCircle size={24} color="#666" />}
          title="Help & Support"
          onPress={() => {}}
        />
        <SettingItem
          icon={<Info size={24} color="#666" />}
          title="About"
          value="Version 1.0.0"
          showArrow={false}
          onPress={() => {}}
        />
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <LogOut size={24} color="#FF3B30" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    height: 60,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Heebo-Bold',
    color: '#fff',
  },
  section: {
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Heebo-Bold',
    color: '#fff',
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
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
    fontSize: 14,
    fontFamily: 'Heebo-Regular',
    color: '#fff',
  },
  arrow: {
    fontSize: 20,
    color: '#fff',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 40,
    marginBottom: 20,
    paddingVertical: 12,
  },
  signOutText: {
    fontSize: 16,
    fontFamily: 'Heebo-Medium',
    color: '#FF3B30',
  },
});