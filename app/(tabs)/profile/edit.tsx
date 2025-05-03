import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
// import { supabase } from '@/lib/supabase'; // Removed, migrate to fetch-based API
import { useAuth } from '@/hooks/useAuth';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

export default function EditProfileScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    title: '',
    bio: '',
    website: '',
    avatar_url: '',
    phone: '', // Added phone field
  });
  const [imageUri, setImageUri] = useState('');
  const [imageBase64, setImageBase64] = useState('');

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      if (!user) return;
      // TODO: Migrate to fetch-based API
      // const { data, error } = await supabase
      //   .from('profiles')
      //   .select('*')
      //   .eq('id', user.id)
      //   .single();
      // if (error) throw error;
      // if (data) {
      //   setProfile({
      //     full_name: data.full_name || '',
      //     title: data.title || '',
      //     bio: data.bio || '',
      //     website: data.website || '',
      //     avatar_url: data.avatar_url || '',
      //     phone: data.phone || '',
      //   });
      //   if (data.avatar_url) {
      //     setImageUri(data.avatar_url);
      //   }
      // }
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה בטעינת הפרופיל');
    }
  };

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
          Alert.alert('שגיאה', 'לא הצלחנו לקבל את התמונה בפורמט הנכון. נסה שוב.');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה בבחירת התמונה. נסה שוב.');
    }
  };

  const uploadImage = async () => {
    if (!imageBase64) return profile.avatar_url;
    try {
      // TODO: Migrate to fetch-based API
      // const fileName = `${user?.id}/avatar.jpg`;
      // const { data, error } = await supabase.storage
      //   .from('avatars')
      //   .upload(fileName, decode(imageBase64), {
      //     contentType: 'image/jpeg',
      //     upsert: true,
      //   });
      // if (error) throw error;
      // const { data: { publicUrl } } = supabase.storage
      //   .from('avatars')
      //   .getPublicUrl(fileName);
      // return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    try {
      if (!user) {
        Alert.alert('שגיאה', 'יש להתחבר כדי לערוך את הפרופיל');
        return;
      }
      if (!profile.full_name) {
        Alert.alert('שגיאה', 'נא להזין שם מלא');
        return;
      }
      setLoading(true);
      // Upload avatar if changed
      // const avatarUrl = imageBase64 ? await uploadImage() : profile.avatar_url;
      // Update profile
      // TODO: Migrate to fetch-based API
      // const { error } = await supabase
      //   .from('profiles')
      //   .update({
      //     full_name: profile.full_name,
      //     title: profile.title,
      //     bio: profile.bio,
      //     website: profile.website,
      //     avatar_url: avatarUrl,
      //     phone: profile.phone,
      //   })
      //   .eq('id', user.id);
      // if (error) throw error;
      Alert.alert('הצלחה', 'הפרופיל עודכן בהצלחה', [
        { text: 'אישור', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה בעדכון הפרופיל. נסה שוב מאוחר יותר.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1, backgroundColor: '#F5F8FC', paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
      {/* Top Navigation Bar */}
      <View style={styles.topNavBar}>
        <TouchableOpacity style={styles.navLeft} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={26} color="#0E2657" />
          <Text style={styles.navTitle}>Profile</Text>
        </TouchableOpacity>
      </View>
      {/* White Card */}
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
              style={[styles.input, styles.textArea]}
              value={profile.bio}
              onChangeText={(text) => setProfile({ ...profile, bio: text })}
              placeholder="Tell us a bit about yourself..."
              multiline
              numberOfLines={4}
              textAlign="left"
              textAlignVertical="top"
              placeholderTextColor="#6B7280"
              autoCapitalize="sentences"
              autoCorrect={false}
              importantForAutofill="no"
              keyboardType="default"
            />
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.submitButtonText}>{loading ? 'Saving...' : 'Save Changes'}</Text>
            <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FC',
    direction: 'ltr',
  },
  topNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    height: 56,
    paddingHorizontal: 16,
    borderBottomWidth: 0,
    marginBottom: 8,
    elevation: 0,
    shadowOpacity: 0,
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navTitle: {
    color: '#0E2657',
    fontSize: 20,
    fontFamily: 'Montserrat-Bold',
    marginLeft: 4,
    letterSpacing: 0.2,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F6F7FA',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 0,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F6F7FA',
  },
  defaultAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: -4,
    right: -12,
    backgroundColor: '#0E2657',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#fff',
    zIndex: 2,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 0,
    paddingVertical: 24,
    shadowColor: '#0E2657',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
    alignItems: 'center',
  },
  form: {
    paddingHorizontal: 24,
    width: '100%',
    marginTop: 0,
  },
  inputGroup: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 15,
    color: '#111827',
    fontFamily: 'Montserrat-Medium',
    marginBottom: 6,
    textAlign: 'left',
    direction: 'ltr',
  },
  input: {
    width: '100%',
    backgroundColor: '#F6F7FA',
    borderRadius: 12,
    borderWidth: 0,
    borderColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
    color: '#111827',
    textAlign: 'left',
    direction: 'ltr',
  },
  textArea: {
    minHeight: 90,
    maxHeight: 160,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#0E2657',
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 16,
    marginBottom: 24,
    width: '100%',
    shadowColor: '#0E2657',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    minHeight: 44,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 17,
    fontFamily: 'Montserrat-Bold',
    letterSpacing: 0.5,
  },
});