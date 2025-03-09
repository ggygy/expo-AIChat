import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '../ThemedText';
import OptimizedMarkdown from '@/components/markdown/OptimizedMarkdown';
import { ContentType } from '@/constants/chat';

interface NormalContentProps {
  content: string;
  contentType: ContentType;
  markdownStyles: any;
  isStreaming?: boolean;
}

const NormalContent: React.FC<NormalContentProps> = ({
  content,
  contentType,
  markdownStyles,
  isStreaming = false
}) => {
  // 根据内容类型渲染不同的组件
  switch (contentType) {
    case 'markdown':
      return (
        <View style={styles.markdownContainer}>
          {/* 修正：使用children属性而不是content */}
          <OptimizedMarkdown 
            style={markdownStyles}
            isStreaming={isStreaming}
            maxBlockSize={5000}
          >
            {content}
          </OptimizedMarkdown>
        </View>
      );
      
    case 'code':
      return (
        <View style={styles.codeContainer}>
          {/* 修正：使用children属性而不是content */}
          <OptimizedMarkdown 
            style={markdownStyles}
            isStreaming={isStreaming}
          >
            {`\`\`\`\n${content}\n\`\`\``}
          </OptimizedMarkdown>
        </View>
      );
      
    case 'text':
    default:
      return (
        <ThemedText style={styles.textContent} selectable={true}>
          {content}
        </ThemedText>
      );
  }
};

const styles = StyleSheet.create({
  markdownContainer: {
    width: '100%',
  },
  textContent: {
    fontSize: 15,
    lineHeight: 22,
  },
  codeContainer: {
    width: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
});

export default React.memo(NormalContent);