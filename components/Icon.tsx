import React from 'react';
import { Feather } from '@expo/vector-icons';

type IconProps = {
  name: keyof typeof Feather.glyphMap;
  size?: number;
  color?: string;
};

export function Icon({ name, size = 24, color = '#000' }: IconProps) {
  return <Feather name={name} size={size} color={color} />;
} 