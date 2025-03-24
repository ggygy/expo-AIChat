import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, Dimensions, SafeAreaView, View, Text, Platform } from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { router } from 'expo-router';
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
  console.log('ExploreScreen', index);
  
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const [routes, setRoutes] = useState([
    { key: 'prompts', title: i18n.t('explore.promptTemplates') },
    { key: 'tools', title: i18n.t('explore.aiTools') },
  ]);

  useEffect(() => {
    setRoutes([
      { key: 'prompts', title: i18n.t('explore.promptTemplates') },
      { key: 'tools', title: i18n.t('explore.aiTools') },
    ]);
  }, [currentLanguage]);

  // 获取主题颜色
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

  // 使用 SceneMap 确保每个场景只渲染一次并保持状态
  const renderScene = SceneMap({
    prompts: () => (
      <View style={styles.sceneContainer} >
        <PromptTemplatesTab onNavigateToEditor={navigateToPromptEditor} />
      </View>
    ),
    tools: () => (
      <View style={styles.sceneContainer}>
        <ToolsTab onNavigateToEditor={navigateToToolEditor} />
      </View>
    ),
  });

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
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={initialLayout}
        renderTabBar={renderTabBar}
        style={styles.tabView}
        swipeEnabled={true}
        lazy={Platform.OS === 'ios'}
        overScrollMode="always"
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
  },
  tabBar: {
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  sceneContainer: {
    flex: 1,
    width: '100%',
    overflow: 'visible'
  },
});
