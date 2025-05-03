import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to the sign-in page by default
  return <Redirect href="/(auth)/sign-in" />;
}