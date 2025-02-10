import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import i18n from '@/i18n/i18n';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [TabsTitle, setTabsTitle] = useState({
    index: i18n.t('tabs.home'),
    explore: i18n.t('tabs.explore'),
    settings: i18n.t('tabs.settings'),
  });

  useEffect(() => {
    const updateTitles = () => {
      setTabsTitle({
        index: i18n.t('tabs.home'),
        explore: i18n.t('tabs.explore'),
        settings: i18n.t('tabs.settings'),
      });
    };

    // 使用内置的 onChangeLocale 方法
    i18n.onChange(updateTitles);

    return () => {
      // 清理监听器
      i18n.onChange(updateTitles);
    };
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
            height: 70,
          },
          default: {
            height: 57,
          },
        }),
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: '500',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: TabsTitle.index,
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: TabsTitle.explore,
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="explore" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: TabsTitle.settings,
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="settings" color={color} />,
        }}
      />
    </Tabs>
  );
}
