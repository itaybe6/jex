import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, TextInput, ScrollView, Platform, ActivityIndicator, Animated, Dimensions, KeyboardAvoidingView, Easing, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { getProfile, signUp, signIn } from '@/lib/supabaseApi';
import CustomText from '../../components/CustomText';
import AuroraBackground from '../../components/AuroraBackground';
import { LinearGradient } from 'expo-linear-gradient';
import BackgroundLines from "@/components/BackgroundLines";
import GoogleLogo from '../../components/GoogleLogo';
import { saveToken, getToken } from '../../lib/secureStorage';
import { useFonts } from 'expo-font';

WebBrowser.maybeCompleteAuthSession();

type AuthMode = 'signin' | 'signup' | 'confirmation' | 'forgot';

type ErrorType = {
  message: string;
  type: 'email' | 'password' | 'general';
};

const { width, height } = Dimensions.get("window");

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const MemoizedBackgroundLines = React.memo(BackgroundLines);

export default function SignInOld() {
  // Load fonts for web and native
  const [fontsLoaded] = useFonts({
    'Montserrat-Medium': require('../../assets/fonts/Montserrat-Medium.ttf'),
    'Montserrat-Regular': require('../../assets/fonts/Montserrat-Regular.ttf'),
    'Montserrat-Bold': require('../../assets/fonts/Montserrat-Bold.ttf'),
  });

  // All hooks must be called before any return or conditional
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
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const checkAuth = async () => {
      try {
        const token = await getToken('access_token');
        if (token) {
          const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
            },
          });
          if (response.ok && isMounted) {
            router.replace('/(tabs)');
            return;
          }
        }
      } catch (error) {
        // Do not redirect if error
        console.error('Auth check error:', error);
      } finally {
        if (isMounted) setCheckingAuth(false);
      }
    };
    checkAuth();
    return () => { isMounted = false; };
  }, []);

  // Google Sign-In handler
  const handleGoogleSignIn = async (idToken: string) => {
    try {
      setLoading(true);
      setError(null);
      // דוגמה ל-Supabase (אם היית משתמש בו):
      // const { data, error: signInError } = await supabase.auth.signInWithIdToken({
      //   provider: 'google',
      //   token: idToken,
      // });
      // if (signInError) throw signInError;
      // if (data.session) {
      //   router.replace('/(tabs)');
      // }
      // אם עברת ל-fetch, תצטרך לממש את זה מול ה-API שלך
      // TODO: Implement Google sign-in with fetch if not using Supabase
      alert('Google sign-in logic not implemented. Add your API call here.');
    } catch (error: any) {
      setError({ message: error.message, type: 'general' });
    } finally {
      setLoading(false);
    }
  };

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
        const result = await signUp(email, password);
        if (result.error || result.msg) {
          setError({ message: result.error?.message || result.msg || 'Sign up failed', type: 'general' });
          return;
        }
        if (result.access_token) {
          await saveToken('access_token', result.access_token);
          // Fetch userId from Supabase
          const userRes = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
            headers: {
              'Authorization': `Bearer ${result.access_token}`,
              'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
            },
          });
          const userData = await userRes.json();
          const userId = userData.id || userData.sub;
          if (userId) {
            router.replace('/(tabs)');
          } else {
            setMode('confirmation');
            setConfirmationMessage('A verification email has been sent. Please verify your email to continue.');
          }
          return;
        } else {
          setMode('confirmation');
          setConfirmationMessage('A verification email has been sent. Please verify your email to continue.');
          return;
        }
      } else {
        const result = await signIn(email, password);
        if (result.error || result.msg) {
          setError({ message: result.error?.message || result.msg || 'Sign in failed', type: 'general' });
          return;
        }
        if (result.access_token) {
          await saveToken('access_token', result.access_token);
          // Fetch userId from Supabase
          const userRes = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
            headers: {
              'Authorization': `Bearer ${result.access_token}`,
              'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
            },
          });
          const userData = await userRes.json();
          const userId = userData.id || userData.sub;
          if (userId) {
            router.replace('/(tabs)');
          }
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setError({ message: error.message, type: 'general' });
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    setError({ message: 'Resend confirmation is not supported with REST API. Please check your email or contact support.', type: 'general' });
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
      <Ionicons name="alert-circle" size={24} color="#c62828" />
      <CustomText style={styles.errorText}>{error.message}</CustomText>
    </Animated.View>
  );

  if (checkingAuth || !fontsLoaded) return null;

  if (mode === 'confirmation') {
    return (
      <View style={{ flex: 1, backgroundColor: "#0B1120" }}>
        <MemoizedBackgroundLines />
        <AuroraBackground>
          <View style={[styles.container, styles.confirmationContainer]}>
            <View style={styles.header}>
              <Ionicons name="diamond" size={48} color="#007AFF" />
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
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0B1120" }}>
      <View style={{ flex: 1 }}>
        <MemoizedBackgroundLines />
        <LinearGradient
          colors={["#071634CC", "#153E90CC", "#4F8EF7CC"]} // שים לב ל-CC!
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <View style={styles.topLogoContainer}>
        <Image
          source={require('../../assets/images/logo white-08.png')}
          style={[styles.topLogo, { marginTop: 70 }]}
          resizeMode="contain"
        />
      </View>
      <View style={styles.cardContainer}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.cardContent}>
            <CustomText style={styles.title}>{mode === 'signup' ? 'Get started free.' : 'Welcome Back'}</CustomText>
            <CustomText style={styles.subtitle}>
              {mode === 'signup' ? 'Free forever. No credit card needed.' : 'Enter your details below'}
            </CustomText>
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
                style={[styles.input, { flex: 1, marginBottom: 0, textAlign: 'left', textAlignVertical: 'center' }]}
                placeholder="Password"
                placeholderTextColor="#888"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                textContentType="password"
                autoCorrect={false}
                autoComplete="off"
                importantForAutofill="no"
                keyboardType="default"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword((v) => !v)}
                activeOpacity={0.7}
              >
                {showPassword ? (
                  <Ionicons name="eye-off" size={24} color="#0A1F44" />
                ) : (
                  <Ionicons name="eye" size={24} color="#0A1F44" />
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
            {error && <CustomText style={styles.errorText}>{error.message}</CustomText>}
            <TouchableOpacity
              style={[
                styles.button,
                styles.primaryButton,
                loading && styles.buttonDisabled,
                isButtonActive && styles.primaryButtonActive
              ]}
              onPress={handleEmailAuth}
              disabled={loading}
              activeOpacity={0.9}
              onPressIn={() => setIsButtonActive(true)}
              onPressOut={() => setIsButtonActive(false)}
            >
              {/* Single static gradient */}
              <LinearGradient
                colors={['#0E2657', '#081632']}
                locations={[0, 1]}
                start={{ x: 1, y: 1 }}
                end={{ x: 0, y: 0 }}
                style={StyleSheet.absoluteFill}
              />

              {/* Button content */}
              <Animated.View 
                style={[
                  {
                    width: '100%',
                    alignItems: 'center',
                    transform: [
                      { scale: isButtonActive ? 0.98 : 1 }
                    ]
                  }
                ]}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <CustomText style={[styles.buttonText, { fontSize: 16, letterSpacing: 0.5 }]}>
                    {mode === 'signup' ? 'Sign Up' : 'Sign In'}
                  </CustomText>
                )}
              </Animated.View>
            </TouchableOpacity>
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
            <View style={styles.socialRow}>
              <TouchableOpacity 
                style={styles.socialButton}
                onPress={() => promptAsync()}
              >
                <GoogleLogo size={22} style={{ marginRight: 8 }} />
                <CustomText style={styles.socialText}>Google</CustomText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Image source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png' }} style={styles.socialIcon} />
                <CustomText style={styles.socialText}>Facebook</CustomText>
              </TouchableOpacity>
            </View>
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
    height: 48,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    overflow: 'hidden',
  },
  primaryButton: {
    backgroundColor: 'transparent',
  },
  primaryButtonActive: {
    backgroundColor: 'transparent',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Montserrat-Medium",
    fontWeight: "500",
    zIndex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
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