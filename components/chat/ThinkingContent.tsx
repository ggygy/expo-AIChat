import React, { memo, useCallback, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';
import MarkdownWithCodeHighlight from '../markdown/MarkdownWithCodeHighlight';
import i18n from '@/i18n/i18n';

interface ThinkingContentProps {
  thinkingContent: string;
  thinkingMarkdownStyles: any;
  thinkingBgColor: string;
  thinkingTextColor: string;
  initialIsExpanded?: boolean;
}

const ThinkingContent = memo(({
  thinkingContent,
  thinkingMarkdownStyles,
  thinkingBgColor,
  thinkingTextColor,
  initialIsExpanded = true
}: ThinkingContentProps) => {
  const [isExpanded, setIsExpanded] = useState(initialIsExpanded);
  
  const toggleThinking = useCallback((e: any) => {
    e.stopPropagation();
    setIsExpanded(prev => !prev);
  }, []);

  return (
    <View style={styles.thinkingSection}>
      {/* 思考标题和折叠按钮 */}
      <Pressable 
        style={styles.thinkingHeader} 
        onPress={toggleThinking}
        android_ripple={{color: 'rgba(0,0,0,0.1)'}}
      >
        <ThemedText style={[styles.thinkingLabel, {color: thinkingTextColor}]}>
          {i18n.t('chat.thinking')}
        </ThemedText>
        <FontAwesome 
          name={isExpanded ? 'chevron-up' : 'chevron-down'} 
          size={14} 
          color={thinkingTextColor} 
        />
      </Pressable>
      
      {/* 可折叠的思考内容 */}
      {isExpanded && (
        <View style={[styles.thinkingContent, {backgroundColor: thinkingBgColor}]}>
          <MarkdownWithCodeHighlight style={thinkingMarkdownStyles}>
            {thinkingContent}
          </MarkdownWithCodeHighlight>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  thinkingSection: {
    marginBottom: 8,
  },
  thinkingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  thinkingLabel: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  thinkingContent: {
    marginTop: 4,
    borderRadius: 6,
    padding: 8,
  }
});

export default ThinkingContent;
