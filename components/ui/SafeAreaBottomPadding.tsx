import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SafeAreaBottomPaddingProps {
  style?: StyleProp<ViewStyle>;
  minPadding?: number;
}

/**
 * 提供底部安全区域填充，确保内容不会被底部系统栏遮挡
 */
export const SafeAreaBottomPadding: React.FC<SafeAreaBottomPaddingProps> = ({ 
  style,
  minPadding = 1
}) => {
  const insets = useSafeAreaInsets();
  
  // 取安全区域底部值和最小填充的较大者
  const bottomPadding = Math.max(insets.bottom, minPadding);
  
  return <View style={[{ height: bottomPadding }, style]} />;
};

const styles = StyleSheet.create({});
