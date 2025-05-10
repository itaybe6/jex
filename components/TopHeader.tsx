import { View, TouchableOpacity, StyleSheet, Image, Text } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function TopHeader() {
  const { user, accessToken } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  // Move fetchUnread outside useEffect so it can be called from event
  const fetchUnread = async () => {
    if (!user) return;
    const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/notifications?user_id=eq.${user.id}&read=eq.false&select=id`;
    const res = await fetch(url, {
      headers: {
        'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
        'Authorization': `Bearer ${accessToken || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
      },
    });
    const data = await res.json();
    setUnreadCount(Array.isArray(data) ? data.length : 0);
  };

  useEffect(() => {
    fetchUnread();
  }, [user, accessToken]);

  // Listen for refresh-unread-badge event
  useEffect(() => {
    const handler = () => {
      fetchUnread();
    };
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('refresh-unread-badge', handler);
      return () => window.removeEventListener('refresh-unread-badge', handler);
    }
    // In React Native, do nothing
    return undefined;
  }, [user, accessToken]);

  return (
    <>
      <StatusBar style="dark" backgroundColor="#F5F8FC" />
      <View style={[styles.header, { backgroundColor: '#F5F8FC', shadowColor: 'transparent', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }]}>
        <Image source={require('@/assets/images/logo b-03.png')} style={styles.logoImg} resizeMode="contain" />
        <Link href="/notifications" asChild>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={26} color="#0E2657" />
            {unreadCount > 0 && (
              <View style={{
                position: 'absolute',
                top: 2,
                right: 2,
                backgroundColor: '#FF3B30',
                borderRadius: 8,
                minWidth: 16,
                height: 16,
                justifyContent: 'center',
                alignItems: 'center',
                paddingHorizontal: 4,
              }}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 0,
    backgroundColor: '#F5F8FC',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    height: 100,
  },
  logoImg: {
    height: 32,
    width: 95,
    marginLeft: 0,
  },
  iconButton: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: 'transparent',
    position: 'relative',
  },
});