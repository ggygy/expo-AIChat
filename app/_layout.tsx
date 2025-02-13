import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/useColorScheme';
import i18n from '@/i18n/i18n';
import { useLanguageStore } from '@/store/useLanguageStore';
import { useThemeStore } from '@/store/useThemeStore';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const themeMode = useThemeStore((state) => state.themeMode);
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // 根据 themeMode 确定当前主题
  const currentTheme = useMemo(() => {
    if (themeMode === 'system') {
      return colorScheme === 'dark' ? DarkTheme : DefaultTheme;
    }
    return themeMode === 'dark' ? DarkTheme : DefaultTheme;
  }, [themeMode, colorScheme]);

  // 导航配置
  const screenOptions = useMemo(() => ({
    headerShown: true,
    animationDuration: 200,
    headerStyle: {
      backgroundColor: currentTheme.colors.background,
    },
    headerTintColor: currentTheme.colors.text,
  }), [currentTheme]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded, currentLanguage, themeMode]);

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={currentTheme}>
        <Stack screenOptions={screenOptions}>
          <Stack.Screen 
            name="(tabs)" 
            options={{ 
              headerShown: false,
            }} 
          />
          <Stack.Screen 
            name="config"
            options={{
              title: i18n.t('settings.aiConfig.title'),
            }}
          />
        </Stack>
        <StatusBar style={currentTheme === DarkTheme ? 'light' : 'dark'} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
