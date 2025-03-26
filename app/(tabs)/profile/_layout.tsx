import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen 
        name="product/[id]" 
        options={{
          presentation: 'modal',
          headerShown: true,
          headerTitle: 'פרטי מוצר',
          headerBackTitle: 'חזרה',
        }}
      />
      <Stack.Screen 
        name="add-product" 
        options={{
          presentation: 'modal',
          headerShown: true,
          headerTitle: 'הוספת מוצר',
          headerBackTitle: 'חזרה',
        }}
      />
      <Stack.Screen 
        name="edit" 
        options={{
          presentation: 'modal',
          headerShown: true,
          headerTitle: 'עריכת פרופיל',
          headerBackTitle: 'חזרה',
        }}
      />
    </Stack>
  );
}