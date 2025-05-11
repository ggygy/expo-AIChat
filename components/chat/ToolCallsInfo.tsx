import React, { FC, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '../ThemedText';
import { IconSymbol } from '../ui/IconSymbol';
import i18n from '@/i18n/i18n';
import { type ToolCall } from '@langchain/core/messages/tool';

interface ToolCallsInfoProps {
  toolCalls: ToolCall[] | undefined;
  textColor: string;
  tintColor: string;
}

const ToolCallsInfo: FC<ToolCallsInfoProps> = ({ toolCalls, textColor, tintColor }) => {
  
  if (!toolCalls || toolCalls.length === 0) return null;
  
  const [expanded, setExpanded] = useState(false);
  
  return (
    <View style={styles.metadataSection}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)} style={styles.metadataHeader}>
        <IconSymbol name="build" type="material" size={14} color={tintColor} />
        <ThemedText style={[styles.metadataTitle, { color: textColor }]}>
          {i18n.t('chat.toolCalls')} ({toolCalls.length})
        </ThemedText>
        <IconSymbol 
          name={expanded ? "chevron-up" : "chevron-down"} 
          type="fontAwesome" 
          size={14} 
          color={textColor} 
        />
      </TouchableOpacity>
      
      {expanded && (
        <View style={styles.toolCallsContainer}>
          {toolCalls.map((tool, index) => (
            <View key={index} style={styles.toolCallItem}>
              <ThemedText style={[styles.toolName, { color: tintColor }]}>
                {tool.name || tool.name || `${i18n.t('chat.toolDefault')}${index + 1}`}
              </ThemedText>
              <ThemedText style={[styles.toolDescription, { color: textColor }]} numberOfLines={3}>
                {JSON.stringify(tool.args).substring(0, 100)}
                {(JSON.stringify(tool.args || {}).length > 100) ? '...' : ''}
              </ThemedText>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  metadataSection: {
    marginVertical: 4,
    padding: 6,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 6,
  },
  metadataHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metadataTitle: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 4,
    flex: 1,
  },
  toolCallsContainer: {
    marginTop: 4,
  },
  toolCallItem: {
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderLeftWidth: 2,
    borderLeftColor: '#4e9bff',
    marginVertical: 2,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 4,
  },
  toolName: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 2,
  },
  toolDescription: {
    fontSize: 12,
    opacity: 0.8,
  },
});

export default ToolCallsInfo;
