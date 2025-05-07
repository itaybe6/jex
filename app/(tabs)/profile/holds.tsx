import { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabaseApi';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function HoldsScreen() {
  const { user, accessToken } = useAuth();
  const [holds, setHolds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [viewMode, setViewMode] = useState<'mine' | 'onMe'>('mine');
  const [statusFilter, setStatusFilter] = useState<'approved' | 'pending' | 'rejected'>('approved');

  useEffect(() => {
    if (user && typeof user.id === 'string' && user.id.length > 0) fetchHolds();
  }, [user]);

  const fetchHolds = async () => {
    if (!user || !user.id || typeof user.id !== 'string' || user.id.length === 0) return;
    setLoading(true);
    // שלוף את ההולדים לפי owner_id ו-user_id ישירות מהטבלה
    const urlMine = `${SUPABASE_URL}/rest/v1/hold_requests?user_id=eq.${user.id}&select=*,products(*,product_images(image_url))`;
    const urlOnMe = `${SUPABASE_URL}/rest/v1/hold_requests?owner_id=eq.${user.id}&select=*,products(*,product_images(image_url))`;
    const [resMine, resOnMe] = await Promise.all([
      fetch(urlMine, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
        },
      }),
      fetch(urlOnMe, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
        },
      })
    ]);
    const dataMine: any[] = resMine.ok ? await resMine.json() : [];
    const dataOnMe: any[] = resOnMe.ok ? await resOnMe.json() : [];
    if (!resMine.ok) {
      console.error('Error fetching holds (mine):', await resMine.text());
    }
    if (!resOnMe.ok) {
      console.error('Error fetching holds (on me):', await resOnMe.text());
    }
    setHolds([...dataMine, ...dataOnMe]);
    // שלוף את כל הפרופילים הרלוונטיים
    const userIds = Array.from(new Set([
      ...dataMine.map((h: any) => h.products?.owner_id),
      ...dataOnMe.map((h: any) => h.user_id)
    ]));
    if (userIds.length > 0) {
      const profilesRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=in.(${userIds.join(',')})&select=id,full_name,avatar_url`, {
        headers: { apikey: SUPABASE_ANON_KEY },
      });
      let profilesArr: any[] = [];
      if (profilesRes.ok) {
        const json = await profilesRes.json();
        if (Array.isArray(json)) {
          profilesArr = json;
        }
      }
      const profilesMap: Record<string, any> = {};
      profilesArr.forEach((p: any) => { profilesMap[p.id] = p; });
      setProfiles(profilesMap);
    }
    setLoading(false);
  };

  // פונקציות אישור/דחייה
  const handleApprove = async (hold: any) => {
    if (!user) return;
    try {
      const now = new Date();
      const duration = hold.duration_hours || hold.duration_hour || 1;
      const end_time = new Date(now.getTime() + duration * 60 * 60 * 1000);
      // עדכן סטטוס, זמן התחלה וסיום
      await fetch(`${SUPABASE_URL}/rest/v1/hold_requests?id=eq.${hold.id}`, {
        method: 'PATCH',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'approved',
          start_time: now.toISOString(),
          end_time: end_time.toISOString(),
        }),
      });
      // ודא שיש ownerProfile
      let ownerProfile = profiles[user.id];
      if (!ownerProfile) {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=full_name,avatar_url`, {
          headers: { apikey: SUPABASE_ANON_KEY },
        });
        if (res.ok) {
          const arr = await res.json();
          if (Array.isArray(arr) && arr[0]) {
            ownerProfile = arr[0];
          }
        }
      }
      await fetch(`${SUPABASE_URL}/rest/v1/notifications`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: hold.user_id,
          type: 'hold_approved',
          product_id: hold.product_id,
          data: {
            message: 'Your hold request was approved!',
            product_title: hold.products?.title || '',
            product_image_url: hold.products?.product_images?.[0]?.image_url || '',
            seller_name: ownerProfile?.full_name || '',
            seller_avatar_url: ownerProfile?.avatar_url || '',
          },
          read: false,
        }),
      });
      fetchHolds();
    } catch (e) {
      alert('Error approving hold');
    }
  };

  const handleReject = async (hold: any) => {
    if (!user) return;
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/hold_requests?id=eq.${hold.id}`, {
        method: 'PATCH',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'rejected' }),
      });
      // ודא שיש ownerProfile
      let ownerProfile = profiles[user.id];
      if (!ownerProfile) {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=full_name,avatar_url`, {
          headers: { apikey: SUPABASE_ANON_KEY },
        });
        if (res.ok) {
          const arr = await res.json();
          if (Array.isArray(arr) && arr[0]) {
            ownerProfile = arr[0];
          }
        }
      }
      await fetch(`${SUPABASE_URL}/rest/v1/notifications`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: hold.user_id,
          type: 'hold_rejected',
          product_id: hold.product_id,
          data: {
            message: 'Your hold request was rejected.',
            product_title: hold.products?.title || '',
            product_image_url: hold.products?.product_images?.[0]?.image_url || '',
            seller_name: ownerProfile?.full_name || '',
            seller_avatar_url: ownerProfile?.avatar_url || '',
          },
          read: false,
        }),
      });
      fetchHolds();
    } catch (e) {
      alert('Error rejecting hold');
    }
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;

  // סינון לפי מצב תצוגה
  const holdsToShow = holds.filter(item =>
    (viewMode === 'mine'
      ? item.user_id === user?.id
      : item.owner_id === user?.id
    ) && item.status === statusFilter
  );

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: '#F5F8FC' }}>
      {/* כפתור חזור */}
      <TouchableOpacity
        onPress={() => router.replace('/(tabs)/profile')}
        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}
      >
        <Ionicons name="arrow-back" size={24} color="#0E2657" style={{ marginRight: 6 }} />
        <Text style={{ color: '#0E2657', fontSize: 16, fontWeight: 'bold' }}>Back</Text>
      </TouchableOpacity>
      {/* כותרת קבוצה ראשונה */}
      <Text style={{ color: '#0E2657', fontWeight: 'bold', marginBottom: 4, marginLeft: 4 }}>View:</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 16 }}>
        <TouchableOpacity
          style={{
            backgroundColor: viewMode === 'mine' ? '#0E2657' : '#E3EAF3',
            padding: 10,
            borderRadius: 8,
            marginHorizontal: 4,
          }}
          onPress={() => setViewMode('mine')}
        >
          <Text style={{ color: viewMode === 'mine' ? '#fff' : '#0E2657', fontWeight: 'bold' }}>Holds I Hold</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            backgroundColor: viewMode === 'onMe' ? '#0E2657' : '#E3EAF3',
            padding: 10,
            borderRadius: 8,
            marginHorizontal: 4,
          }}
          onPress={() => setViewMode('onMe')}
        >
          <Text style={{ color: viewMode === 'onMe' ? '#fff' : '#0E2657', fontWeight: 'bold' }}>Holds On My Products</Text>
        </TouchableOpacity>
      </View>
      {/* כותרת קבוצה שנייה */}
      <Text style={{ color: '#0E2657', fontWeight: 'bold', marginBottom: 4, marginLeft: 4 }}>Status:</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 16 }}>
        <TouchableOpacity
          style={{
            backgroundColor: statusFilter === 'approved' ? '#0E2657' : '#E3EAF3',
            padding: 8,
            borderRadius: 8,
            marginHorizontal: 4,
          }}
          onPress={() => setStatusFilter('approved')}
        >
          <Text style={{ color: statusFilter === 'approved' ? '#fff' : '#0E2657', fontWeight: 'bold' }}>Approved</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            backgroundColor: statusFilter === 'pending' ? '#0E2657' : '#E3EAF3',
            padding: 8,
            borderRadius: 8,
            marginHorizontal: 4,
          }}
          onPress={() => setStatusFilter('pending')}
        >
          <Text style={{ color: statusFilter === 'pending' ? '#fff' : '#0E2657', fontWeight: 'bold' }}>Pending</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            backgroundColor: statusFilter === 'rejected' ? '#0E2657' : '#E3EAF3',
            padding: 8,
            borderRadius: 8,
            marginHorizontal: 4,
          }}
          onPress={() => setStatusFilter('rejected')}
        >
          <Text style={{ color: statusFilter === 'rejected' ? '#fff' : '#0E2657', fontWeight: 'bold' }}>Rejected</Text>
        </TouchableOpacity>
      </View>
      {/* קו מפריד */}
      <View style={{ height: 1, backgroundColor: '#E3EAF3', marginVertical: 8 }} />
      <FlatList
        data={holdsToShow}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          // קבע מי המשתמש להציג
          let profileToShow = null;
          if (viewMode === 'mine') {
            profileToShow = profiles[item.products?.owner_id];
          } else {
            profileToShow = profiles[item.user_id];
          }
          return (
            <View style={{ padding: 12, borderBottomWidth: 1, borderColor: '#eee', flexDirection: 'row', alignItems: 'center' }}>
              {/* תמיד הצג תמונת מוצר אם קיימת */}
              {item.products?.product_images?.[0]?.image_url ? (
                <Image source={{ uri: item.products.product_images[0].image_url }} style={{ width: 48, height: 48, borderRadius: 8, marginRight: 12 }} />
              ) : (
                <View style={{ width: 48, height: 48, borderRadius: 8, marginRight: 12, backgroundColor: '#E3EAF3', justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="image-outline" size={24} color="#7B8CA6" />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: 'bold', color: '#0E2657' }}>{item.products?.title || 'Unknown Product'}</Text>
                <Text style={{ color: item.status === 'pending' ? '#0984e3' : item.status === 'approved' ? '#6C5CE7' : '#b2bec3', fontWeight: 'bold' }}>
                  {item.status === 'pending'
                    ? `Requested: ${item.duration_hours || item.duration_hour || '-'} hours`
                    : item.status === 'approved'
                      ? `Hold ends at: ${item.end_time ? new Date(item.end_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}`
                      : 'Hold was rejected'}
                </Text>
                {profileToShow && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <Image source={{ uri: profileToShow.avatar_url }} style={{ width: 28, height: 28, borderRadius: 14, marginRight: 8 }} />
                    <Text style={{ color: '#0E2657', fontWeight: 'bold' }}>{profileToShow.full_name}</Text>
                  </View>
                )}
                {/* כפתורי אישור/דחייה רק אם זה onMe ו-pending */}
                {viewMode === 'onMe' && item.status === 'pending' && (
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                    <TouchableOpacity
                      onPress={() => handleApprove(item)}
                      style={{ backgroundColor: '#27ae60', paddingVertical: 6, paddingHorizontal: 16, borderRadius: 8, marginRight: 8 }}
                    >
                      <Text style={{ color: 'white', fontWeight: 'bold' }}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleReject(item)}
                      style={{ backgroundColor: '#d63031', paddingVertical: 6, paddingHorizontal: 16, borderRadius: 8 }}
                    >
                      <Text style={{ color: 'white', fontWeight: 'bold' }}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 32, color: '#7B8CA6' }}>No holds found</Text>}
      />
    </View>
  );
} 