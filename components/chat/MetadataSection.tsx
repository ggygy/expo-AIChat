import React, { FC, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '../ThemedText';
import { IconSymbol } from '../ui/IconSymbol';
import { Message } from '@/constants/chat';
import TokenUsageInfo from './TokenUsageInfo';
import ToolCallsInfo from './ToolCallsInfo';
import i18n from '@/i18n/i18n';

interface MetadataSectionProps {
  message: Message;
  textColor: string;
  tintColor: string;
  colors: any;
}

const MetadataSection: FC<MetadataSectionProps> = ({ 
  message, 
  textColor, 
  tintColor,
  colors 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const hasMetadata = Boolean(
    message.tokenUsage || 
    (message.toolCalls && message.toolCalls.length > 0) ||
    (message.metadata && Object.keys(message.metadata).length > 0)
  );
  
  if (!hasMetadata) return null;
  
  return (
    <View style={[styles.metadataContainer, { borderTopColor: colors.metadataBorder || '#e0e0e0' }]}>
      <TouchableOpacity 
        style={styles.metadataToggle} 
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <ThemedText style={[styles.metadataToggleText, { color: tintColor }]}>
          {isExpanded ? i18n.t('chat.hideDetails') : i18n.t('chat.showDetails')}
        </ThemedText>
        <IconSymbol 
          name={isExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
          type="material" 
          size={16} 
          color={tintColor} 
        />
      </TouchableOpacity>
      
      {isExpanded && (
        <View style={styles.metadataContent}>
          <TokenUsageInfo tokenUsage={message.tokenUsage} textColor={textColor} />
          <ToolCallsInfo 
            toolCalls={message.toolCalls} 
            textColor={textColor} 
            tintColor={tintColor} 
          />
          
          {/* 如果有其他元数据也可以在这里添加 */}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  metadataContainer: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  metadataToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  metadataToggleText: {
    fontSize: 12,
    marginRight: 4,
  },
  metadataContent: {
    marginTop: 4,
  },
});

export default MetadataSection;
