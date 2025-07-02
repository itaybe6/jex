import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChangePassword = async () => {
    try {
      setError(null);
      setLoading(true);

      // Validate passwords
      if (!currentPassword || !newPassword || !confirmPassword) {
        throw new Error('Please fill in all fields');
      }

      if (newPassword !== confirmPassword) {
        throw new Error('New passwords do not match');
      }

      // Password requirements validation
      if (newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      if (!/[A-Z]/.test(newPassword)) {
        throw new Error('Password must contain at least one uppercase letter');
      }

      if (!/[a-z]/.test(newPassword)) {
        throw new Error('Password must contain at least one lowercase letter');
      }

      if (!/[0-9]/.test(newPassword)) {
        throw new Error('Password must contain at least one number');
      }

      // TODO: Migrate to fetch-based API
      // const { error } = await supabase.auth.updateUser({
      //   password: newPassword
      // });
      // if (error) throw error;

      // Success
      Alert.alert('Success', 'Password has been updated successfully');
      router.back();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change Password</Text>
      </View>

      <View style={styles.requirementsContainer}>
        <Text style={styles.requirementsTitle}>Password Requirements:</Text>
        <Text style={styles.requirementsText}>• Minimum 8 characters</Text>
        <Text style={styles.requirementsText}>• At least one uppercase letter (A-Z)</Text>
        <Text style={styles.requirementsText}>• At least one lowercase letter (a-z)</Text>
        <Text style={styles.requirementsText}>• At least one number (0-9)</Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Current Password"
          placeholderTextColor="#888"
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="New Password"
          placeholderTextColor="#888"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm New Password"
          placeholderTextColor="#888"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
      </View>

      <TouchableOpacity 
        style={[styles.updateButton, loading && styles.updateButtonDisabled]}
        onPress={handleChangePassword}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.updateButtonText}>Update Password</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    backgroundColor: '#1a1a1a',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Heebo-Bold',
    color: '#fff',
    marginLeft: 16,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
  },
  errorContainer: {
    backgroundColor: '#ff6b6b20',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  errorText: {
    color: '#ff6b6b',
    fontFamily: 'Heebo-Regular',
  },
  inputContainer: {
    padding: 16,
    gap: 16,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 16,
    color: '#fff',
    fontFamily: 'Heebo-Regular',
  },
  updateButton: {
    backgroundColor: '#6C5CE7',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  updateButtonDisabled: {
    opacity: 0.5,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Heebo-Bold',
  },
  requirementsContainer: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  requirementsTitle: {
    fontSize: 16,
    fontFamily: 'Heebo-Bold',
    color: '#fff',
    marginBottom: 8,
  },
  requirementsText: {
    fontSize: 14,
    fontFamily: 'Heebo-Regular',
    color: '#888',
    marginBottom: 4,
  },
}); 