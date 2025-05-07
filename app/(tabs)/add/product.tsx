import AddProductForm from './components/AddProductForm';
import { TopHeader } from '../../../components/TopHeader';
import { View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function AddProductScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <TopHeader />
      <TouchableOpacity
        onPress={() => router.back()}
        style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 16, marginTop: 8, marginBottom: 8, backgroundColor: '#fff', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 8 }}
      >
        <Ionicons name="arrow-back" size={24} color="#0E2657" style={{ marginRight: 6 }} />
        <Text style={{ color: '#0E2657', fontSize: 16, fontWeight: 'bold' }}>Back</Text>
      </TouchableOpacity>
      <AddProductForm />
    </View>
  );
}