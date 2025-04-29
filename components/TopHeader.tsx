import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Bell } from 'lucide-react-native';
import { Link, useFocusEffect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';

export function TopHeader() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = useCallback(async () => {
    if (!user) return;
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false);
    if (!error && typeof count === 'number') setUnreadCount(count);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchUnread();
    }, [fetchUnread])
  );

  // רענון ראשוני ב-mount
  useEffect(() => {
    fetchUnread();
  }, [fetchUnread]);

  return (
    <SafeAreaView style={{ backgroundColor: '#0E2657' }} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Image source={require('@/assets/images/new whote head-05.png')} style={styles.logoImg} resizeMode="contain" />
        <Link href="/notifications" asChild>
          <TouchableOpacity style={styles.iconButton}>
            <Bell size={26} color="#fff" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 4,
    backgroundColor: '#0E2657',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: '#0E2657',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  logoImg: {
    height: 26,
    width: 95,
    marginLeft: 0,
  },
  iconButton: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    zIndex: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Montserrat-Bold',
  },
});