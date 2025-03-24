import React, { FC, memo, useEffect, useRef, useState, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, Platform } from 'react-native';
import { ThemedText } from '../ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Message } from '@/constants/chat';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getMarkdownStyles } from '@/constants/MarkdownStyles';
import { useMessageActions } from '@/hooks/useMessageActions';
import ThinkingContent from './ThinkingContent';
import NormalContent from './NormalContent';
import MessageStatusIndicator from './MessageStatusIndicator';
import ActionMenu from './ActionMenu';
import TextSelectionOverlay from './TextSelectionOverlay';

interface MessageCardProps {
    message: Message;
    onRetry?: () => void;
    onLongPress?: () => void;
    onPress?: () => void;
    isSelected?: boolean;
    selectable?: boolean;
    onEnterSelectMode?: () => void;
    onDeleteMessage?: (messageId: string) => void;
    // 添加流式消息标记
    isStreaming?: boolean;
}

// 使用memo并增加比较函数来优化渲染
const MessageCard: FC<MessageCardProps> = ({
    message,
    onRetry,
    onLongPress,
    onPress,
    isSelected,
    selectable,
    onEnterSelectMode,
    onDeleteMessage,
    isStreaming
}) => {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'].chat;
    const textColor = useThemeColor({}, 'text');
    const tintColor = useThemeColor({}, 'tint');
    const isUser = message.role === 'user';
    const isNormalContent = message.contentType === 'markdown' || message.contentType === 'text';
    
    // 添加展开/折叠状态管理
    const [thinkingExpanded, setThinkingExpanded] = useState(
      isStreaming ? true : message.isThinkingExpanded ?? false
    );
    
    // 当流式传输停止时保持展开状态
    useEffect(() => {
      if (isStreaming) {
        setThinkingExpanded(true);
      }
    }, [isStreaming]);
    
    // 处理思考内容展开/折叠状态变化
    const handleThinkingToggle = useCallback((expanded: boolean) => {
      setThinkingExpanded(expanded);
    }, []);
    
    // 使用自定义Hook处理消息操作
    const { 
      menuVisible, 
      menuPosition, 
      handleLongPress, 
      closeMenu, 
      getMenuActions,
      cleanup,
      isReading,
      textSelectionOverlayVisible,
      handleCloseTextSelectionOverlay,
    } = useMessageActions({
      message,
      onRetry,
      onEnterSelectMode,
      onDeleteMessage: onDeleteMessage ? () => onDeleteMessage(message.id) : undefined,
      colors,
      retryColor: colors.retryButton,
      deleteColor: colors.error || '#ff3b30',
      iconColor: textColor
    });
    
    // Markdown 样式配置
    const markdownStyles = getMarkdownStyles({
        colorScheme: colorScheme || 'light',
        textColor,
        tintColor,
        codeBackgroundColor: colors.markdownCode,
        tableBorderColor: colors.tableBorder,
        tableHeaderBackgroundColor: colors.tableHeaderBg,
        blockquoteBackgroundColor: colors.blockquoteBg,
        fontSizeMultiplier: 1,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    });
    
    // 思考内容的专用样式
    const thinkingMarkdownStyles = {
      ...markdownStyles,
      body: {
        ...markdownStyles.body,
        color: colors.thinkingText || '#666',
        paddingHorizontal: 5,
      }
    };

    // 确保只在选择模式下才显示选择状态
    const showSelected = selectable && isSelected;
    
    // 组件卸载时清理资源
    useEffect(() => {
      return cleanup;
    }, []);


    const showContent = Boolean(message && (message.content || message.thinkingContent));
    const hasThinkingContent = Boolean(message && message.thinkingContent && message.thinkingContent.trim() !== '');
    const hasContent = Boolean(message && message.content);

    return (
        <View style={styles.messageCardWrapper}>
            <TouchableOpacity
                style={[
                    styles.container,
                    isUser ? styles.userContainer : styles.botContainer,
                    showSelected && [styles.selectedContainer, { backgroundColor: colors.selectedBubbleBg }],
                    // 添加流式消息的视觉反馈
                    isStreaming && styles.streamingContainer
                ]}
                activeOpacity={1}
                onLongPress={handleLongPress}
                onPress={onPress}
                delayLongPress={500}
            >
                {/* 选择框 */}
                {!isUser && selectable && (
                    <View style={[styles.checkbox, styles.centerVertically]}>
                        {showSelected ? (
                            <FontAwesome name="check-circle" size={20} color={tintColor} />
                        ) : (
                            <View style={[styles.emptyCheckbox, { borderColor: tintColor }]} />
                        )}
                    </View>
                )}

                {/* 消息气泡 */}
                <View style={[
                    styles.bubble,
                    isUser ? [styles.userBubble, { backgroundColor: colors.userBubble, borderColor: colors.userBubbleBorder }]
                        : [styles.botBubble, 
                           { 
                             backgroundColor: colors.botBubble, 
                             borderColor: colors.botBubbleBorder 
                           }],
                    { shadowColor: colors.bubbleShadowColor },
                    isStreaming && styles.streamingBubble,
                    isReading && styles.readingBubble
                ]}>
                    <View style={styles.contentContainer}>
                        {/* 消息内容区 - 直接使用message内容，不缓存 */}
                        {showContent ? (
                            isUser ? (
                                /* 用户消息总是使用普通文本，添加可选择特性 */
                                <ThemedText style={styles.messageText} selectable={true}>
                                    {message.content || ''}
                                </ThemedText>
                            ) : (
                                /* AI助手消息 */
                                <View style={styles.contentContainer}>
                                    {/* 思考内容检查 - 确保思考内容不为空且非undefined */}
                                    {hasThinkingContent && (
                                        <ThinkingContent
                                            thinkingContent={message.thinkingContent || ''}
                                            thinkingMarkdownStyles={thinkingMarkdownStyles}
                                            thinkingBgColor={colors.thinkingBg || '#f5f5f5'}
                                            thinkingTextColor={colors.thinkingText || '#666'}
                                            isExpanded={thinkingExpanded}
                                            onToggle={handleThinkingToggle}
                                        />
                                    )}
                                    
                                    {/* 正常回答内容的分隔线 - 仅当两种内容都存在时显示 */}
                                    {hasContent && hasThinkingContent && (
                                        <View style={styles.contentDivider} />
                                    )}
                                    
                                    {/* 正常回答内容 */}
                                    {hasContent && isNormalContent && (
                                        <NormalContent
                                            content={message.content || ''}
                                            contentType={message.contentType || 'markdown' as any}
                                            markdownStyles={markdownStyles}
                                            isStreaming={isStreaming}
                                        />
                                    )}
                                </View>
                            )
                        ) : null}

                        {/* 消息状态指示器 */}
                        <MessageStatusIndicator
                            status={message.status || 'idle'}
                            errorMessage={message.error}
                            tintColor={tintColor}
                            errorColor={colors.error}
                        />
                    </View>
                </View>

                {/* 用户消息选择框 */}
                {isUser && selectable && (
                    <View style={[styles.checkbox, styles.centerVertically]}>
                        {showSelected ? (
                            <FontAwesome name="check-circle" size={20} color={tintColor} />
                        ) : (
                            <View style={[styles.emptyCheckbox, { borderColor: tintColor }]} />
                        )}
                    </View>
                )}
            </TouchableOpacity>

            {/* 气泡操作菜单 */}
            <ActionMenu
                visible={menuVisible}
                onClose={closeMenu}
                actions={getMenuActions()}
                position={menuPosition}
                backgroundColor={colors.botBubble}
                textColor={textColor}
                maxItemsPerRow={5}
            />
            
            {/* 文本选择浮层 */}
            <TextSelectionOverlay
                visible={textSelectionOverlayVisible}
                content={message.content}
                thinkingContent={message.thinkingContent}
                onClose={handleCloseTextSelectionOverlay}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    messageCardWrapper: {
        marginVertical: 0,
    },
    container: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        flexDirection: 'row',
    },
    userContainer: {
        justifyContent: 'flex-end',
    },
    botContainer: {
        justifyContent: 'flex-start',
    },
    bubble: {
        padding: 12,
        borderRadius: 16,
        borderWidth: StyleSheet.hairlineWidth,
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 1,
    },
    userBubble: {
        borderBottomRightRadius: 4,
        maxWidth: '85%',
    },
    botBubble: {
        borderBottomLeftRadius: 4,
        minWidth: '60%',
        maxWidth: '100%',
        flex: 1,
    },
    errorContainer: {
        padding: 10,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 0, 0, 0.05)',
        borderRadius: 8,
        marginTop: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 0, 0, 0.1)',
    },
    errorIcon: {
        marginRight: 8,
    },
    errorText: {
        fontSize: 13,
        flex: 1,
        lineHeight: 18,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
    },
    selectedContainer: {
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    checkbox: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 8,
        opacity: 1,
    },
    emptyCheckbox: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
    },
    centerVertically: {
        alignSelf: 'center',
    },
    contentContainer: {
        flex: 1,
        width: '100%',
    },
    statusIndicator: {
        marginTop: 8,
        alignSelf: 'flex-start',
    },
    thinkingContainer: {
        backgroundColor: 'rgba(0, 0, 0, 0.03)',
        borderRadius: 8,
        padding: 10,
        marginVertical: 4,
    },
    thinkingLabel: {
        fontWeight: 'bold',
        marginBottom: 6,
        fontSize: 14,
        color: '#666',
    },
    thinkingSection: {
        marginBottom: 8,
    },
    thinkingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    thinkingContent: {
        marginTop: 4,
    },
    contentDivider: {
        height: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        marginVertical: 8,
    },
    normalContent: {
        marginTop: 8,
    },
    readingBubble: {
        borderColor: '#4e9bff',
        borderWidth: 1,
    },
    // 流式消息容器样式
    streamingContainer: {
        opacity: 1,
    },
    
    // 流式消息气泡样式
    streamingBubble: {
        borderColor: '#4e9bff',
        borderWidth: 1,
    },
});

