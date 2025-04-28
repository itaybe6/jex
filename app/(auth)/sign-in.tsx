import React from 'react';
import { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, TextInput, ScrollView, Platform, ActivityIndicator, Animated, Dimensions, KeyboardAvoidingView } from 'react-native';
import { router } from 'expo-router';
import { Diamond, CircleAlert as AlertCircle, Eye, EyeOff } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import CustomText from '../../components/CustomText';
import AuroraBackground from '../../components/AuroraBackground';
import { LinearGradient } from 'expo-linear-gradient';

WebBrowser.maybeCompleteAuthSession();

type AuthMode = 'signin' | 'signup' | 'confirmation' | 'forgot';

type ErrorType = {
  message: string;
  type: 'email' | 'password' | 'general';
};

const { width, height } = Dimensions.get("window");

export default function SignIn() {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<ErrorType | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);
  const errorAnimation = useRef(new Animated.Value(0)).current;
  const [isButtonActive, setIsButtonActive] = useState(false);

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
      <CustomText style={styles.errorText}>{error.message}</CustomText>
    </Animated.View>
  );

  if (mode === 'confirmation') {
    return (
      <AuroraBackground>
        <View style={[styles.container, styles.confirmationContainer]}>
          <View style={styles.header}>
            <Diamond size={48} color="#007AFF" />
            <CustomText style={styles.title}>JEX</CustomText>
          </View>
          <View style={styles.confirmationContent}>
            <CustomText style={styles.confirmationTitle}>Email Verification</CustomText>
            <CustomText style={styles.confirmationText}>{confirmationMessage}</CustomText>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton, styles.resendButton]}
              onPress={handleResendConfirmation}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <CustomText style={styles.buttonText}>Resend Verification Email</CustomText>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.switchModeButton}
              onPress={() => setMode('signin')}
            >
              <CustomText style={styles.switchModeText}>Back to Sign In</CustomText>
            </TouchableOpacity>
          </View>
        </View>
      </AuroraBackground>
    );
  }

  return (
    <View style={styles.root}>
      {/* רקע כחול */}
      <LinearGradient
        colors={["#071634", "#153E90", "#4F8EF7"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.topBackground}
      />
      {/* לוגו עליון */}
      <View style={styles.topLogoContainer}>
        <Image
          source={require('../../assets/images/logo white-08.png')}
          style={[styles.topLogo, { marginTop: 70 }]}
          resizeMode="contain"
        />
      </View>
      {/* כרטיס לבן */}
      <View style={styles.cardContainer}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.cardContent}>
            {/* Title & Subtitle */}
            <CustomText style={styles.title}>{mode === 'signup' ? 'Get started free.' : 'Welcome Back'}</CustomText>
            <CustomText style={styles.subtitle}>
              {mode === 'signup' ? 'Free forever. No credit card needed.' : 'Enter your details below'}
            </CustomText>
            {/* Form Fields */}
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor="#888"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {mode === 'signup' && (
              <TextInput
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor="#888"
                value={fullName}
                onChangeText={setFullName}
              />
            )}
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="Password"
                placeholderTextColor="#888"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword((v) => !v)}
                activeOpacity={0.7}
              >
                {showPassword ? (
                  <EyeOff size={22} color="#0A1F44" />
                ) : (
                  <Eye size={22} color="#0A1F44" />
                )}
              </TouchableOpacity>
            </View>
            {mode === 'signup' && (
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#888"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
            )}
            {/* Error Message */}
            {error && <CustomText style={styles.errorText}>{error.message}</CustomText>}
            {/* Sign In/Up Button */}
            <TouchableOpacity
              style={[
                styles.button,
                styles.primaryButton,
                loading && styles.buttonDisabled,
                isButtonActive && styles.primaryButtonActive
              ]}
              onPress={handleEmailAuth}
              disabled={loading}
              activeOpacity={0.85}
              onPressIn={() => setIsButtonActive(true)}
              onPressOut={() => setIsButtonActive(false)}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <CustomText style={styles.buttonText}>
                  {mode === 'signup' ? 'Sign Up' : 'Sign In'}
                </CustomText>
              )}
            </TouchableOpacity>
            {/* Forgot Password / Switch Mode */}
            {mode === 'signin' && (
              <TouchableOpacity onPress={() => setMode('forgot')} style={styles.linkButton}>
                <CustomText style={styles.linkText}>Forgot your password?</CustomText>
              </TouchableOpacity>
            )}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <CustomText style={styles.dividerText}>Or sign in with</CustomText>
              <View style={styles.dividerLine} />
            </View>
            {/* Social Login */}
            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialButton}>
                <Image source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg' }} style={styles.socialIcon} />
                <CustomText style={styles.socialText}>Google</CustomText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Image source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png' }} style={styles.socialIcon} />
                <CustomText style={styles.socialText}>Facebook</CustomText>
              </TouchableOpacity>
            </View>
            {/* Switch Mode */}
            <View style={styles.bottomRow}>
              <CustomText style={styles.bottomText}>
                {mode === 'signup'
                  ? 'Already have an account?'
                  : mode === 'forgot'
                  ? 'Remembered your password?'
                  : "Don't have an account?"}
              </CustomText>
              <TouchableOpacity
                onPress={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
                style={styles.bottomLinkButton}
              >
                <CustomText style={styles.bottomLinkText}>
                  {mode === 'signup'
                    ? 'Sign In'
                    : mode === 'forgot'
                    ? 'Sign In'
                    : 'Get Started'}
                </CustomText>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
    position: 'relative',
    height: '100%',
  },
  topBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height: height * 0.32,
    zIndex: 0,
  },
  cardContainer: {
    position: 'absolute',
    top: height * 0.28, // overlap עדין
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 0,
    paddingTop: 32,
    elevation: 8,
    shadowColor: '#0A1F44',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    zIndex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingBottom: 32,
  },
  cardContent: {
    width: '90%',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: "Montserrat-Medium",
    color: "#0A1F44",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#888",
    fontFamily: "Montserrat-Regular",
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: "Montserrat-Medium",
    color: "#222",
    marginBottom: 16,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  eyeButton: {
    marginLeft: -36,
    padding: 8,
    zIndex: 10,
  },
  button: {
    width: "100%",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#0A1F44",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButton: {
    backgroundColor: "#0A1F44",
  },
  primaryButtonActive: {
    backgroundColor: "#071634",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Montserrat-Medium",
    fontWeight: "500",
  },
  errorText: {
    color: "#cc3333",
    fontSize: 14,
    fontFamily: "Montserrat-Medium",
    marginBottom: 8,
    textAlign: "center",
  },
  linkButton: {
    marginTop: 10,
    marginBottom: 8,
  },
  linkText: {
    color: "#0A1F44",
    fontFamily: "Montserrat-Medium",
    fontSize: 14,
    textAlign: "center",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e0e0e0",
  },
  dividerText: {
    marginHorizontal: 12,
    color: "#888",
    fontFamily: "Montserrat-Regular",
    fontSize: 13,
  },
  socialRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    gap: 12,
    marginBottom: 8,
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    paddingVertical: 10,
    paddingHorizontal: 18,
    flex: 1,
    justifyContent: "center",
    shadowColor: "#0A1F44",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  socialIcon: {
    width: 22,
    height: 22,
    marginRight: 8,
  },
  socialText: {
    fontFamily: "Montserrat-Medium",
    fontSize: 15,
    color: "#222",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
    gap: 4,
  },
  bottomText: {
    color: "#888",
    fontFamily: "Montserrat-Regular",
    fontSize: 14,
  },
  bottomLinkButton: {
    marginLeft: 4,
  },
  bottomLinkText: {
    color: "#0A1F44",
    fontFamily: "Montserrat-Medium",
    fontSize: 14,
  },
  switchModeButton: {
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchModeText: {
    color: '#0A1F44',
    fontFamily: 'Montserrat-Medium',
    fontSize: 15,
    textAlign: 'center',
    textDecorationLine: 'underline',
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
  container: {
    flex: 1,
    backgroundColor: '#F0F6FF',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
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
    fontFamily: 'Montserrat-Bold',
    marginBottom: 8,
  },
  confirmationText: {
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
  },
  resendButton: {
    width: '100%',
    marginTop: 16,
  },
  topLogoContainer: {
    position: 'absolute',
    top: 32,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2,
  },
  topLogo: {
    width: width * 0.55,
    height: height * 0.13,
    marginTop: 70,
  },
});