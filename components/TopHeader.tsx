import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell } from 'lucide-react-native';
import { router } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export function TopHeader() {
  const handleNotificationsPress = () => {
    router.push('/notifications');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.logo}>JEX</Text>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={handleNotificationsPress}
          >
            <Bell size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
  },
  safeArea: {
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 4,
    backgroundColor: '#000',
  },
  logo: {
    fontSize: 24,
    fontFamily: 'Heebo-Bold',
    color: '#fff',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
});