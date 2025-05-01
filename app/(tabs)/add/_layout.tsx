import { Stack } from 'expo-router';

export default function AddLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // אפשר גם לשים true אם אתה רוצה כותרת
      }}
    />
  );
}
