import { Stack } from 'expo-router';

export default function ProductLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#fff' },
        headerTintColor: '#0E2657',
        headerTitleStyle: { fontFamily: 'Montserrat-Bold', color: '#0E2657' },
      }}
    >
      <Stack.Screen
        name="edit"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
} 