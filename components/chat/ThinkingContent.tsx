import React, { useState, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';
import OptimizedMarkdown from '@/components/markdown/OptimizedMarkdown';
import { useThemeColor } from '@/hooks/useThemeColor';

interface ThinkingContentProps {
  thinkingContent: string;
  thinkingMarkdownStyles: any;
  thinkingBgColor: string;
  thinkingTextColor: string;
  initialIsExpanded?: boolean;
}

const ThinkingContent: React.FC<ThinkingContentProps> = ({
  thinkingContent,
  thinkingMarkdownStyles,
  thinkingBgColor,
  thinkingTextColor,
  initialIsExpanded = true, // 默认展开
}) => {
  const [isExpanded, setIsExpanded] = useState(initialIsExpanded);
  const iconColor = useThemeColor({}, 'text');
  
  // 格式化思考内容，确保它被正确渲染
  const formattedThinkingContent = useMemo(() => {
    if (!thinkingContent) return '';
    
    // 打印日志以便调试
    console.log('思考内容长度:', thinkingContent.length);
    console.log('思考内容前20个字符:', thinkingContent.substring(0, 20));
    
    // 确保内容以思考：或Thinking:开头
    let content = thinkingContent;
    
    // 检查是否正确格式化
    const needsFormatting = !content.startsWith('思考：') && 
                          !content.startsWith('思考:') && 
                          !content.startsWith('Thinking:') &&
                          !content.startsWith('# 思考过程') &&
                          !content.toLowerCase().includes('reasoning:');
    
    if (needsFormatting) {
      content = `思考过程：\n\n${content}`;
    }
    
    return content;
  }, [thinkingContent]);
  
  // 如果没有思考内容，不渲染任何东西
  if (!thinkingContent || thinkingContent.trim() === '') {
    return null;
  }

  return (
    <View style={[styles.thinkingContainer, { backgroundColor: thinkingBgColor }]}>
      {/* 思考标头 - 可点击切换展开/折叠状态 */}
      <TouchableOpacity 
        style={styles.thinkingHeader}
        onPress={() => setIsExpanded(!isExpanded)}
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
      </TouchableOpacity>
      
      {/* 思考内容 - 仅在展开时显示 */}
      {isExpanded && (
        <View style={styles.thinkingContent}>
          {/* 修正：使用children代替content */}
          <OptimizedMarkdown
            style={thinkingMarkdownStyles}
            isStreaming={false} // 思考内容不是流式的
            maxBlockSize={2000} // 可选：设置更合适的块大小
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

export default React.memo(ThinkingContent);
