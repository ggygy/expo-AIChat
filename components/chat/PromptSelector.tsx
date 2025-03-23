import React, { useState, useEffect, memo } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Input } from '@/components/ui/Input';
import { usePromptStore } from '@/store/usePromptStore';
import { useBotStore } from '@/store/useBotStore';
import { useThemeColor } from '@/hooks/useThemeColor';
import { type PromptTemplateType } from '@/langchain/prompt';
import i18n from '@/i18n/i18n';


interface PromptSelectorProps {
  botId: string;
}

const PromptSelector = ({ botId }: PromptSelectorProps) => {
  const [selectedPromptId, setSelectedPromptId] = useState<string | undefined>();
  const [customSystemPrompt, setCustomSystemPrompt] = useState('');
  const { templates } = usePromptStore();
  const { getBotInfo, updateBot } = useBotStore();
  
  const botInfo = getBotInfo(botId);
  
  // 颜色主题
  const cardBgColor = useThemeColor({}, 'settingItemBackground');
  const selectedBgColor = useThemeColor({}, 'tint');
  const secondaryTextColor = useThemeColor({}, 'secondaryText');
  const borderColor = useThemeColor({}, 'border');
  
  // 初始化选择状态
  useEffect(() => {
    setSelectedPromptId(botInfo?.promptTemplateId);
    setCustomSystemPrompt(botInfo?.systemPrompt || '');
  }, [botInfo]);
  
  // 保存更改
  const handleSave = (promptId?: string, systemPrompt?: string) => {
    if (botInfo) {
      updateBot(botId, { 
        promptTemplateId: promptId,
        systemPrompt: systemPrompt || '' 
      });
    }
  };
  
  // 选择提示词模板
  const handleSelectPrompt = (id: string) => {
    // 如果点击当前选中的模板，则取消选择
    const newId = selectedPromptId === id ? undefined : id;
    setSelectedPromptId(newId);
    handleSave(newId, newId ? '' : customSystemPrompt);
  };
  
  // 更新自定义提示词
  const handleUpdateCustomPrompt = (text: string) => {
    setCustomSystemPrompt(text);
    if (!selectedPromptId) {
      handleSave(undefined, text);
    }
  };

  const renderItem = ({ item }: {item: PromptTemplateType}) => {
    const isSelected = selectedPromptId === item.id;
    return (
      <TouchableOpacity 
        style={[
          styles.promptItem,
          { backgroundColor: cardBgColor, borderColor },
          isSelected && { borderColor: selectedBgColor, borderWidth: 2 }
        ]}
        activeOpacity={0.8}
        onPress={() => handleSelectPrompt(item.id)}
      >
        <View style={styles.promptHeader}>
          <ThemedText 
            style={[
              styles.promptName,
              isSelected && { color: selectedBgColor }
            ]}
          >
            {item.name}
          </ThemedText>
          {isSelected && (
            <IconSymbol name="check-circle" size={18} color={selectedBgColor} />
          )}
        </View>
        <ThemedText 
          style={[styles.promptDescription, { color: secondaryTextColor }]} 
          numberOfLines={2}
        >
          {item.description || item.template.substring(0, 50) + '...'}
        </ThemedText>
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={styles.container}>
      <FlatList
        data={templates}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
      
      <View style={styles.customPromptSection}>
        <ThemedText style={styles.sectionLabel}>{i18n.t('chat.orUseCustomPrompt')}</ThemedText>
        <Input
          value={customSystemPrompt}
          onChangeText={handleUpdateCustomPrompt}
          multiline
          textAlignVertical="top"
          numberOfLines={6}
          style={[styles.customPromptInput, { borderColor }]}
          placeholder={i18n.t('chat.customPromptPlaceholder')}
          editable={!selectedPromptId}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  listContainer: {
    paddingRight: 16,
  },
  promptItem: {
    width: 200,
    padding: 12,
    marginRight: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  promptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  promptName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  promptDescription: {
    fontSize: 12,
  },
  customPromptSection: {
    marginTop: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  customPromptInput: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
});

export default memo(PromptSelector);
