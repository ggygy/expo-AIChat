import { MaterialIcons } from '@expo/vector-icons';
import { FontAwesome } from '@expo/vector-icons';
import { FontAwesome5 } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleProp, TextStyle } from 'react-native';

type IconType = 'material' | 'fontAwesome' | 'fontAwesome5' | 'feather';

interface IconSymbolProps {
  name: string;
  type?: IconType | 'symbol';
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}

export function IconSymbol({ name, type = 'material', size = 24, color, style }: IconSymbolProps) {
  switch (type) {
    case 'fontAwesome':
      return (
        <FontAwesome
          name={name as any}
          size={size}
          color={color}
          style={style}
        />
      );
    case 'fontAwesome5':
      return (
        <FontAwesome5
          name={name as any}
          size={size}
          color={color}
          style={style}
        />
      );
    case 'feather':
      return (
        <Feather
          name={name as any}
          size={size}
          color={color}
          style={style}
        />
      );
    case 'material':
    default:
      return (
        <MaterialIcons
          name={name as any}
          size={size}
          color={color}
          style={style}
        />
      );
  }
}
