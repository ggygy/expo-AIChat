import React, { useCallback } from 'react';
import { StyleSheet, TouchableOpacity, FlatList, ListRenderItemInfo, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useToolStore } from '@/store/useToolStore';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ToolDefinition } from '@/langchain/tools';
import i18n from '@/i18n/i18n';
import { useColorScheme } from '@/hooks/useColorScheme';

interface ToolsTabProps {
  onNavigateToEditor: (id?: string) => void;
}

export function ToolsTab({ onNavigateToEditor }: ToolsTabProps) {
  const { tools } = useToolStore();
  const colorScheme = useColorScheme();
  
  // 使用主题色 - 确保卡片颜色与背景有区别
  const backgroundColor = useThemeColor({}, 'background');
  const cardBgColor = useThemeColor({}, 'settingItemBackground');  // 使用专门的卡片背景色
  const secondaryTextColor = useThemeColor({}, 'secondaryText');
  const primaryColor = useThemeColor({}, 'tint');
  const badgeBgColor = useThemeColor({light: '#afafaf' as any}, 'background');
  const badgeTextColor = useThemeColor({}, 'secondaryText');
  const borderColor = useThemeColor({}, 'border');

  const renderItem = useCallback(({ item }: ListRenderItemInfo<ToolDefinition>) => (
    <TouchableOpacity 
      style={[
        styles.itemCard, 
        { 
          backgroundColor: cardBgColor,
          borderColor,
        }
      ]}
      onPress={() => onNavigateToEditor(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <ThemedText style={styles.cardTitle}>{item.name}</ThemedText>
        {item.isSystem && (
          <View style={[styles.systemBadge, { backgroundColor: badgeBgColor }]}>
            <ThemedText style={[styles.systemBadgeText, { color: badgeTextColor }]}>
              {i18n.t('common.system')}
            </ThemedText>
          </View>
        )}
      </View>
      <ThemedText style={[styles.cardDescription, { color: secondaryTextColor }]} numberOfLines={2}>
        {item.description}
      </ThemedText>
    </TouchableOpacity>
  ), [onNavigateToEditor, cardBgColor, borderColor, badgeBgColor, badgeTextColor, secondaryTextColor, colorScheme]);

  return (
    <ThemedView style={[styles.tabContent, { backgroundColor }]}>
      <ThemedText style={styles.description}>
        {i18n.t('explore.aiToolsDescription')}
      </ThemedText>
      
      <FlatList
        data={tools}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListFooterComponent={
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: primaryColor }]}
            onPress={() => onNavigateToEditor()}
          >
            <IconSymbol name="add-circle" size={20} color="#FFF" />
            <ThemedText style={styles.addButtonText}>{i18n.t('explore.addNewTool')}</ThemedText>
          </TouchableOpacity>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  listContainer: {
    paddingBottom: 80, // 提供足够的底部空间
  },
  itemCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: StyleSheet.hairlineWidth,
    // 基础阴影设置，对暗模式影响小
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  // 为亮色模式增加额外的阴影和边框效果
  lightModeCardShadow: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardDescription: {
    fontSize: 14,
  },
  systemBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  systemBadgeText: {
    fontSize: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  addButtonText: {
    color: '#FFF',
    marginLeft: 8,
    fontWeight: '500',
  },
});
