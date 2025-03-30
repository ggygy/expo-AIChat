import React, { FC, memo, useEffect, useRef, useState, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, Platform, type ViewStyle } from 'react-native';
import { ThemedText } from '../ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Message } from '@/constants/chat';
import { IconSymbol } from '../ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getMarkdownStyles } from '@/constants/MarkdownStyles';
import { useMessageActions } from '@/hooks/useMessageActions';
import ThinkingContent from './ThinkingContent';
import NormalContent from './NormalContent';
import MessageStatusIndicator from './MessageStatusIndicator';
import ActionMenu from './ActionMenu';
import TextSelectionOverlay from './TextSelectionOverlay';
import MetadataSection from './MetadataSection';

interface MessageCardProps {
    message: Message;
    onRetry?: () => void;
    onLongPress?: () => void;
    onPress?: () => void;
    isSelected?: boolean;
    selectable?: boolean;
    onEnterSelectMode?: () => void;
    onDeleteMessage?: (messageId: string) => void;
    isStreaming?: boolean;
    cardStyle?: ViewStyle;
}

// 使用memo并增加比较函数来优化渲染
const MessageCard: FC<MessageCardProps> = ({
    message,
    onRetry,
    onPress,
    isSelected,
    selectable,
    onEnterSelectMode,
    onDeleteMessage,
    isStreaming,
    cardStyle
}) => {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'].chat;
    const textColor = useThemeColor({}, 'text');
    const tintColor = useThemeColor({}, 'tint');
    const isUser = message.role === 'user';
    const isNormalContent = message.contentType === 'markdown' || message.contentType === 'text';
    
    const [thinkingExpanded, setThinkingExpanded] = useState(
      isStreaming ? true : message.isThinkingExpanded ?? false
    );
    
    useEffect(() => {
      if (isStreaming) {
        setThinkingExpanded(true);
      }
    }, [isStreaming]);
    
    const handleThinkingToggle = useCallback((expanded: boolean) => {
      setThinkingExpanded(expanded);
    }, []);
    
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
    
    const thinkingMarkdownStyles = {
      ...markdownStyles,
      body: {
        ...markdownStyles.body,
        color: colors.thinkingText || '#666',
        paddingHorizontal: 5,
      }
    };

    const showSelected = selectable && isSelected;
    
    useEffect(() => {
      return cleanup;
    }, []);

    const showContent = Boolean(message && (message.content || message.thinkingContent));
    const hasThinkingContent = Boolean(message && message.thinkingContent && message.thinkingContent.trim() !== '');
    const hasContent = Boolean(message && message.content);

    return (
        <>
            <TouchableOpacity
                style={[
                    styles.container,
                    isUser ? styles.userContainer : styles.botContainer,
                    showSelected && [styles.selectedContainer, { backgroundColor: colors.selectedBubbleBg }],
                    isStreaming && styles.streamingContainer,
                    cardStyle
                ]}
                activeOpacity={1}
                onLongPress={handleLongPress}
                onPress={onPress}
                delayLongPress={500}
            >
                {!isUser && selectable && (
                    <View style={[styles.checkbox, styles.centerVertically]}>
                        {showSelected ? (
                            <IconSymbol name="check-circle" type='fontAwesome' size={20} color={tintColor} />
                        ) : (
                            <View style={[styles.emptyCheckbox, { borderColor: tintColor }]} />
                        )}
                    </View>
                )}

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
                        {showContent ? (
                            isUser ? (
                                <ThemedText style={styles.messageText} selectable={true}>
                                    {message.content || ''}
                                </ThemedText>
                            ) : (
                                <View style={styles.contentContainer}>
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
                                    
                                    {hasContent && hasThinkingContent && (
                                        <View style={styles.contentDivider} />
                                    )}
                                    
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

                        {!isUser && !isStreaming && (
                            <MetadataSection 
                                message={message} 
                                textColor={textColor} 
                                tintColor={tintColor}
                                colors={colors}
                            />
                        )}
                        
                        <MessageStatusIndicator
                            status={message.status || 'idle'}
                            errorMessage={message.error}
                            tintColor={tintColor}
                            errorColor={colors.error}
                        />
                    </View>
                </View>

                {isUser && selectable && (
                    <View style={[styles.checkbox, styles.centerVertically]}>
                        {showSelected ? (
                            <IconSymbol type='fontAwesome' name="check-circle" size={20} color={tintColor} />
                        ) : (
                            <View style={[styles.emptyCheckbox, { borderColor: tintColor }]} />
                        )}
                    </View>
                )}
            </TouchableOpacity>

            <ActionMenu
                visible={menuVisible}
                onClose={closeMenu}
                actions={getMenuActions()}
                position={menuPosition}
                backgroundColor={colors.botBubble}
                textColor={textColor}
                maxItemsPerRow={5}
            />
            
            <TextSelectionOverlay
                visible={textSelectionOverlayVisible}
                content={message.content}
                thinkingContent={message.thinkingContent}
                onClose={handleCloseTextSelectionOverlay}
            />
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        flexDirection: 'row',
        marginTop: -20,
        marginBottom: -20,
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
    streamingContainer: {
        opacity: 1,
    },
    streamingBubble: {
        borderColor: '#4e9bff',
        borderWidth: 1,
    },
});

// 优化 memo 比较逻辑，添加安全检查以及元数据比较
export default memo(MessageCard, (prevProps, nextProps) => {
  const isStreaming = nextProps.isStreaming;
  
  if (!prevProps.message || !nextProps.message) {
    return false;
  }
  
  const isSameContent = prevProps.message.content === nextProps.message.content;
  const isSameThinking = prevProps.message.thinkingContent === nextProps.message.thinkingContent;
  
  const contentThreshold = isStreaming ? 25 : 100;
  
  const contentSimilar = !isSameContent && 
    (prevProps.message.content?.length ?? 0) > 0 && 
    (nextProps.message.content?.length ?? 0) > 0 && 
    Math.abs((prevProps.message.content?.length ?? 0) - (nextProps.message.content?.length ?? 0)) < contentThreshold;
  
  const thinkingSimilar = !isSameThinking && 
    Math.abs((prevProps.message.thinkingContent?.length ?? 0) - 
    (nextProps.message.thinkingContent?.length ?? 0)) < contentThreshold;
  
  const isSameStatus = prevProps.message.status === nextProps.message.status;
  const isSameSelection = prevProps.isSelected === nextProps.isSelected && prevProps.selectable === nextProps.selectable;
  const isSameStreaming = prevProps.isStreaming === nextProps.isStreaming;
  
  if (isStreaming) {
    return (isSameContent || contentSimilar) && 
           (isSameThinking || thinkingSimilar) && 
           isSameStatus && 
           isSameSelection;
  }
  
  return (isSameContent || contentSimilar) && 
         (isSameThinking || thinkingSimilar) && 
         isSameStatus && 
         isSameSelection && 
         isSameStreaming
});
