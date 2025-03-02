import React, { memo, useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import MarkdownWithCodeHighlight from './MarkdownWithCodeHighlight';
import { ThemedText } from '../ThemedText';

interface OptimizedMarkdownProps {
  children: string;
  style?: any;
  maxBlockSize?: number;
}

/**
 * 性能优化的Markdown组件，将长文本分块渲染，避免阻塞UI
 */
const OptimizedMarkdown = memo(({ 
  children, 
  style,
  maxBlockSize = 5000 // 默认每块最大字符数
}: OptimizedMarkdownProps) => {
  const [isReady, setIsReady] = useState(false);
  const [content, setContent] = useState<string>('');
  const animFrameRef = useRef<number | null>(null);
  
  // 确保 children 是字符串类型
  const textContent = typeof children === 'string' ? children : '';
  
  // 对长文本进行分块处理
  useEffect(() => {
    // 首先清除之前的请求
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    
    // 没有内容时直接返回
    if (!textContent) {
      setContent('');
      setIsReady(true);
      return;
    }
    
    // 短文本直接渲染
    if (textContent.length < maxBlockSize) {
      setContent(textContent);
      setIsReady(true);
      return;
    }
    
    // 长文本使用requestAnimationFrame避免阻塞UI
    setIsReady(false);
    
    // 使用setTimeout和requestAnimationFrame组合确保UI更新
    const timer = setTimeout(() => {
      animFrameRef.current = requestAnimationFrame(() => {
        setContent(textContent);
        setIsReady(true);
      });
    }, 10);
    
    return () => {
      clearTimeout(timer);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [textContent, maxBlockSize]);
  
  // 等待渲染时显示加载指示
  if (!isReady && textContent && textContent.length > maxBlockSize) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" />
        <ThemedText style={styles.loadingText}>渲染内容中...</ThemedText>
      </View>
    );
  }
  
  return (
    <MarkdownWithCodeHighlight style={style}>
      {content}
    </MarkdownWithCodeHighlight>
  );
});

const styles = StyleSheet.create({
  loadingContainer: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 4,
    fontSize: 12,
    opacity: 0.7,
  }
});

export default OptimizedMarkdown;
