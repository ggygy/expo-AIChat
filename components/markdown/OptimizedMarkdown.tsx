import React, { memo, useState, useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import MarkdownWithCodeHighlight from './MarkdownWithCodeHighlight';
import { ThemedText } from '../ThemedText';

interface OptimizedMarkdownProps {
  children: string;
  style?: any;
  maxBlockSize?: number;
  isStreaming?: boolean; // 新增：是否正在流式传输
}

/**
 * 性能优化的Markdown组件，将长文本分块渲染，避免阻塞UI
 * 支持流式渲染模式，适用于大型文本和流式API返回
 */
const OptimizedMarkdown = memo(({ 
  children, 
  style,
  maxBlockSize = 5000,
  isStreaming = false, // 默认非流式模式
}: OptimizedMarkdownProps) => {
  const [isReady, setIsReady] = useState(false);
  const [content, setContent] = useState<string>('');
  const animFrameRef = useRef<number | null>(null);
  const prevContentRef = useRef<string>('');
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const updateCountRef = useRef<number>(0);
  
  // 确保 children 是字符串类型
  const textContent = typeof children === 'string' ? children : '';
  
  // 计算本次内容更新与上次的差异量，用于优化流式渲染决策
  const contentDiffSize = useMemo(() => {
    if (!prevContentRef.current) return textContent.length;
    return Math.abs(textContent.length - prevContentRef.current.length);
  }, [textContent]);
  
  // 对长文本进行分块处理，支持流式和非流式两种模式
  useEffect(() => {
    // 首先清除之前的请求
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }
    
    // 没有内容时直接返回
    if (!textContent) {
      setContent('');
      setIsReady(true);
      prevContentRef.current = '';
      return;
    }
    
    // 内容没变化则不更新
    if (textContent === prevContentRef.current) {
      return;
    }
    
    // 流式模式下的渲染策略
    if (isStreaming) {
      // 节流逻辑：对于流式更新，使用延迟和内容差异来决定渲染时机
      const delayTime = calculateDelayForStreamingUpdate(
        contentDiffSize, 
        textContent.length,
        updateCountRef.current
      );
      
      renderTimeoutRef.current = setTimeout(() => {
        animFrameRef.current = requestAnimationFrame(() => {
          setContent(textContent);
          setIsReady(true);
          prevContentRef.current = textContent;
          updateCountRef.current += 1;
        });
      }, delayTime);
      
      return;
    }
    
    // 非流式模式（一次性渲染）
    // 短文本直接渲染
    if (textContent.length < maxBlockSize) {
      setContent(textContent);
      setIsReady(true);
      prevContentRef.current = textContent;
      return;
    }
    
    // 长文本使用requestAnimationFrame避免阻塞UI
    setIsReady(false);
    
    // 使用setTimeout和requestAnimationFrame组合确保UI更新
    renderTimeoutRef.current = setTimeout(() => {
      animFrameRef.current = requestAnimationFrame(() => {
        setContent(textContent);
        setIsReady(true);
        prevContentRef.current = textContent;
      });
    }, 10);
    
    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [textContent, maxBlockSize, isStreaming, contentDiffSize]);
  
  // 计算流式更新的延迟时间
  const calculateDelayForStreamingUpdate = (
    diffSize: number, 
    totalSize: number,
    updateCount: number
  ): number => {
    // 基础延迟时间 - 用于避免过于频繁的更新
    const baseDelay = 50; 
    
    // 根据更新次数调整延迟（随着更新次数增加，延迟逐渐增加）
    const countFactor = Math.min(updateCount / 10, 1); // 最多增加到2倍基础延迟
    
    // 内容变化量因子 - 内容变化越大，延迟越短
    const diffFactor = diffSize > 500 ? 0 : (500 - diffSize) / 500;
    
    // 内容大小因子 - 内容越大，延迟越长
    const sizeFactor = Math.min(totalSize / 50000, 1);
    
    // 计算最终延迟时间
    return baseDelay + 
           baseDelay * countFactor * 1.0 + // 随更新次数增加延迟
           baseDelay * diffFactor * 1.5 +  // 变化小时增加延迟 
           baseDelay * sizeFactor * 2.0;   // 内容大时增加延迟
  };
  
  // 等待渲染时显示加载指示
  if (!isReady && textContent && (
    (textContent.length > maxBlockSize && !isStreaming) || 
    (isStreaming && contentDiffSize > 0 && !content)
  )) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" />
        <ThemedText style={styles.loadingText}>
          {isStreaming ? "接收内容中..." : "渲染内容中..."}
        </ThemedText>
      </View>
    );
  }
  
  // 渲染实际内容
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
