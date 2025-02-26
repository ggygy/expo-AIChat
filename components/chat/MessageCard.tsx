import React, { memo } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { ThemedText } from '../ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Message } from '@/constants/chat';
import Markdown from 'react-native-markdown-display';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface MessageCardProps {
    message: Message;
    onRetry?: () => void;
    onLongPress?: () => void;
    onPress?: () => void;
    isSelected?: boolean;
    selectable?: boolean;
}

const MessageCard: React.FC<MessageCardProps> = memo(({
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

    const renderContent = () => {
        if (!message.content) return
        if (message.contentType === 'markdown') {
            return (
                <Markdown
                    style={{
                        body: { color: textColor },
                        code_block: { backgroundColor: colors.markdownCode },
                        code_inline: { backgroundColor: colors.markdownCode },
                        fence: { backgroundColor: colors.markdownCode },
                    }}
                >
                    {message.content}
                </Markdown>
            );
        }
        return <ThemedText>{message.content}</ThemedText>;
    };

    const handleCopyText = async () => {
        await Clipboard.setStringAsync(message.content);
    };

    // 确保只在选择模式下才显示选择状态
    const showSelected = selectable && isSelected;

    return (
        <TouchableOpacity
            style={[
                styles.container,
                isUser ? styles.userContainer : styles.botContainer,
                showSelected && styles.selectedContainer  // 只在选择模式下显示选中效果
            ]}
            activeOpacity={0.8}
            onLongPress={onLongPress}
            onPress={onPress}
            delayLongPress={500}
        >
            {!isUser && selectable && (
                <View style={[styles.checkbox, styles.centerVertically]}>
                    {showSelected ? (
                        <FontAwesome name="check-circle" size={20} color={tintColor} />
                    ) : (
                        <View style={[styles.emptyCheckbox, { borderColor: tintColor }]} />
                    )}
                </View>
            )}

            <View style={[
                styles.bubble,
                isUser ? [styles.userBubble, { backgroundColor: colors.userBubble, borderColor: colors.userBubbleBorder }]
                    : [styles.botBubble, { backgroundColor: colors.botBubble, borderColor: colors.botBubbleBorder }]
            ]}>
                <View style={styles.contentContainer}>
                    {renderContent()}
                    {message.status === 'error' && (
                        <View style={styles.errorContainer}>
                            <FontAwesome name="exclamation-circle" size={14} color={colors.error} style={styles.errorIcon} />
                            <ThemedText style={[styles.errorText, { color: colors.error }]}>
                                {message.error}
                            </ThemedText>
                        </View>
                    )}
                </View>
                
                {!isUser && <View style={styles.actionContainer}>
                    <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={handleCopyText}
                    >
                        <FontAwesome name="copy" size={16} color={textColor} />
                    </TouchableOpacity>
                    
                    {message.status === 'error' && onRetry && (
                        <TouchableOpacity 
                            style={[styles.actionButton, styles.retryButton]}
                            onPress={onRetry}
                        >
                            <FontAwesome name="refresh" size={16} color={colors.retryButton} />
                            <ThemedText style={styles.actionButtonText}>重试</ThemedText>
                        </TouchableOpacity>
                    )}
                </View>}
            </View>

            {isUser && selectable && (
                <View style={[styles.checkbox, styles.centerVertically]}>
                    {showSelected && (
                        <FontAwesome name="check-circle" size={20} color={tintColor} />
                    )}
                    {!showSelected && (
                        <View style={[styles.emptyCheckbox, { borderColor: tintColor }]} />
                    )}
                </View>
            )}
        </TouchableOpacity>
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.message.id === nextProps.message.id &&
        prevProps.isSelected === nextProps.isSelected &&
        prevProps.selectable === nextProps.selectable &&
        prevProps.message.status === nextProps.message.status
    );
});

const styles = StyleSheet.create({
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
        padding: 8,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 0, 0, 0.05)',
        borderRadius: 8,
    },
    errorIcon: {
        marginRight: 6,
    },
    errorText: {
        fontSize: 13,
        flex: 1,
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
    actionContainer: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(0,0,0,0.1)',
        paddingTop: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 6,
        borderRadius: 4,
        marginLeft: 8,
    },
    retryButton: {
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    actionButtonText: {
        fontSize: 12,
        marginLeft: 4,
    },
    retryIcon: {
        marginLeft: 8,
    },
});

export default MessageCard;
