import AddProductForm from './components/AddProductForm';
import { TopHeader } from '../../../components/TopHeader';
import { View } from 'react-native';
export default function AddProductScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#121212' }}>
      <TopHeader />
      <AddProductForm />
    </View>
  );
}