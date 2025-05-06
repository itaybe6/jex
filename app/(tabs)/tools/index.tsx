import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function ToolsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tools</Text>
      <TouchableOpacity style={styles.button} onPress={() => router.push('/(tabs)/tools/calculator')}>
        <Ionicons name="calculator-outline" size={24} color="#6C5CE7" style={{ marginRight: 8 }} />
        <Text style={styles.buttonText}>Calculator</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => router.push('/(tabs)/tools/checklist')}>
        <Ionicons name="checkbox-outline" size={24} color="#6C5CE7" style={{ marginRight: 8 }} />
        <Text style={styles.buttonText}>Checklist</Text>
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
}); 