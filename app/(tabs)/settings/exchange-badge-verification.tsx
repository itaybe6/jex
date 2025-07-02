import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function ExchangeBadgeVerificationScreen() {
  const { user } = useAuth();
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };
  const handleSubmit = async () => {
    if (!user?.id) {
      Alert.alert('שגיאה', 'לא נמצא משתמש מחובר');
      return;
    }
    if (!image) {
      Alert.alert('שגיאה', 'יש להעלות תמונה');
      return;
    }
    setUploading(true);
    setSuccess(false);
    try {
      
      // 1. העלאת קובץ ל-storage
      const fileExt = image.split('.').pop();
      const fileName = `badge_${user.id}_${Date.now()}.${fileExt}`;
      const response = await fetch(image);
      const blob = await response.blob();
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('badges')
        .upload(fileName, blob, { upsert: true });
      if (uploadError) throw uploadError;
      // 2. קבלת URL
      const { data: publicUrlData } = supabase.storage.from('badges').getPublicUrl(fileName);
      const file_url = publicUrlData?.publicUrl;
      if (!file_url) throw new Error('לא ניתן לקבל קישור לקובץ');
      // 3. יצירת שורה בטבלה
      const { error: insertError } = await supabase
        .from('exchange_certificates')
        .insert({
          profile_id: user?.id,
          file_url,
          status: 'pending',
          created_at: new Date().toISOString(),
        });
      if (insertError) throw insertError;
      setSuccess(true);
      setImage(null);
      Alert.alert('הבקשה נשלחה', 'הבקשה נשלחה לאישור מנהל.');
    } catch (e: any) {
      console.log('UPLOAD ERROR', e);
      Alert.alert('שגיאה', e.message || 'אירעה שגיאה');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Exchange Badge Verification</Text>
      <Text style={styles.description}>
        Upload a photo of your official exchange trader badge or relevant certification for verification.
      </Text>
  
      <TouchableOpacity style={styles.uploadBox} onPress={pickImage} disabled={uploading}>
        {image ? (
          <Image source={{ uri: image }} style={styles.imagePreview} />
        ) : (
          <Ionicons name="cloud-upload-outline" size={40} color="#6C5CE7" />
        )}
        <Text style={styles.uploadText}>Upload</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={uploading || !image}>
        {uploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>Submit</Text>
        )}
      </TouchableOpacity>
      {success && <Text style={{ color: 'green', marginTop: 16 }}>הבקשה נשלחה בהצלחה!</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FC',
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Montserrat-Bold',
    color: '#0E2657',
    marginTop: 32,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#4A5568',
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
    marginBottom: 24,
  },
  uploadBox: {
    width: 160,
    height: 120,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E3EAF3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#0E2657',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  uploadText: {
    fontSize: 16,
    color: '#6C5CE7',
    fontFamily: 'Montserrat-Medium',
    marginTop: 8,
  },
  imagePreview: {
    width: 120,
    height: 80,
    borderRadius: 8,
    resizeMode: 'cover',
    marginBottom: 8,
  },
  submitButton: {
    backgroundColor: '#6C5CE7',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginTop: 12,
    shadowColor: '#6C5CE7',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
  },
}); 