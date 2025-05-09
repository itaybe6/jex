import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { TopHeader } from '@/components/TopHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function TabBarIcon({ name, focused }: { name: any, focused: boolean }) {
  return (
    <View style={{
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
    }}>
      <Ionicons name={name} size={24} color={focused ? '#B0B6C1' : '#0E2657'} />
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['left', 'right']}>
      <Tabs
        screenOptions={{
          header: () => <TopHeader />,
          tabBarStyle: {
            backgroundColor: '#fff',
            paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
            paddingTop: 8,
            height: 85, // או minHeight: 64
            borderTopWidth: 0.5,
            borderTopColor: '#fff',
            zIndex: 100,
          },
          tabBarActiveTintColor: '#B0B6C1',
          tabBarInactiveTintColor: '#0E2657',
          tabBarShowLabel: false,
          headerStyle: {
            backgroundColor: '#F5F8FC',
          },
          headerShadowVisible: false,
          headerTitleStyle: {
            fontFamily: 'Montserrat-Bold',
            color: '#0E2657',
          },
          headerTintColor: '#0E2657',
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ focused }) => <TabBarIcon name="home" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            
            title: 'Search',
            tabBarIcon: ({ focused }) => <TabBarIcon name="search" focused={focused} />,
          }}
          
        />
        <Tabs.Screen
          name="add"
          options={{
            title: 'Add',
            headerShown: false,
            tabBarIcon: ({ focused }) => <TabBarIcon name="add" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="tools"
          options={{
            title: 'Tools',
            tabBarIcon: ({ focused }) => <TabBarIcon name="construct-outline" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ focused }) => <TabBarIcon name="person" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            href: null
          }}
        />
         <Tabs.Screen
          name="settings"
          options={{
            href: null
          }}
        />
        <Tabs.Screen
          name="user/[id]"
          options={{
            href: null
          }}
        />
        <Tabs.Screen
          name="products/[id]"
          options={{
            href: null,
            
          }}
        />
        <Tabs.Screen
          name="SelectDealProductScreen"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="DealStoryScreen"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="CreateDealStoryScreen"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="user/[id]/products"
          options={{
  
              href: null
          }}
        />
        <Tabs.Screen
          name="category-products"
          options={{
            href: null
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  addButtonContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    backgroundColor: '#6C5CE7',
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
  addButtonFocused: {
    transform: [{ scale: 1.1 }],
  },
  
}); 