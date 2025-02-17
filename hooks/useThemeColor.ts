/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export type ThemeColorKey<T> = keyof typeof Colors.light & keyof typeof Colors.dark;
export type ColorValue<K extends ThemeColorKey<K>> = typeof Colors.light[K];

interface Props<K extends ThemeColorKey<K>> {
  light?: ColorValue<K>;
  dark?: ColorValue<K>;
}

export function useThemeColor<K extends ThemeColorKey<K>>(
  props: Props<K>,
  colorName: K
): ColorValue<K> {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps as ColorValue<K>;
  }
  return Colors[theme][colorName] as ColorValue<K>;
}
