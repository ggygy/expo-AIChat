import { View } from 'react-native';
import type { ViewProps } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';

interface ThemedViewProps extends ViewProps {
  darkColor?: string;
  lightColor?: string;
}

export function ThemedView(props: ThemedViewProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const colorScheme = useColorScheme();

  const backgroundColor = colorScheme === 'dark' 
    ? (darkColor || '#000') 
    : (lightColor || '#fff');

  return (
    <View
      style={[
        { backgroundColor },
        style,
      ]}
      {...otherProps}
    />
  );
}
