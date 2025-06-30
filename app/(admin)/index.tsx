import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Linking,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import CustomText from '../../components/CustomText';
import BackgroundLines from '../../components/BackgroundLines';

const { width, height } = Dimensions.get('window');

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export default function AdminDashboard() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/exchange_certificates?select=*`, {
        headers: {
          apikey: SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });
      const data = await res.json();
      setRequests(data);
    } catch (e) {
      Alert.alert('שגיאה', 'לא ניתן לטעון בקשות');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    setActionLoading(id + status);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/exchange_certificates?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          apikey: SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update');
      await fetchRequests();
    } catch (e) {
      Alert.alert('שגיאה', 'לא ניתן לעדכן סטטוס');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = () => {
    router.replace('/(auth)/sign-in');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B1120" />
      
      {/* Background */}
      <View style={styles.backgroundContainer}>
        <BackgroundLines />
        <LinearGradient
          colors={["#071634CC", "#153E90CC", "#4F8EF7CC"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Ionicons name="shield-checkmark" size={32} color="#fff" />
            <CustomText style={styles.headerTitle}>פאנל מנהל</CustomText>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Table */}
      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <CustomText style={styles.tableTitle}>בקשות בורסה</CustomText>
        </View>
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
            <ActivityIndicator size="large" color="#0E2657" />
          </View>
        ) : (
          <ScrollView style={styles.tableScroll} showsVerticalScrollIndicator={false}>
            {requests.map((req) => (
              <View key={req.id} style={styles.tableRow}>
                <View style={styles.userInfo}>
                  <CustomText style={styles.userName}>ID: {req.id}</CustomText>
                  <CustomText style={styles.userEmail}>סטטוס: {req.status || 'ממתין'}</CustomText>
                  <CustomText style={styles.userDate}>הועלה בתאריך: {req.created_at?.slice(0, 10)}</CustomText>
                  {req.file_url && (
                    <TouchableOpacity onPress={() => Linking.openURL(req.file_url)} style={styles.fileButton}>
                      <Ionicons name="document-outline" size={18} color="#0E2657" />
                      <CustomText style={styles.fileButtonText}>הצג קובץ</CustomText>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => handleStatusChange(req.id, 'approved')}
                    disabled={actionLoading === req.id + 'approved'}
                  >
                    {actionLoading === req.id + 'approved' ? (
                      <ActivityIndicator color="#fff" size={16} />
                    ) : (
                      <>
                        <Ionicons name="checkmark" size={20} color="#fff" />
                        <CustomText style={styles.actionButtonText}>אישור</CustomText>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleStatusChange(req.id, 'rejected')}
                    disabled={actionLoading === req.id + 'rejected'}
                  >
                    {actionLoading === req.id + 'rejected' ? (
                      <ActivityIndicator color="#fff" size={16} />
                    ) : (
                      <>
                        <Ionicons name="close" size={20} color="#fff" />
                        <CustomText style={styles.actionButtonText}>דחייה</CustomText>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {requests.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle" size={64} color="#0E2657" />
                <CustomText style={styles.emptyStateText}>אין בקשות להצגה</CustomText>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1120',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Montserrat-Bold',
    color: '#fff',
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  tableContainer: {
    flex: 1,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tableHeader: {
    backgroundColor: '#0E2657',
    padding: 16,
    alignItems: 'center',
  },
  tableTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    color: '#fff',
  },
  tableScroll: {
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
    color: '#0E2657',
  },
  userEmail: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: '#666',
  },
  userDate: {
    fontSize: 12,
    fontFamily: 'Montserrat-Medium',
    color: '#888',
    marginBottom: 4,
  },
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#F0F6FF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    gap: 6,
  },
  fileButtonText: {
    color: '#0E2657',
    fontFamily: 'Montserrat-Medium',
    fontSize: 13,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    fontSize: 12,
    fontFamily: 'Montserrat-Medium',
    color: '#fff',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
}); 