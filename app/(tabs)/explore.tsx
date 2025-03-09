import React, { useState, useCallback } from 'react';
import { StyleSheet, Dimensions, SafeAreaView } from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { router, Stack } from 'expo-router';
import { useThemeColor } from '@/hooks/useThemeColor';
import i18n from '@/i18n/i18n';
import { PromptTemplatesTab } from '@/components/explore/PromptTemplatesTab';
import { ToolsTab } from '@/components/explore/ToolsTab';
import { useLanguageStore } from '@/store/useLanguageStore';

// 获取屏幕宽度
const initialLayout = { width: Dimensions.get('window').width };

export default function ExploreScreen() {
  // 标签页配置
  const [index, setIndex] = useState(0);
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const [routes] = useState([
    { key: 'prompts', title: i18n.t('explore.promptTemplates') },
    { key: 'tools', title: i18n.t('explore.aiTools') },
  ]);

  // 获取主题颜色 - 对于亮模式使用更浅的背景色
  const backgroundColor = useThemeColor({}, 'background');
  const primaryColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');

  // 导航函数
  const navigateToPromptEditor = useCallback((id?: string) => {
    if (id) {
      router.push(`/explores/promptEditor/${id}`);
    } else {
      router.push('/explores/promptEditor');
    }
  }, []);

  const navigateToToolEditor = useCallback((id?: string) => {
    if (id) {
      router.push(`/explores/toolEditor/${id}`);
    } else {
      router.push('/explores/toolEditor');
    }
  }, []);

  // 场景渲染
  const renderScene = ({ route }: { route: { key: string } }) => {
    switch (route.key) {
      case 'prompts':
        return <PromptTemplatesTab onNavigateToEditor={navigateToPromptEditor} />;
      case 'tools':
        return <ToolsTab onNavigateToEditor={navigateToToolEditor} />;
      default:
        return null;
    }
  };

  // 自定义TabBar
  const renderTabBar = (props: any) => (
    <TabBar
      {...props}
      indicatorStyle={{ backgroundColor: primaryColor }}
      style={[styles.tabBar, { backgroundColor }]}
      labelStyle={{ color: textColor, fontWeight: 'bold' }}
      activeColor={primaryColor}
      inactiveColor={textColor}
    />
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <ThemedView style={[styles.titleContainer, { backgroundColor }]}>
        <ThemedText type="title">{i18n.t('explore.title')}</ThemedText>
      </ThemedView>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={initialLayout}
        renderTabBar={renderTabBar}
        style={[styles.tabView, { backgroundColor }]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  tabView: {
    flex: 1,
    height: '100%',
  },
  tabBar: {
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
});
