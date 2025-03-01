import React, { FC, memo } from 'react';
import { StyleSheet, View, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { ThemedText } from '../ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Message } from '@/constants/chat';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { showSuccess, showError } from '@/utils/toast';
import { getMarkdownStyles } from '@/constants/MarkdownStyles';
import MarkdownWithCodeHighlight from '../markdown/MarkdownWithCodeHighlight';
import MessageActions from './MessageActions';
import i18n from '@/i18n/i18n';


interface MessageCardProps {
    message: Message;
    onRetry?: () => void;
    onLongPress?: () => void;
    onPress?: () => void;
    isSelected?: boolean;
    selectable?: boolean;
}

const MessageCard: FC<MessageCardProps> = memo(({
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

    const renderContent = () => {
        if (!message.content) return null;
        
        // 用户消息总是使用普通文本
        if (isUser) {
            return <ThemedText style={styles.messageText}>{message.content}</ThemedText>;
        }
        
        // 助手消息根据contentType决定渲染方式
        if (message.contentType === 'markdown') {
            // 使用我们新创建的包装组件
            return (
                <MarkdownWithCodeHighlight style={markdownStyles}>
                    {message.content}
                </MarkdownWithCodeHighlight>
            );
        }
        
        // 默认使用普通文本
        return <ThemedText style={styles.messageText}>{message.content}</ThemedText>;
    };

    const handleCopyText = async () => {
        try {
            await Clipboard.setStringAsync(message.content);
            showSuccess('common.copySuccess');
        } catch (error) {
            console.error('复制失败:', error);
            showError('common.copyError');
        }
    };

    // 确保只在选择模式下才显示选择状态
    const showSelected = selectable && isSelected;

    // 根据消息状态渲染不同的指示器
    const renderStatusIndicator = () => {
        if (!isUser && message.status === 'streaming') {
            return <ActivityIndicator size="small" color={tintColor} style={styles.statusIndicator} />;
        }
        return null;
    };

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
                        : [styles.botBubble, { backgroundColor: colors.botBubble, borderColor: colors.botBubbleBorder }],
                    { shadowColor: colors.bubbleShadowColor }
                ]}>
                    <View style={styles.contentContainer}>
                        {renderContent()}
                        {renderStatusIndicator()}
                        {isError && (
                            <View style={styles.errorContainer}>
                                <FontAwesome name="exclamation-circle" size={14} color={colors.error} style={styles.errorIcon} />
                                <ThemedText style={[styles.errorText, { color: colors.error }]}>
                                    {message.error || i18n.t('chat.generateError')}
                                </ThemedText>
                            </View>
                        )}
                    </View>
                    
                    {/* 操作按钮组件 - 仅针对助手消息 */}
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
}, (prevProps, nextProps) => {
    return (
        prevProps.message.id === nextProps.message.id &&
        prevProps.isSelected === nextProps.isSelected &&
        prevProps.selectable === nextProps.selectable &&
        prevProps.message.status === nextProps.message.status &&
        prevProps.message.content === nextProps.message.content &&
        prevProps.message.contentType === nextProps.message.contentType
    );
});

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
        minWidth: '30%', // 最小宽度
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
});

export default MessageCard;