import React, { useState, useEffect, memo } from 'react';
import { View, StyleSheet, FlatList, Switch, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useToolStore } from '@/store/useToolStore';
import { useBotStore } from '@/store/useBotStore';
import { useThemeColor } from '@/hooks/useThemeColor';
import i18n from '@/i18n/i18n';
import { type ToolDefinition } from '@/langchain/tools';
import { MODEL_PROVIDERS } from '@/constants/ModelProviders';
import { useProviderStore } from '@/store/useProviderStore';

interface ToolSelectorProps {
  botId: string;
}

const ToolSelector = ({ botId }: ToolSelectorProps) => {
  const { tools } = useToolStore();
  const { getBotInfo, updateBot } = useBotStore();
  
  const botInfo = getBotInfo(botId);
  const [enabledToolIds, setEnabledToolIds] = useState<string[]>(botInfo?.enabledToolIds || []);
  const [modelSupportsTools, setModelSupportsTools] = useState<boolean>(false);
  
  // 颜色主题
  const cardBgColor = useThemeColor({}, 'settingItemBackground');
  const secondaryTextColor = useThemeColor({}, 'secondaryText');
  const borderColor = useThemeColor({}, 'border');
  
  // 初始化状态并检查模型是否支持工具
  useEffect(() => {
    setEnabledToolIds(botInfo?.enabledToolIds || []);
    
    // 检查模型是否支持工具功能
    if (botInfo) {
      const provider = MODEL_PROVIDERS.find(p => p.id === botInfo.providerId);
      if (provider) {
        const model = provider.availableModels.find(m => m.id === botInfo.modelId);
        setModelSupportsTools(!!model?.supportTools);
      }
    }
  }, [botInfo]);
  
  const toggleTool = (id: string) => {
    // 检查是否支持工具功能
    if (!modelSupportsTools) {
      Alert.alert(
        i18n.t('common.warning'),
        i18n.t('bot.modelToolsNotSupported'),
        [{ text: i18n.t('common.ok'), style: 'default' }]
      );
      return;
    }
    
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
          disabled={!modelSupportsTools}
        />
      </ThemedView>
    );
  };
  
  return (
    <View style={styles.container}>
      {!modelSupportsTools && (
        <ThemedView style={[styles.warningBanner, { backgroundColor: '#FFF3CD' }]}>
          <ThemedText style={styles.warningText}>
            {i18n.t('bot.modelToolsNotSupported')}
          </ThemedText>
        </ThemedView>
      )}
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
  warningBanner: {
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  warningText: {
    color: '#664D03',
    fontSize: 12,
    textAlign: 'center',
  }
});

export default memo(ToolSelector);