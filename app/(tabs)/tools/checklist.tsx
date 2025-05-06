import { View, Text, StyleSheet } from 'react-native';

export default function ChecklistScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Checklist</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0E2657',
  },
}); 