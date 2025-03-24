import React, { memo, useCallback } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';
import OptimizedMarkdown from '@/components/markdown/OptimizedMarkdown';
import { useThemeColor } from '@/hooks/useThemeColor';

interface ThinkingContentProps {
  thinkingContent: string;
  thinkingMarkdownStyles: any;
  thinkingBgColor: string;
  thinkingTextColor: string;
  isExpanded: boolean;
  onToggle: (isExpanded: boolean) => void;
}

const ThinkingContent: React.FC<ThinkingContentProps> = ({
  thinkingContent,
  thinkingMarkdownStyles,
  thinkingBgColor,
  thinkingTextColor,
  isExpanded,
  onToggle,
}) => {
  const iconColor = useThemeColor({}, 'text');
  
  // 确保thinkingContent永远不为undefined
  const formattedThinkingContent = thinkingContent || '';
  
  // 处理点击事件
  const handleToggle = useCallback(() => {
    onToggle(!isExpanded);
  }, [isExpanded, onToggle]);
  
  // 如果没有思考内容，不渲染任何东西
  if (!thinkingContent || thinkingContent.trim() === '') {
    return null;
  }

  return (
    <View style={[styles.thinkingContainer, { backgroundColor: thinkingBgColor }]}>
      {/* 思考标头 - 可点击切换展开/折叠状态 */}
      <Pressable 
        style={styles.thinkingHeader}
        onPress={handleToggle}
        android_ripple={{ color: 'rgba(255, 255, 255, 0.2)' }}
      >
        <ThemedText 
          style={[styles.thinkingLabel, { color: thinkingTextColor }]}
        >
          思考过程
        </ThemedText>
        <FontAwesome 
          name={isExpanded ? 'angle-up' : 'angle-down'} 
          size={16} 
          color={iconColor} 
        />
      </Pressable>
      
      {/* 思考内容 - 仅在展开时显示 */}
      {isExpanded && (
        <View style={styles.thinkingContent}>
          <OptimizedMarkdown
            style={thinkingMarkdownStyles}
            isStreaming={false}
            maxBlockSize={2000}
          >
            {formattedThinkingContent}
          </OptimizedMarkdown>
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
    marginTop: 8,
  },
});

// 使用memo包装组件以优化性能
export default memo(ThinkingContent, (prevProps, nextProps) => {
  return (
    prevProps.thinkingContent === nextProps.thinkingContent &&
    prevProps.isExpanded === nextProps.isExpanded &&
    prevProps.thinkingBgColor === nextProps.thinkingBgColor
  );
});
