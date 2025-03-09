import React, { useState, useEffect, memo } from 'react';
import { View, StyleSheet, FlatList, Switch } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useToolStore } from '@/store/useToolStore';
import { useBotStore } from '@/store/useBotStore';
import { useThemeColor } from '@/hooks/useThemeColor';
import i18n from '@/i18n/i18n';
import { type ToolDefinition } from '@/langchain/tools';

interface ToolSelectorProps {
  botId: string;
}

const ToolSelector = ({ botId }: ToolSelectorProps) => {
  const { tools } = useToolStore();
  const { getBotInfo, updateBot } = useBotStore();
  
  const botInfo = getBotInfo(botId);
  const [enabledToolIds, setEnabledToolIds] = useState<string[]>(botInfo?.enabledToolIds || []);
  
  // 颜色主题
  const cardBgColor = useThemeColor({}, 'settingItemBackground');
  const secondaryTextColor = useThemeColor({}, 'secondaryText');
  const borderColor = useThemeColor({}, 'border');
  
  // 初始化状态
  useEffect(() => {
    setEnabledToolIds(botInfo?.enabledToolIds || []);
  }, [botInfo]);
  
  const toggleTool = (id: string) => {
    const updatedToolIds = enabledToolIds.includes(id)
      ? enabledToolIds.filter(toolId => toolId !== id)
      : [...enabledToolIds, id];
    
    setEnabledToolIds(updatedToolIds);
    updateBot(botId, { enabledToolIds: updatedToolIds });
  };
  
  const renderItem = ({ item }: { item: ToolDefinition }) => {
    const isEnabled = enabledToolIds.includes(item.id);
    
    return (
      <ThemedView 
        style={[
          styles.toolItem, 
          { borderBottomColor: borderColor, backgroundColor: cardBgColor }
        ]}
      >
        <View style={styles.toolInfo}>
          <ThemedText style={styles.toolName}>{item.name}</ThemedText>
          <ThemedText style={[styles.toolDescription, { color: secondaryTextColor }]}>
            {item.description}
          </ThemedText>
        </View>
        <Switch
          value={isEnabled}
          onValueChange={() => toggleTool(item.id)}
        />
      </ThemedView>
    );
  };
  
  return (
    <View style={styles.container}>
      <FlatList
        data={tools}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: borderColor }]} />}
      />
      {tools.length === 0 && (
        <ThemedText style={[styles.emptyText, { color: secondaryTextColor }]}>
          {i18n.t('chat.noToolsEnabled')}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  toolItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  toolInfo: {
    flex: 1,
    marginRight: 12,
  },
  toolName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  toolDescription: {
    fontSize: 12,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 4,
  },
  emptyText: {
    textAlign: 'center',
    padding: 16,
    fontSize: 14,
  },
});

export default memo(ToolSelector);