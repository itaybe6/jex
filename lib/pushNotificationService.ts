import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export interface PushNotificationService {
  registerForPushNotifications(): Promise<string | null>;
  saveTokenToServer(token: string, userId: string): Promise<void>;
  setupNotificationHandler(): void;
}

class PushNotificationServiceImpl implements PushNotificationService {
  async registerForPushNotifications(): Promise<string | null> {
    if (Platform.OS === 'web') {
      console.log('Push notifications not supported on web');
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
        console.log('Failed to get push token for push notification!');
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
        console.log('Error getting push token with projectId, trying without:', error);
        // Final fallback
        token = await Notifications.getExpoPushTokenAsync();
      }

      console.log('Expo Push Token:', token.data);

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
      console.error('Error registering for push notifications:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('aps-environment')) {
          console.log('iOS Push Notification Certificate not configured. This is normal in development.');
          console.log('For production, you need to configure push notifications in Apple Developer Console.');
          return null;
        }
        if (error.message.includes('projectId')) {
          console.log('Project ID not found. This is normal in development.');
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
        console.error('Missing Supabase environment variables');
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
        const errorText = await response.text();
        console.error('Failed to save push token:', errorText);
        throw new Error('Failed to save push token to server');
      }

      console.log('Push token saved successfully');
    } catch (error) {
      console.error('Error saving push token:', error);
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
      }),
    });

    // Handle notification received
    Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
    });

    // Handle notification response (when user taps on notification)
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification response:', response);
      
      const data = response.notification.request.content.data;
      
      // Navigate based on notification type
      if (data?.productId) {
        // Navigate to product page
        // You'll need to implement navigation logic here
        console.log('Navigate to product:', data.productId);
      }
    });
  }
}

export const pushNotificationService = new PushNotificationServiceImpl(); 