import { useColorScheme as _useColorScheme } from 'react-native';
import { useThemeStore } from '@/store/useThemeStore';

export function useColorScheme() {
  const systemColorScheme = _useColorScheme();
  const themeMode = useThemeStore(state => state.themeMode);

  if (themeMode === 'system') {
    return systemColorScheme;
  }

  return themeMode;
}