// 优化 memo 比较逻辑，添加安全检查
export default memo(MessageCard, (prevProps, nextProps) => {
  // 流式消息需要更频繁更新，而非流式消息可以少更新
  const isStreaming = nextProps.isStreaming;
  
  // 安全检查
  if (!prevProps.message || !nextProps.message) {
    return false; // 如果任一 message 为 undefined，则强制重新渲染
  }
  
  // 判断内容变化
  const isSameContent = prevProps.message.content === nextProps.message.content;
  const isSameThinking = prevProps.message.thinkingContent === nextProps.message.thinkingContent;
  
  // 对于流式消息，使用更低的阈值，确保更频繁更新
  const contentThreshold = isStreaming ? 25 : 100;
  
  const contentSimilar = !isSameContent && 
    (prevProps.message.content?.length ?? 0) > 0 && 
    (nextProps.message.content?.length ?? 0) > 0 && 
    Math.abs((prevProps.message.content?.length ?? 0) - (nextProps.message.content?.length ?? 0)) < contentThreshold;
  
  const thinkingSimilar = !isSameThinking && 
    Math.abs((prevProps.message.thinkingContent?.length ?? 0) - 
    (nextProps.message.thinkingContent?.length ?? 0)) < contentThreshold;
  
  // 其他状态比较
  const isSameStatus = prevProps.message.status === nextProps.message.status;
  const isSameSelection = prevProps.isSelected === nextProps.isSelected && prevProps.selectable === nextProps.selectable;
  const isSameStreaming = prevProps.isStreaming === nextProps.isStreaming;
  
  // 流式更新消息时，需要更频繁地重新渲染
  if (isStreaming) {
    // 流式消息下，仅当内容几乎相同(差异少于25字符)且状态一致时才跳过更新
    return (isSameContent || contentSimilar) && 
           (isSameThinking || thinkingSimilar) && 
           isSameStatus && 
           isSameSelection;
  }
  
  // 非流式消息，采用更严格的优化策略
  return (isSameContent || contentSimilar) && 
         (isSameThinking || thinkingSimilar) && 
         isSameStatus && 
         isSameSelection && 
         isSameStreaming;
});
