import React from 'react';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, View, ActivityIndicator } from 'react-native';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import * as SplashScreen from 'expo-splash-screen';
import { useAuth } from '@/hooks/useAuth';
import { TopHeader } from '@/components/TopHeader';
import { Tabs } from 'expo-router';
import { Home, Package, User, Plus } from 'lucide-react-native';
import { TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import CustomText from '../components/CustomText';
import 'react-native-reanimated';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { session, loading: authLoading } = useAuth();
  
  // Only call useFrameworkReady on web platform
  if (Platform.OS === 'web') {
    useFrameworkReady();
  }

  const [fontsLoaded, fontError] = useFonts({
    'Montserrat-Regular': Montserrat_400Regular,
    'Montserrat-Medium': Montserrat_500Medium,
    'Montserrat-SemiBold': Montserrat_600SemiBold,
    'Montserrat-Bold': Montserrat_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Show loading state while fonts are loading
  if ((!fontsLoaded && !fontError) || authLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <CustomText style={{ display: 'none' }}> </CustomText>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: '#fff',
          },
        }}
      >
        {!session ? (
          // Show auth screens when not authenticated
          <Stack.Screen 
            name="(auth)"
            options={{ headerShown: false }}
          />
        ) : (
          // Show main app screens when authenticated
          <>
            <Stack.Screen 
              name="(tabs)"
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="user/[id]"
              options={{
                presentation: 'card',
                headerShown: true,
                headerTitle: 'פרופיל משתמש',
                headerBackTitle: 'חזרה',
              }}
            />
            <Stack.Screen
              name="notifications"
              options={{
                headerShown: true,
                headerTitle: 'Notifications',
              }}
            />
            <Stack.Screen
              name="products/[id]"
              options={{
                headerShown: true,
                headerTitle: "Product Details",
                headerBackTitle: "Back"
              }}
            />
          </>
        )}
      </Stack>
    </SafeAreaProvider>
  );
}

export function TabLayout() {
  const [showAddMenu, setShowAddMenu] = useState(false);

  const handleAddProduct = () => {
    setShowAddMenu(false);
    router.push('/profile/add-product');
  };

  const handleAddRequest = () => {
    setShowAddMenu(false);
    router.push('/profile/add-request');
  };

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: '#666',
          tabBarStyle: {
            borderTopWidth: 1,
            borderTopColor: '#eee',
          },
          tabBarLabelStyle: {
            fontFamily: 'Montserrat-Medium',
            fontSize: 12,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <Home size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="add"
          options={{
            title: '',
            headerShown: false,
            tabBarIcon: ({ color }) => (
              <TouchableOpacity
                onPress={() => setShowAddMenu(true)}
                style={styles.addButton}
              >
                <Plus size={24} color="#fff" />
              </TouchableOpacity>
            ),
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              setShowAddMenu(true);
            },
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <User size={24} color={color} />,
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              router.replace('/profile');
            },
          }}
        />
      </Tabs>

      <Modal
        visible={showAddMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAddMenu(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={handleAddProduct}
            >
              <Package size={24} color="#333" />
              <CustomText style={styles.menuText}>Add Product</CustomText>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={handleAddRequest}
            >
              <Plus size={24} color="#333" />
              <CustomText style={styles.menuText}>Add Request</CustomText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  addButton: {
    backgroundColor: '#007AFF',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  menuText: {
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
    color: '#333',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#eee',
  },
});