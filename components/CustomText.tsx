import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';

export default function CustomText({ style, ...props }: TextProps) {
  return (
    <Text
      {...props}
      style={[
        { fontFamily: 'Montserrat-Regular' },
        style as TextStyle,
      ]}
    />
  );
} 