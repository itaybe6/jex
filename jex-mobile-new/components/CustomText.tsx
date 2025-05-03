import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { useFonts, Montserrat_400Regular } from '@expo-google-fonts/montserrat';

export default function CustomText({ style, ...props }: TextProps) {
  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Text
      {...props}
      style={[
        { fontFamily: 'Montserrat_400Regular' },
        style as TextStyle,
      ]}
    />
  );
} 