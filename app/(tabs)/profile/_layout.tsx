import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: '#fff',
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
          headerShown: true,
          title: 'Add Product',
          presentation: 'modal',
          headerStyle: {
            backgroundColor: '#0E2657',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontFamily: 'Heebo-Bold',
          },
        }}
      />
      <Stack.Screen
        name="add-request"
        options={{
          headerShown: true,
          title: 'Add Request',
          presentation: 'modal',
          headerStyle: {
            backgroundColor: '#0E2657',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontFamily: 'Heebo-Bold',
          },
        }}
      />
      <Stack.Screen
        name="product/[id]"
        options={{
          headerShown: true,
          title: 'Product',
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTintColor: '#0E2657',
          headerTitleStyle: {
            fontFamily: 'Heebo-Bold',
            color: '#0E2657',
          },
          headerRight: () => null,
        }}
      />
      <Stack.Screen
        name="requests/[id]"
        options={{
          headerShown: true,
          title: 'Request Details',
          headerStyle: {
            backgroundColor: '#0E2657',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontFamily: 'Heebo-Bold',
          },
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