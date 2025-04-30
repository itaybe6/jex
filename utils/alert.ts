import { Alert, Platform } from 'react-native';

export const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    // On web, use the browser's alert
    window.alert(`${title}\n${message}`);
  } else {
    // On mobile, use React Native's Alert
    Alert.alert(title, message);
  }
}; 