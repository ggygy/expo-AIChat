import React from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import { TabView, TabBar, SceneRendererProps, NavigationState } from 'react-native-tab-view';
import { useThemeColor } from '@/hooks/useThemeColor';

const initialLayout = { width: Dimensions.get('window').width };

interface ThemedTabViewProps<T extends { key: string; title: string }> {
  routes: T[];
  renderScene: (props: SceneRendererProps & { route: T }) => React.ReactNode;
  index: number;
  onIndexChange: (index: number) => void;
  style?: any;
  tabBarStyle?: any;
  labelStyle?: any;
  indicatorStyle?: any;
  scrollEnabled?: boolean;
}

export function ThemedTabView<T extends { key: string; title: string }>({
  routes,
  renderScene,
  index,
  onIndexChange,
  style,
  tabBarStyle,
  labelStyle,
  indicatorStyle,
  scrollEnabled = false,
}: ThemedTabViewProps<T>) {
  const backgroundColor = useThemeColor({}, 'background');
  const primaryColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');

  const renderTabBar = (props: SceneRendererProps & { navigationState: NavigationState<T> }) => (
    <TabBar
      {...props}
      scrollEnabled={scrollEnabled}
      indicatorStyle={[styles.indicator, { backgroundColor: primaryColor }, indicatorStyle]}
      style={[styles.tabBar, { backgroundColor }, tabBarStyle]}
      tabStyle={[styles.label, { color: textColor }, labelStyle]}
      activeColor={primaryColor}
      inactiveColor={textColor}
    />
  );

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={onIndexChange}
      initialLayout={initialLayout}
      renderTabBar={renderTabBar}
      style={[styles.container, style]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  indicator: {
    height: 3,
  },
  label: {
    fontWeight: '600',
    textTransform: 'none',
  }
});
