import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function IDVerificationScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  const submitImage = async () => {
    if (!image) {
      Alert.alert('שגיאה', 'אנא העלה תמונה לפני השליחה');
      return;
    }

    setIsLoading(true);
    
    try {
      // כאן תוכל להוסיף את הלוגיקה לשליחת התמונה לשרת
      // לדוגמה:
      // const formData = new FormData();
      // formData.append('idImage', {
      //   uri: image,
      //   type: 'image/jpeg',
      //   name: 'id_verification.jpg'
      // });
      // await uploadToServer(formData);
      
      // בינתיים נדמה את התהליך
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'הצלחה!', 
        'התמונה נשלחה בהצלחה. נבדוק אותה ונעדכן אותך בקרוב.',
        [
          {
            text: 'אישור',
            onPress: () => router.push('/settings')
          }
        ]
      );
    } catch (error) {
      Alert.alert('שגיאה', 'אירעה שגיאה בשליחת התמונה. אנא נסה שוב.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginTop: 12, marginBottom: 12 }}>
        <TouchableOpacity onPress={() => router.push('/settings')} style={{}}>
          <Ionicons name="arrow-back" size={28} color="#0E2657" />
        </TouchableOpacity>
        <Text style={[styles.title, { marginLeft: 8, marginTop: 0 }]}>ID Verification</Text>
      </View>
      <Text style={styles.description}>
        Please upload a clear photo of your official government-issued ID to complete the verification process.
      </Text>
      <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
        {image ? (
          <Image source={{ uri: image }} style={styles.imagePreview} />
        ) : (
          <Ionicons name="cloud-upload-outline" size={40} color="#6C5CE7" />
        )}
        <Text style={styles.uploadText}>Upload</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.submitButton, !image && styles.submitButtonDisabled]} 
        onPress={submitImage}
        disabled={!image || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.submitText}>Submit</Text>
        )}
      </TouchableOpacity>
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
  submitButtonDisabled: {
    backgroundColor: '#B8B5C7',
    shadowOpacity: 0,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
  },
}); 