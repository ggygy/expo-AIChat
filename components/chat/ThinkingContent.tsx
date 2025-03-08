import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '../ThemedText';
import Markdown from '@/components/markdown/OptimizedMarkdown';
import { FontAwesome } from '@expo/vector-icons';
import i18n from '@/i18n/i18n';

interface ThinkingContentProps {
  thinkingContent: string;
  thinkingMarkdownStyles: any;
  thinkingBgColor?: string;
  thinkingTextColor?: string;
  initialIsExpanded?: boolean;
  textSelectMode?: boolean; // 添加文本选择模式状态
}

const ThinkingContent: React.FC<ThinkingContentProps> = ({
  thinkingContent,
  thinkingMarkdownStyles,
  thinkingBgColor = 'rgba(0, 0, 0, 0.03)',
  thinkingTextColor = '#666',
  initialIsExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(initialIsExpanded);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <View style={[styles.thinkingContainer, { backgroundColor: thinkingBgColor }]}>
      <TouchableOpacity style={styles.thinkingHeader} onPress={toggleExpand}>
        <ThemedText style={[styles.thinkingLabel, { color: thinkingTextColor }]}>
          {i18n.t('chat.thinking')}
        </ThemedText>
        <FontAwesome 
          name={isExpanded ? "angle-up" : "angle-down"} 
          size={16} 
          color={thinkingTextColor} 
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.thinkingContent}>
          <Markdown style={thinkingMarkdownStyles}>
            {thinkingContent}
          </Markdown>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  thinkingContainer: {
    borderRadius: 8,
    padding: 10,
    marginVertical: 4,
  },
  thinkingLabel: {
    fontWeight: 'bold',
    marginBottom: 0,
    fontSize: 14,
  },
  thinkingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  thinkingContent: {
    marginTop: 8,
  },
  thinkingText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default ThinkingContent;
