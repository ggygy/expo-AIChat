import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '../ThemedText';
import Markdown from '@/components/markdown/OptimizedMarkdown';

interface NormalContentProps {
  content: string;
  contentType?: 'text' | 'markdown';
  markdownStyles?: any;
  isStreaming?: boolean;
}

const NormalContent: React.FC<NormalContentProps> = ({
  content,
  contentType = 'markdown',
  markdownStyles,
  isStreaming = false,
}) => {
  // 根据是否是流式传输选择不同的渲染组件
  if (contentType === 'markdown') {
      return (
        <View style={styles.container}>
          <Markdown 
            style={markdownStyles || {}}
            isStreaming={isStreaming} // 传递流式状态
          >
            {content}
          </Markdown>
        </View>
      );
  } else {
    // 文本内容直接显示
    return (
      <View style={styles.container}>
        <ThemedText 
          style={styles.textContent} 
          selectable={true}
        >
          {content}
        </ThemedText>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  textContent: {
    fontSize: 15,
    lineHeight: 22,
  },
});

export default NormalContent;