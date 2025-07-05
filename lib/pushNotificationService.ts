import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export interface PushNotificationService {
  registerForPushNotifications(): Promise<string | null>;
  saveTokenToServer(token: string, userId: string): Promise<void>;
  setupNotificationHandler(): void;
  getCurrentToken(userId: string): Promise<string | null>;
}

class PushNotificationServiceImpl implements PushNotificationService {
  async registerForPushNotifications(): Promise<string | null> {
    if (Platform.OS === 'web') {
      return null;
    }

    try {
      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // If no permission, request it
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return null;
      }

      // Get the token with fallback options
      let token;
      try {
        // Try with projectId first (for production)
        if (Constants.expoConfig?.extra?.eas?.projectId) {
          token = await Notifications.getExpoPushTokenAsync({
            projectId: Constants.expoConfig.extra.eas.projectId,
          });
        } else {
          // Fallback for development
          token = await Notifications.getExpoPushTokenAsync();
        }
      } catch (error) {
        // Final fallback
        token = await Notifications.getExpoPushTokenAsync();
      }

      // Set up notification channel for Android
      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return token.data;
    } catch (error) {
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('aps-environment')) {
          return null;
        }
        if (error.message.includes('projectId')) {
          return null;
        }
      }
      
      return null;
    }
  }

  async saveTokenToServer(token: string, userId: string): Promise<void> {
    try {
      const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

      if (!baseUrl || !anonKey) {
        throw new Error('Missing Supabase configuration');
      }

      const response = await fetch(`${baseUrl}/rest/v1/profiles?id=eq.${userId}`, {
        method: 'PATCH',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({ push_token: token }),
      });

      if (!response.ok) {
        throw new Error('Failed to save push token to server');
      }

    } catch (error) {
      throw error;
    }
  }

  setupNotificationHandler(): void {
    // Handle notifications when app is in foreground
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    // Handle notification received
    Notifications.addNotificationReceivedListener((notification) => {
    });

    // Handle notification response (when user taps on notification)
    Notifications.addNotificationResponseReceivedListener((response) => {
      
      const data = response.notification.request.content.data;
      
      // Navigate based on notification type
      if (data?.productId) {
        // Navigate to product page
        // You'll need to implement navigation logic here
      }
    });
  }

  async getCurrentToken(userId: string): Promise<string | null> {
    try {
      const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

      if (!baseUrl || !anonKey) {
        return null;
      }

      const response = await fetch(`${baseUrl}/rest/v1/profiles?id=eq.${userId}&select=push_token`, {
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const token = data[0]?.push_token;
      
      return token || null;
    } catch (error) {
      return null;
    }
  }
}

export const pushNotificationService = new PushNotificationServiceImpl(); 