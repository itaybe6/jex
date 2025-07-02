import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabaseApi';

export default function ProfileSetupScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    full_name: user?.user_metadata?.full_name || '',
    title: '',
    bio: '',
    website: '',
    avatar_url: '',
    phone: user?.user_metadata?.phone || '',
  });
  const [imageUri, setImageUri] = useState('');
  const [imageBase64, setImageBase64] = useState('');

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });
      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        if (result.assets[0].base64) {
          setImageBase64(result.assets[0].base64);
        } else {
          Alert.alert('Error', 'Could not get image in correct format. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'An error occurred while picking the image. Please try again.');
    }
  };

  const uploadImage = async () => {
    if (!imageBase64) return profile.avatar_url;
    // TODO: Implement upload logic if you have Supabase Storage
    return profile.avatar_url;
  };

  const handleSubmit = async () => {
    try {
      if (!user) {
        Alert.alert('Error', 'You must be logged in to complete your profile.');
        return;
      }
      if (!profile.full_name) {
        Alert.alert('Error', 'Please enter your full name.');
        return;
      }
      if (!profile.phone) {
        Alert.alert('Error', 'Please enter your phone number.');
        return;
      }
      setLoading(true);
      // Upload avatar if changed
      // const avatarUrl = imageBase64 ? await uploadImage() : profile.avatar_url;
      // Update profile
      // TODO: Implement update logic with fetch or supabase client
      // After successful update:
      router.replace('/profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'An error occurred while updating your profile. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1, backgroundColor: '#F5F8FC', paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
      <View style={styles.topNavBar}>
        <Text style={styles.navTitle}>Complete Your Profile</Text>
      </View>
      <View style={styles.card}>
        <View style={styles.imageSection}>
          <View style={styles.avatarContainer}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.defaultAvatar]}>
                <Ionicons name="person" size={50} color="#666" />
              </View>
            )}
            <TouchableOpacity 
              style={styles.editAvatarButton}
              onPress={pickImage}
              activeOpacity={0.7}
            >
              <Ionicons name="camera" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={profile.full_name}
              onChangeText={(text) => setProfile({ ...profile, full_name: text })}
              placeholder="Enter your full name"
              textAlign="left"
              placeholderTextColor="#6B7280"
              autoCapitalize="words"
              autoCorrect={false}
              importantForAutofill="no"
              keyboardType="default"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={profile.phone}
              onChangeText={(text) => setProfile({ ...profile, phone: text })}
              placeholder="Enter your phone number"
              textAlign="left"
              placeholderTextColor="#6B7280"
              keyboardType="phone-pad"
              autoCapitalize="none"
              autoCorrect={false}
              importantForAutofill="no"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Role</Text>
            <TextInput
              style={styles.input}
              value={profile.title}
              onChangeText={(text) => setProfile({ ...profile, title: text })}
              placeholder="Enter your role"
              textAlign="left"
              placeholderTextColor="#6B7280"
              autoCapitalize="words"
              autoCorrect={false}
              importantForAutofill="no"
              keyboardType="default"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Website</Text>
            <TextInput
              style={styles.input}
              value={profile.website}
              onChangeText={(text) => setProfile({ ...profile, website: text })}
              placeholder="Enter your website URL"
              textAlign="left"
              placeholderTextColor="#6B7280"
              autoCapitalize="none"
              autoCorrect={false}
              importantForAutofill="no"
              keyboardType="url"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>About Me</Text>
            <TextInput
              style={[styles.input, { height: 80 }]}
              value={profile.bio}
              onChangeText={(text) => setProfile({ ...profile, bio: text })}
              placeholder="Tell us a bit about yourself..."
              textAlign="left"
              placeholderTextColor="#6B7280"
              autoCapitalize="sentences"
              autoCorrect={true}
              importantForAutofill="no"
              multiline
            />
          </View>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.saveButtonText}>{loading ? 'Saving...' : 'Save & Continue'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topNavBar: { paddingTop: 32, paddingBottom: 16, alignItems: 'center', backgroundColor: '#F5F8FC' },
  navTitle: { fontSize: 22, fontWeight: 'bold', color: '#0E2657' },
  card: { backgroundColor: '#fff', borderRadius: 20, margin: 16, padding: 24, alignItems: 'center', shadowColor: '#0E2657', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  imageSection: { alignItems: 'center', marginBottom: 16 },
  avatarContainer: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#E3EAF3', alignItems: 'center', justifyContent: 'center' },
  defaultAvatar: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#E3EAF3' },
  editAvatarButton: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#0E2657', borderRadius: 16, padding: 6, borderWidth: 2, borderColor: '#fff' },
  form: { width: '100%', marginTop: 8 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 15, color: '#0E2657', marginBottom: 6, fontWeight: '500' },
  input: { width: '100%', backgroundColor: '#F5F8FC', borderRadius: 12, borderWidth: 1, borderColor: '#E3EAF3', paddingVertical: 12, paddingHorizontal: 16, fontSize: 16, color: '#222' },
  saveButton: { width: '100%', backgroundColor: '#0E2657', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
}); 