import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Platform, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { useColorScheme } from '@/hooks/useColorScheme';
import i18n from '@/i18n/i18n';
import { useLanguageStore } from '@/store/useLanguageStore';
import { useThemeStore } from '@/store/useThemeStore';
import { ThemedView } from '@/components/ThemedView';
import { toastConfig } from '@/components/toastConfig';
import { initDatabase } from '@/database';
import { configureLangChainFetch } from '@/utils/langchainFetchAdapter';
import { useThemeColor } from '@/hooks/useThemeColor';
import 'react-native-url-polyfill/auto';


// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const themeMode = useThemeStore((state) => state.themeMode);
  const [loaded, setLoaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    Iconfont: require('../assets/fonts/iconfont.ttf'),
  });
  const [dbInitialized, setDbInitialized] = useState(false);
  const backgroundColor = useThemeColor({}, 'background');

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
    headerTransparent: true,
    animationDuration: 300,
    safeAreaInsets: {
      top: insets.top, // 状态栏高度
      right: 0,
      bottom: 0,
      left: 0
    },
    headerStyle: {
      backgroundColor: backgroundColor,
    },
    headerTitleAlign: 'center' as const,
    headerTintColor: currentTheme.colors.text,
    cardStyle: {
      backgroundColor: backgroundColor,
      flex: 1
    },
    contentStyle: {
      backgroundColor: 'transparent',
      flex: 1,
    },
    headerBackTitleVisible: false,
    headerShadowVisible: false,
  }), [currentTheme, insets]);

  useEffect(() => {
    async function initialize() {
      try {
        if (loaded) {
          configureLangChainFetch(); // 应用 fetch polyfill
          await initDatabase();
          setDbInitialized(true);
          await SplashScreen.hideAsync();
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    }

    initialize();
  }, [loaded]);

  // 等待字体和数据库都加载完成
  if (!loaded || !dbInitialized) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={currentTheme}>
        <GestureHandlerRootView style={[styles.container, { backgroundColor }]}>
          <Stack screenOptions={screenOptions}>
            <Stack.Screen
              name="(tabs)"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="providerConfig"
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
              name="chat/[id]"
              options={{
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="explores/toolEditor"
              options={{
                animation: 'slide_from_right',
                title: i18n.t('settings.aiConfig.title'),
              }}
            />
            <Stack.Screen
              name="explores/promptEditor"
              options={{
                animation: 'slide_from_right',
                title: i18n.t('settings.aiConfig.title'),
              }}
            />
            <Stack.Screen
              name="explores/promptEditor/[id]"
              options={{
                animation: 'slide_from_right',
                title: i18n.t('settings.aiConfig.title'),
              }}
            />
            <Stack.Screen
              name="explores/toolEditor/[id]"
              options={{
                animation: 'slide_from_right',
                title: i18n.t('settings.aiConfig.title'),
              }}
            />
          </Stack>

          <StatusBar
            style={colorScheme === 'dark' ? 'light' : 'dark'}
            backgroundColor={colorScheme === 'dark' ? '#000' : '#fff'}
            translucent={false}
          />
        </GestureHandlerRootView>
      </ThemeProvider>
      <Toast config={toastConfig} topOffset={50} />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
