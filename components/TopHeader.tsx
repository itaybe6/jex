import { View, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export function TopHeader() {
  return (
    <SafeAreaView style={{ backgroundColor: '#0E2657' }} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Image source={require('@/assets/images/new whote head-05.png')} style={styles.logoImg} resizeMode="contain" />
        <Link href="/notifications" asChild>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={26} color="#fff" />
          </TouchableOpacity>
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 4,
    backgroundColor: '#0E2657',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: '#0E2657',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  logoImg: {
    height: 26,
    width: 95,
    marginLeft: 0,
  },
  iconButton: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: 'transparent',
    position: 'relative',
  },
});