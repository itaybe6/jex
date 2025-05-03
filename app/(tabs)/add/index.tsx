import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TopHeader } from '../../../components/TopHeader';

export default function AddScreen() {
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <TopHeader />
      </SafeAreaView>
      
      <View style={styles.content}>
        <View style={styles.optionsContainer}>
          <TouchableOpacity 
            style={styles.option}
            onPress={() => router.push('/(tabs)/add/product')}
          >
            <Ionicons name="cube-outline" size={32} color="#6C5CE7" />
            <Text style={styles.optionTitle}>Add Product</Text>
            <Text style={styles.optionDescription}>Add a diamond or jewelry for sale</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.option}
            onPress={() => router.push('/(tabs)/add/request')}
          >
            <Ionicons name="search-outline" size={32} color="#6C5CE7" />
            <Text style={styles.optionTitle}>Add Request</Text>
            <Text style={styles.optionDescription}>Post a request for a specific diamond or jewelry</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  safeArea: {
    backgroundColor: '#121212',
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Heebo-Bold',
    color: '#fff',
  },
  optionsContainer: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  option: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  optionTitle: {
    fontSize: 18,
    fontFamily: 'Heebo-Bold',
    color: '#fff',
    textAlign: 'center',
  },
  optionDescription: {
    fontSize: 14,
    fontFamily: 'Heebo-Regular',
    color: '#888',
    textAlign: 'center',
  },
}); 