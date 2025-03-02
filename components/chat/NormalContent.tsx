import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '../ThemedText';
import MarkdownWithCodeHighlight from '../markdown/MarkdownWithCodeHighlight';

interface NormalContentProps {
  content: string;
  contentType: 'text' | 'markdown' | 'image' | 'code' | 'audio' | 'video' | 'file';
  markdownStyles: any;
}

const NormalContent = memo(({
  content,
  contentType = 'markdown',
  markdownStyles,
}: NormalContentProps) => {
  return (
    <View style={styles.container}>
      {contentType === 'markdown' ? (
        <MarkdownWithCodeHighlight style={markdownStyles}>
          {content}
        </MarkdownWithCodeHighlight>
      ) : (
        <ThemedText style={styles.messageText}>{content}</ThemedText>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  }
});

export default NormalContent;
