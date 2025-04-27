import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Bell } from 'lucide-react-native';
import { Link, useFocusEffect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

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
    <View style={styles.header}>
      <Text style={styles.logo}>Brilliant</Text>
      <Link href="/notifications" asChild>
        <TouchableOpacity style={styles.iconButton}>
          <Bell size={24} color="#fff" />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#121212',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  logo: {
    fontSize: 24,
    fontFamily: 'Heebo-Bold',
    color: '#fff',
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
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
    fontFamily: 'Heebo-Bold',
  },
});