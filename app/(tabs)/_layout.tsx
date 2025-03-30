import { Tabs } from 'expo-router';
import { Home, User, Settings, Search, Plus } from 'lucide-react-native';
import { View, TouchableOpacity, Text, Modal, StyleSheet } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
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
    <SafeAreaView style={styles.container}>
      <Tabs
        screenOptions={{
          header: () => <TopHeader />,
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: '#666',
          tabBarStyle: {
            borderTopWidth: 1,
            borderTopColor: '#333',
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
            backgroundColor: '#000',
          },
          tabBarShowLabel: false,
          tabBarLabelStyle: {
            fontFamily: 'Heebo-Medium',
            fontSize: 12,
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: '',
            tabBarIcon: ({ focused }) => (
              <TabBarIcon Icon={Home} focused={focused} />
            ),
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
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ focused }) => (
              <TabBarIcon Icon={Settings} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: '',
            tabBarIcon: ({ focused }) => (
              <TabBarIcon Icon={User} focused={focused} />
            ),
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
              <Plus size={24} color="#333" />
              <Text style={styles.menuText}>Add Product</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={handleAddRequest}
            >
              <Plus size={24} color="#333" />
              <Text style={styles.menuText}>Add Request</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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
    fontFamily: 'Heebo-Medium',
    color: '#333',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#eee',
  },
}); 