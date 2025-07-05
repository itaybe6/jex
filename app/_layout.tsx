// This polyfill is needed to use Supabase with React Native
import 'react-native-url-polyfill/auto';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts, Montserrat_400Regular, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect } from 'react';
import { DealsProvider } from './context/DealsContext';
import { pushNotificationService } from '@/lib/pushNotificationService';
import { useAuth } from '@/hooks/useAuth';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { user } = useAuth();
  const [fontsLoaded, fontError] = useFonts({
    'Montserrat-Regular': Montserrat_400Regular,
    'Montserrat-Bold': Montserrat_700Bold,
  });

  useEffect(() => {
    setupPushNotifications();
  }, []);

  useEffect(() => {
    if (user) {
      registerAndSaveToken();
    }
  }, [user]);

  const setupPushNotifications = async () => {
    try {
      // Set up notification handlers
      pushNotificationService.setupNotificationHandler();
    } catch (error) {
      // Removed console.log
    }
  };

  const registerAndSaveToken = async () => {
    try {
      if (!user) {
        return;
      }
      // Check current token first
      const currentToken = await pushNotificationService.getCurrentToken(user.id);
      const token = await pushNotificationService.registerForPushNotifications();
      if (token && user) {
        await pushNotificationService.saveTokenToServer(token, user.id);
        // Check if token changed
        if (currentToken && currentToken !== token) {
          // Removed console.log('🔄 Token was updated!');
          // Removed console.log('   Old token:', currentToken.substring(0, 20) + '...');
          // Removed console.log('   New token:', token.substring(0, 20) + '...');
        }
      } else {
        // Removed console.log('❌ No push token received or no user logged in');
      }
    } catch (error) {
      // Removed console.log('Error setting up push notifications:', error);
      // Don't show error to user - this is expected in development
    }
  };

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <StatusBar style="auto" />
      <DealsProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(admin)" options={{ headerShown: false }} />
        </Stack>
      </DealsProvider>
    </GestureHandlerRootView>
  );
}