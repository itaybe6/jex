import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="index" options={{ headerShown: false }} />
    <Stack.Screen name="calculator" options={{ headerShown: false }} />
    <Stack.Screen name="checklist" options={{ headerShown: false }} />
  </Stack>
  );
}
