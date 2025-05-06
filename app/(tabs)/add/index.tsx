import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TopHeader } from '../../../components/TopHeader';

export default function AddScreen() {
  return (
    <View style={styles.container}>
      <TopHeader />
      <View style={styles.content}>
        <View style={styles.optionsContainer}>
          <TouchableOpacity 
            style={styles.option}
            onPress={() => router.push('/(tabs)/add/product')}
          >
            <Ionicons name="cube-outline" size={32} color="#0E2657" />
            <Text style={styles.optionTitle}>Add Product</Text>
            <Text style={styles.optionDescription}>Add a diamond or jewelry for sale</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.option}
            onPress={() => router.push('/(tabs)/add/request')}
          >
            <Ionicons name="search-outline" size={32} color="#0E2657" />
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
    backgroundColor: '#F5F8FC',
  },
  content: {
    flex: 1,
  },
  optionsContainer: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  option: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#0E2657',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat-Medium',
    color: '#0E2657',
    textAlign: 'center',
  },
  optionDescription: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: '#7B8CA6',
    textAlign: 'center',
  },
});
