import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ListItem, SettingList } from '@/components/SettingList';
import i18n from '@/i18n/i18n';
import { useLanguageStore } from '@/store/useLanguageStore';
import { ThemedView } from '@/components/ThemedView';
import { useThemeStore } from '@/store/useThemeStore';
import { Colors } from '@/constants/Colors';
import { useMemo, useState } from 'react';
import { Stack, router } from 'expo-router';
import React from 'react';
import Constants from 'expo-constants';

export default function SettingsScreen() {
  const { currentLanguage, setLanguage } = useLanguageStore();
  const { themeMode, setThemeMode } = useThemeStore();
  const [switchValue, setSwitchValue] = useState(false);

  const appVersion = Constants.expoConfig?.version || '1.0.0';

  const settingsData = useMemo((): ListItem[] => [
    {
      id: 'language',
      type: 'select' as const,
      title: i18n.t('settings.language.title'),
      currentValue: currentLanguage,
      options: [
        { label: i18n.t('settings.language.en'), value: 'en' },
        { label: i18n.t('settings.language.zh'), value: 'zh' },
      ],
      onSelect: setLanguage as (value: string) => void,
    },
    {
      id: 'theme',
      type: 'select' as const,
      title: i18n.t('settings.theme.title'),
      currentValue: themeMode,
      options: [
        { label: i18n.t('settings.theme.light'), value: 'light' },
        { label: i18n.t('settings.theme.dark'), value: 'dark' },
        { label: i18n.t('settings.theme.system'), value: 'system' },
      ],
      onSelect: setThemeMode as (value: string) => void,
    },
    {
      id: 'aiConfig',
      type: 'link' as const,
      title: i18n.t('settings.aiConfig.title'),
      value: i18n.t('settings.aiConfig.description') as string,
      onPress: () => {
        router.navigate("/config");
      },
    },
    {
      id: 'version',
      type: 'link' as const,
      title: i18n.t('settings.about.version'),
      value: `v${appVersion}`,
      onPress: () => {
        router.navigate('/version');
      },
    },
    {
      id: 'about',
      type: 'switch',
      title: i18n.t('settings.about.title'),
      value: switchValue,
      onValueChange: (value: boolean) => {
        setSwitchValue(value);
      },
    },
  ], [currentLanguage, themeMode, switchValue, appVersion]);

  const backgroundStyle = useMemo(() => ({
    backgroundColor: Colors[themeMode === 'dark' ? 'dark' : 'light'].background
  }), [themeMode]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <SettingList data={settingsData} style={styles.SettingListContainer} />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  SettingListContainer: {
  },
});
