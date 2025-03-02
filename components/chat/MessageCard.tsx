import React, { FC, memo } from 'react';
import { StyleSheet, View, TouchableOpacity, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { ThemedText } from '../ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Message } from '@/constants/chat';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { showSuccess, showError } from '@/utils/toast';
import { getMarkdownStyles } from '@/constants/MarkdownStyles';
import MessageActions from './MessageActions';
import i18n from '@/i18n/i18n';
import ThinkingContent from './ThinkingContent';
import NormalContent from './NormalContent';
import MessageStatusIndicator from './MessageStatusIndicator';

interface MessageCardProps {
    message: Message;
    onRetry?: () => void;
    onLongPress?: () => void;
    onPress?: () => void;
    isSelected?: boolean;
    selectable?: boolean;
}

const MessageCard: FC<MessageCardProps> = ({
    message,
    onRetry,
    onLongPress,
    onPress,
    isSelected,
    selectable
}) => {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'].chat;
    const textColor = useThemeColor({}, 'text');
    const tintColor = useThemeColor({}, 'tint');
    const isUser = message.role === 'user';
    const isError = message.status === 'error';
    
    // 获取 Markdown 样式
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

    const handleCopyText = async () => {
        try {
            // 如果有思考内容，复制两部分内容
            const textToCopy = message.thinkingContent 
              ? `${i18n.t('chat.thinking')}:\n${message.thinkingContent}\n\n${i18n.t('chat.answer')}:\n${message.content}`
              : message.content;
              
            await Clipboard.setStringAsync(textToCopy);
            showSuccess('common.copySuccess');
        } catch (error) {
            console.error('复制失败:', error);
            showError('common.copyError');
        }
    };

    // 确保只在选择模式下才显示选择状态
    const showSelected = selectable && isSelected;

    return (
        <View style={styles.messageCardWrapper}>
            <TouchableOpacity
                style={[
                    styles.container,
                    isUser ? styles.userContainer : styles.botContainer,
                    showSelected && [styles.selectedContainer, { backgroundColor: colors.selectedBubbleBg }]
                ]}
                activeOpacity={1}
                onLongPress={onLongPress}
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
                    { shadowColor: colors.bubbleShadowColor }
                ]}>
                    <View style={styles.contentContainer}>
                        {/* 消息内容区 - 直接在JSX中渲染，不使用renderContent函数 */}
                        {message.content || message.thinkingContent ? (
                            isUser ? (
                                /* 用户消息总是使用普通文本 */
                                <ThemedText style={styles.messageText}>{message.content}</ThemedText>
                            ) : (
                                /* AI助手消息 */
                                <View style={styles.contentContainer}>
                                    {/* 思考内容（如果存在） */}
                                    {message.thinkingContent && (
                                        <ThinkingContent
                                            thinkingContent={message.thinkingContent}
                                            thinkingMarkdownStyles={thinkingMarkdownStyles}
                                            thinkingBgColor={colors.thinkingBg}
                                            thinkingTextColor={colors.thinkingText || '#666'}
                                            initialIsExpanded={message.isThinkingExpanded}
                                        />
                                    )}
                                    
                                    {/* 正常回答内容的分隔线 */}
                                    {message.content && message.thinkingContent && (
                                        <View style={styles.contentDivider} />
                                    )}
                                    
                                    {/* 正常回答内容 */}
                                    {message.content && (
                                        <NormalContent
                                            content={message.content}
                                            contentType={message.contentType || 'markdown'}
                                            markdownStyles={markdownStyles}
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
                    
                    {/* 操作按钮组件 - 仅针对助手 */}
                    {!isUser && (
                        <MessageActions
                            isError={isError}
                            onRetry={onRetry}
                            onCopy={handleCopyText}
                            actionButtonColor={colors.actionButtonText}
                            retryButtonColor={colors.retryButton} 
                            dividerColor={colors.divider}
                            showBottomRetryButton={isError && !!onRetry}
                        />
                    )}
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
        </View>
    );
}

const styles = StyleSheet.create({
    messageCardWrapper: {
        marginVertical: 4,
    },
    container: {
        padding: 8,
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
});

export default memo(MessageCard);
