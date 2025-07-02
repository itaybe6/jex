import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabaseApi';

export default function TrustMarksScreen() {
  const router = useRouter();
  const { user, accessToken } = useAuth();
  const [trustMarks, setTrustMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchTrustMarks = async () => {
      if (!user) return;
      setLoading(true);
      const query = 'id,created_at,truster:profiles!trust_marks_truster_id_fkey(id,full_name,avatar_url,title)';
      const url = `${SUPABASE_URL}/rest/v1/trust_marks?trusted_id=eq.${user.id}&select=${encodeURIComponent(query)}&order=created_at.desc`;
      const res = await fetch(url, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
        },
      });
      if (!res.ok) return setTrustMarks([]);
      const data = await res.json();
      setTrustMarks(data.map((trustMark) => ({
        id: trustMark.id,
        created_at: trustMark.created_at,
        truster: trustMark.truster,
      })) || []);
      setLoading(false);
    };
    fetchTrustMarks();
  }, [user, accessToken]);

  const filtered = trustMarks.filter((mark) =>
    mark.truster.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0E2657" />
        </TouchableOpacity>
        <Text style={styles.title}>Trusted By</Text>
      </View>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#7B8CA6" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search..."
          placeholderTextColor="#7B8CA6"
          value={search}
          onChangeText={setSearch}
        />
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#0E2657" style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <Text style={styles.emptyText}>No trust marks found</Text>
      ) : (
        <ScrollView style={styles.list}>
          {filtered.map((mark) => (
            <TouchableOpacity
              key={mark.id}
              style={styles.trustMarkItem}
              onPress={() => router.push(`/user/${mark.truster.id}`)}
            >
              <Image
                source={{ uri: mark.truster.avatar_url || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=800&auto=format&fit=crop&q=60' }}
                style={styles.avatar}
              />
              <View style={styles.info}>
                <Text style={styles.name}>{mark.truster.full_name}</Text>
                {mark.truster.title && <Text style={styles.titleText}>{mark.truster.title}</Text>}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FB',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Montserrat-Bold',
    color: '#0E2657',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E3EAF3',
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Montserrat-Regular',
    fontSize: 16,
    color: '#0E2657',
    padding: 0,
  },
  list: {
    marginTop: 8,
    paddingHorizontal: 20,
  },
  trustMarkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E3EAF3',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 14,
    backgroundColor: '#E3EAF3',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
    color: '#0E2657',
  },
  titleText: {
    fontSize: 14,
    color: '#7B8CA6',
    fontFamily: 'Montserrat-Regular',
  },
  emptyText: {
    fontSize: 16,
    color: '#7B8CA6',
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
    marginTop: 40,
  },
}); 