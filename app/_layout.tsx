import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { useColorScheme } from '@/hooks/useColorScheme';
import i18n from '@/i18n/i18n';
import { useLanguageStore } from '@/store/useLanguageStore';
import { useThemeStore } from '@/store/useThemeStore';
import { ThemedView } from '@/components/ThemedView';
import { toastConfig } from '@/components/toastConfig';

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
    animationDuration: 300,
    headerStyle: {
      backgroundColor: currentTheme.colors.background,
    },
    headerTintColor: currentTheme.colors.text,
    cardStyle: {
      backgroundColor: currentTheme.colors.background,
      flex: 1
    },
    contentStyle: {
      backgroundColor: 'transparent'
    }
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
        <ThemedView style={{ flex: 1 }}>
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
                animation: 'slide_from_right',
                title: i18n.t('settings.aiConfig.title'),
              }}
            />
            <Stack.Screen
              name="version"
              options={{
                animation: 'slide_from_right',
                title: i18n.t('settings.about.version'),
              }}
            />
            <Stack.Screen
              name="newBot"
              options={{
                animation: 'slide_from_right',
                title: i18n.t('bot.create'),
              }}
            />
            <Stack.Screen
              name="editBot/[botId]"
              options={{
                animation: 'slide_from_right',
                title: i18n.t('bot.edit'),
              }}
            />
            <Stack.Screen
              name="chat/[botId]"
              options={{
                animation: 'slide_from_right',
              }}
            />
          </Stack>
          <StatusBar style={currentTheme === DarkTheme ? 'light' : 'dark'} />
        </ThemedView>
      </ThemeProvider>
      <Toast config={toastConfig} topOffset={50}/>
    </SafeAreaProvider>
  );
}
