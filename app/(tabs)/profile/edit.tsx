import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, Alert, Platform } from 'react-native';
import { Camera, X, User } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
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

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      if (data) {
        // Ensure all fields have default values even if null in database
        setProfile({
          full_name: data.full_name || '',
          title: data.title || '',
          bio: data.bio || '',
          website: data.website || '',
          avatar_url: data.avatar_url || '',
          phone: data.phone || '',
        });
        if (data.avatar_url) {
          setImageUri(data.avatar_url);
        }
      }
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
      const fileName = `${user?.id}/avatar.jpg`;
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, decode(imageBase64), {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      return publicUrl;
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
      const avatarUrl = imageBase64 ? await uploadImage() : profile.avatar_url;

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          title: profile.title,
          bio: profile.bio,
          website: profile.website,
          avatar_url: avatarUrl,
          phone: profile.phone,
        })
        .eq('id', user.id);

      if (error) throw error;

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
    <ScrollView style={styles.container}>
      <View style={styles.imageSection}>
        <View style={styles.avatarContainer}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.defaultAvatar]}>
              <User size={50} color="#666" />
            </View>
          )}
          <TouchableOpacity 
            style={styles.editAvatarButton}
            onPress={pickImage}
          >
            <Camera size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>שם מלא</Text>
          <TextInput
            style={styles.input}
            value={profile.full_name}
            onChangeText={(text) => setProfile({ ...profile, full_name: text })}
            placeholder="הזן את שמך המלא"
            textAlign="right"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>טלפון</Text>
          <TextInput
            style={styles.input}
            value={profile.phone}
            onChangeText={(text) => setProfile({ ...profile, phone: text })}
            placeholder="הזן את מספר הטלפון שלך"
            textAlign="right"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>תפקיד</Text>
          <TextInput
            style={styles.input}
            value={profile.title}
            onChangeText={(text) => setProfile({ ...profile, title: text })}
            placeholder="לדוגמה: סוחר יהלומים מוסמך"
            textAlign="right"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>אתר אינטרנט</Text>
          <TextInput
            style={styles.input}
            value={profile.website}
            onChangeText={(text) => setProfile({ ...profile, website: text })}
            placeholder="הזן כתובת אתר"
            textAlign="right"
            keyboardType="url"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>אודות</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={profile.bio}
            onChangeText={(text) => setProfile({ ...profile, bio: text })}
            placeholder="ספר קצת על עצמך..."
            multiline
            numberOfLines={4}
            textAlign="right"
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'מעדכן...' : 'שמור שינויים'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  imageSection: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatarContainer: {
    position: 'relative',
    marginVertical: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  defaultAvatar: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    borderRadius: 20,
    padding: 8,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'right',
    fontFamily: 'Heebo-Medium',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Heebo-Regular',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 32,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Heebo-Medium',
  },
});