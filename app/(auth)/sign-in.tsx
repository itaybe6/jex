import React from 'react';
import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, ScrollView, Platform, ActivityIndicator, Animated } from 'react-native';
import { router } from 'expo-router';
import { Diamond, CircleAlert as AlertCircle } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

type AuthMode = 'signin' | 'signup' | 'confirmation';

type ErrorType = {
  message: string;
  type: 'email' | 'password' | 'general';
};

export default function SignIn() {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<ErrorType | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);
  const errorAnimation = useRef(new Animated.Value(0)).current;

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  });

  useEffect(() => {
    if (error) {
      // Animate error message
      Animated.sequence([
        Animated.timing(errorAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(errorAnimation, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(errorAnimation, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      // Clear error after 5 seconds
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleSignIn(id_token);
    }
  }, [response]);

  const validateForm = () => {
    if (mode === 'signup') {
      if (!fullName) return { message: 'Please enter your full name', type: 'general' };
      if (!phone) return { message: 'Please enter your phone number', type: 'general' };
      if (phone.length < 10) return { message: 'Invalid phone number', type: 'general' };
      if (!email) return { message: 'Please enter your email', type: 'email' };
      if (!password) return { message: 'Please enter a password', type: 'password' };
      if (password.length < 6) return { message: 'Password must be at least 6 characters', type: 'password' };
      if (password !== confirmPassword) return { message: 'Passwords do not match', type: 'password' };
      if (!email.includes('@')) return { message: 'Invalid email address', type: 'email' };
    } else {
      if (!email) return { message: 'Please enter your email', type: 'email' };
      if (!password) return { message: 'Please enter your password', type: 'password' };
    }
    return null;
  };

  const createProfile = async (userId: string, fullName: string, phone: string) => {
    try {
      const { error } = await supabase.from('profiles').insert({
        id: userId,
        full_name: fullName,
        phone: phone,
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error creating profile:', error);
      throw error;
    }
  };

  const handleEmailAuth = async () => {
    try {
      setLoading(true);
      setError(null);
      setConfirmationMessage(null);

      const validationError = validateForm();
      if (validationError) {
        throw new Error(validationError.message);
      }

      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone: phone,
            }
          },
        });

        if (signUpError) {
          console.error('Signup error:', signUpError);
          if (signUpError.message.includes('already registered')) {
            setError({ message: 'Email is already registered', type: 'email' });
            return;
          }
          throw signUpError;
        }

        if (data.user) {
          await createProfile(data.user.id, fullName, phone);
          if (data.session) {
            router.replace('/(tabs)');
          } else {
            setMode('confirmation');
            setConfirmationMessage('A verification email has been sent. Please verify your email to continue.');
          }
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          console.error('Signin error:', signInError);
          if (signInError.message.includes('Invalid login credentials')) {
            setError({ message: 'Invalid email or password', type: 'general' });
            return;
          }
          throw signInError;
        }

        if (data.session) {
          router.replace('/(tabs)');
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setError({ message: error.message, type: 'general' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async (idToken: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: signInError } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (signInError) {
        console.error('Google auth error:', signInError);
        throw signInError;
      }

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select()
          .eq('id', data.user.id)
          .single();

        if (!profile) {
          await createProfile(
            data.user.id, 
            data.user.user_metadata.full_name || 'New User',
            data.user.user_metadata.phone || ''
          );
        }
      }

      if (data.session) {
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      console.error('Google signin error:', error);
      setError({ message: 'Error signing in with Google. Please try again later.', type: 'general' });
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    try {
      setLoading(true);
      setError(null);

      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (resendError) throw resendError;

      setConfirmationMessage('A new verification email has been sent');
    } catch (error: any) {
      setError({ message: error.message, type: 'general' });
    } finally {
      setLoading(false);
    }
  };

  const ErrorMessage = ({ error }: { error: ErrorType }) => (
    <Animated.View 
      style={[
        styles.errorContainer,
        {
          transform: [{
            scale: errorAnimation
          }]
        }
      ]}
    >
      <AlertCircle size={20} color="#c62828" />
      <Text style={styles.errorText}>{error.message}</Text>
    </Animated.View>
  );

  if (mode === 'confirmation') {
    return (
      <View style={[styles.container, styles.confirmationContainer]}>
        <View style={styles.header}>
          <Diamond size={48} color="#007AFF" />
          <Text style={styles.title}>JEX</Text>
        </View>

        <View style={styles.confirmationContent}>
          <Text style={styles.confirmationTitle}>Email Verification</Text>
          <Text style={styles.confirmationText}>{confirmationMessage}</Text>
          
          <TouchableOpacity
            style={[styles.button, styles.primaryButton, styles.resendButton]}
            onPress={handleResendConfirmation}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Resend Verification Email</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchModeButton}
            onPress={() => setMode('signin')}
          >
            <Text style={styles.switchModeText}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Diamond size={48} color="#007AFF" />
        <Text style={styles.title}>JEX</Text>
        <Text style={styles.subtitle}>Diamond Trading Platform</Text>
      </View>

      <View style={styles.form}>
        {error && <ErrorMessage error={error} />}

        {mode === 'signup' && (
          <>
            <TextInput
              style={[
                styles.input,
                error?.type === 'general' && styles.inputError
              ]}
              placeholder="Full Name"
              value={fullName}
              onChangeText={setFullName}
              placeholderTextColor="#666"
              editable={!loading}
            />
            <TextInput
              style={[
                styles.input,
                error?.type === 'general' && styles.inputError
              ]}
              placeholder="Phone Number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholderTextColor="#666"
              editable={!loading}
            />
          </>
        )}

        <TextInput
          style={[
            styles.input,
            error?.type === 'email' && styles.inputError
          ]}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#666"
          editable={!loading}
        />

        <TextInput
          style={[
            styles.input,
            error?.type === 'password' && styles.inputError
          ]}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor="#666"
          editable={!loading}
        />

        {mode === 'signup' && (
          <TextInput
            style={[
              styles.input,
              error?.type === 'password' && styles.inputError
            ]}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholderTextColor="#666"
            editable={!loading}
          />
        )}

        <TouchableOpacity
          style={[
            styles.button,
            styles.primaryButton,
            loading && styles.buttonDisabled
          ]}
          onPress={handleEmailAuth}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {mode === 'signin' ? 'Sign In' : 'Sign Up'}
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity 
          style={[
            styles.googleButton,
            (loading || !request) && styles.buttonDisabled
          ]}
          onPress={() => promptAsync()}
          disabled={!request || loading}
        >
          {loading ? (
            <ActivityIndicator color="#333" />
          ) : (
            <>
              <Image 
                source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg' }}
                style={styles.googleIcon}
              />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          style={styles.switchModeButton}
          disabled={loading}
        >
          <Text style={styles.switchModeText}>
            {mode === 'signin' 
              ? "Don't have an account? Sign up" 
              : 'Already have an account? Sign in'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.termsText}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  contentContainer: {
    padding: 20,
    paddingTop: Platform.OS === 'web' ? 40 : 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontFamily: 'Heebo-Bold',
    fontSize: 32,
    marginTop: 16,
    color: '#fff',
  },
  subtitle: {
    fontFamily: 'Heebo-Regular',
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  form: {
    gap: 16,
  },
  errorContainer: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    fontFamily: 'Heebo-Regular',
    flex: 1,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Heebo-Regular',
    borderWidth: 2,
    borderColor: 'transparent',
    color: '#fff',
  },
  inputError: {
    borderColor: '#ff6b6b',
  },
  button: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
    backgroundColor: '#6C5CE7',
  },
  primaryButton: {
    backgroundColor: '#6C5CE7',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Heebo-Bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#2a2a2a',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#888',
    fontFamily: 'Heebo-Regular',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#444',
    minHeight: 52,
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Heebo-Medium',
  },
  switchModeButton: {
    alignItems: 'center',
    marginTop: 8,
  },
  switchModeText: {
    color: '#6C5CE7',
    fontSize: 14,
    fontFamily: 'Heebo-Medium',
  },
  termsText: {
    color: '#888',
    fontSize: 14,
    fontFamily: 'Heebo-Regular',
    textAlign: 'center',
    marginTop: 24,
  },
  confirmationContainer: {
    padding: 20,
    justifyContent: 'center',
  },
  confirmationContent: {
    alignItems: 'center',
    gap: 16,
  },
  confirmationTitle: {
    fontSize: 24,
    fontFamily: 'Heebo-Bold',
    marginBottom: 8,
  },
  confirmationText: {
    fontSize: 16,
    fontFamily: 'Heebo-Regular',
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
  },
  resendButton: {
    width: '100%',
    marginTop: 16,
  },
});