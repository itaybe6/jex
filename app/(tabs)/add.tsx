import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { Package, Search } from 'lucide-react-native';

export default function AddScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>הוסף חדש</Text>
      </View>
      
      <View style={styles.optionsContainer}>
        <TouchableOpacity 
          style={styles.option}
          onPress={() => router.push('/(tabs)/profile/add-product')}
        >
          <Package size={32} color="#6C5CE7" />
          <Text style={styles.optionTitle}>הוסף מוצר</Text>
          <Text style={styles.optionDescription}>הוסף יהלום או תכשיט למכירה</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.option}
          onPress={() => router.push('/(tabs)/profile/add-request')}
        >
          <Search size={32} color="#6C5CE7" />
          <Text style={styles.optionTitle}>הוסף בקשה</Text>
          <Text style={styles.optionDescription}>פרסם בקשה ליהלום או תכשיט ספציפי</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'right',
  },
  optionsContainer: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  option: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  optionDescription: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
}); 