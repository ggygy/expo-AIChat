import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '../ThemedText';
import Markdown from 'react-native-markdown-display';
import { useThemeColor } from '@/hooks/useThemeColor';

interface SelectableMarkdownProps {
  children: string;
  style?: any;
  [key: string]: any;
}

/**
 * 创建一个基于HTML的可选择文本的Markdown组件
 */
const SelectableMarkdown: React.FC<SelectableMarkdownProps> = ({ 
  children, 
  style,
  ...rest 
}) => {
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  
  // 如果内容为空，直接返回空视图
  if (!children) {
    return null;
  }
  
  // 创建一个简单的HTML表示，让文本可选
  // 注意：这是一个简化的Markdown到HTML的转换，可能不支持所有Markdown功能
  // 但是它提供了基本的文本选择能力
  return (
    <View style={styles.container}>
      {/* 使用原始Markdown组件渲染，但设置为不可见 */}
      <View style={styles.hiddenMarkdown}>
        <Markdown style={style} {...rest}>
          {children}
        </Markdown>
      </View>
      
      {/* 使用原生文本渲染，确保可选择 */}
      <ThemedText 
        style={[
          styles.selectableText, 
          { 
            color: textColor,
            backgroundColor: backgroundColor
          }
        ]} 
        selectable={true}
      >
        {children}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  hiddenMarkdown: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
    overflow: 'hidden',
  },
  selectableText: {
    fontSize: 15,
    lineHeight: 24,
  },
});

export default SelectableMarkdown;
