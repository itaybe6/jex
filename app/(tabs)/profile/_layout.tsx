import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#121212',
        },
        headerShadowVisible: false,
        headerTitleStyle: {
          fontFamily: 'Heebo-Bold',
          color: '#fff',
        },
        headerTintColor: '#fff',
        contentStyle: {
          backgroundColor: '#121212',
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="add-product"
        options={{
          title: 'Add Product',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="add-request"
        options={{
          title: 'Add Request',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="products/[id]"
        options={{
          title: 'Product Details',
        }}
      />
      <Stack.Screen
        name="requests/[id]"
        options={{
          title: 'Request Details',
        }}
      />
      <Stack.Screen
        name="edit"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}