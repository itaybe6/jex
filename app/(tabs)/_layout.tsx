import { Tabs } from 'expo-router';
import { Chrome as Home, User, Settings, Search, Plus } from 'lucide-react-native';
import { View, TouchableOpacity, Text, Modal, StyleSheet } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';

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
    <>
      <Tabs
        screenOptions={{
          tabBarStyle: {
            backgroundColor: '#000',
            borderTopWidth: 0,
            elevation: 0,
            height: 80,
            paddingBottom: 20,
            paddingTop: 10,
          },
          tabBarShowLabel: true,
          tabBarLabelStyle: {
            color: '#fff',
            fontSize: 12,
            fontFamily: 'Heebo-Regular'
          },
          headerShown: false,
          tabBarItemStyle: {
            flexDirection: 'row',
          }
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
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
            tabBarIcon: ({ focused }) => (
              <TouchableOpacity
                onPress={() => setShowAddMenu(true)}
                style={[
                  styles.addButton,
                  focused && styles.addButtonFocused
                ]}
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
            title: 'Profile',
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
    </>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: '#fff',
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