import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function ToolsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tools</Text>
      <TouchableOpacity style={styles.button} onPress={() => router.push('/(tabs)/tools/ring-sizer')}>
        <View style={styles.iconContainer}>
          <Ionicons name="resize-outline" size={32} color="#6C5CE7" />
        </View>
        <Text style={styles.buttonText}>Ring Sizer</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => router.push('/(tabs)/tools/custom-model-service')}>
        <View style={styles.iconContainer}>
          <Ionicons name="cube-outline" size={32} color="#6C5CE7" />
        </View>
        <Text style={styles.buttonText}>Custom Model Service</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => router.push('/(tabs)/tools/mm-to-carat-chart')}>
        <View style={styles.iconContainer}>
          <Ionicons name="resize" size={32} color="#6C5CE7" />
        </View>
        <Text style={styles.buttonText}>MM to Carat Conversion Chart</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FC',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0E2657',
    marginBottom: 32,
    alignSelf: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#0E2657',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  buttonText: {
    fontSize: 18,
    color: '#0E2657',
    fontWeight: '500',
  },
  iconContainer: {
    marginRight: 8,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 