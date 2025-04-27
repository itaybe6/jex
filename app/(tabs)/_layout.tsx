import { Tabs } from 'expo-router';
import { Home, User, Search, Plus, Settings } from 'lucide-react-native';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { TopHeader } from '@/components/TopHeader';
import { SafeAreaView } from 'react-native-safe-area-context';

function TabBarIcon({ Icon, focused }: { Icon: any, focused: boolean }) {
  return (
    <View style={{ 
      alignItems: 'center',
      justifyContent: 'center',
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: focused ? '#6C5CE7' : 'transparent'
    }}>
      <Icon size={24} color={focused ? '#fff' : '#999'} />
    </View>
  );
}

export default function TabLayout() {
  return (
    <SafeAreaView style={styles.container}>
      <Tabs
        screenOptions={{
          header: () => <TopHeader />,
          tabBarStyle: {
            backgroundColor: '#121212',
            borderTopColor: '#2a2a2a',
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarActiveTintColor: '#6C5CE7',
          tabBarInactiveTintColor: '#888',
          tabBarShowLabel: false,
          headerStyle: {
            backgroundColor: '#121212',
          },
          headerShadowVisible: false,
          headerTitleStyle: {
            fontFamily: 'Heebo-Bold',
            color: '#fff',
          },
          headerTintColor: '#fff',
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
          name="search"
          options={{
            title: 'Search',
            tabBarIcon: ({ focused }) => (
              <TabBarIcon Icon={Search} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="add"
          options={{
            title: 'Add',
            headerShown: false,
            tabBarIcon: ({ color }) => <Plus size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <User size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="notifications"
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
    backgroundColor: '#000',
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