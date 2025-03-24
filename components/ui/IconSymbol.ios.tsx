import { SFSymbol, SymbolView, SymbolViewProps, SymbolWeight } from 'expo-symbols';
import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { FontAwesome, FontAwesome5, Feather, MaterialIcons } from '@expo/vector-icons';

type IconType = 'material' | 'fontAwesome' | 'fontAwesome5' | 'feather' | 'symbol';

// 映射通用图标名称到iOS的SF Symbols名称
const mapIconNameToSymbol = (name: string): string => {
  const iconMap: Record<string, string> = {
    'home': 'house',
    'explore': 'safari',
    'settings': 'gearshape',
    'add-circle': 'plus.circle',
    'chevron-right': 'chevron.right',
    'remove-circle': 'minus.circle',
    'gear': 'gearshape',
    'trash': 'trash',
    'arrow-back': 'arrow.left',
  };
  
  return iconMap[name] || name; // 如果没有映射，返回原始名称
};

interface IconSymbolProps {
  name: string;
  type?: IconType;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}

export function IconSymbol({
  name,
  type = 'symbol',
  size = 24,
  color = '#000',
  style,
  weight = 'regular',
}: IconSymbolProps) {
  // 对于非 SF Symbols 的图标，使用相应的图标库
  if (type !== 'symbol') {
    switch (type) {
      case 'fontAwesome':
        return (
          <FontAwesome
            name={name as any}
            size={size}
            color={color}
            style={style as any}
          />
        );
      case 'fontAwesome5':
        return (
          <FontAwesome5
            name={name as any}
            size={size}
            color={color}
            style={style as any}
          />
        );
      case 'feather':
        return (
          <Feather
            name={name as any}
            size={size}
            color={color}
            style={style as any}
          />
        );
      case 'material':
        return (
          <MaterialIcons
            name={name as any}
            size={size}
            color={color}
            style={style as any}
          />
        );
    }
  }
  
  // 将输入的图标名称转换为正确的SF Symbols名称
  const symbolName = mapIconNameToSymbol(name);
  
  return (
    <SymbolView
      weight={weight}
      tintColor={color}
      resizeMode="scaleAspectFit"
      name={symbolName as SFSymbol}
      style={[
        {
          width: size,
          height: size,
        },
        style,
      ]}
    />
  );
}
