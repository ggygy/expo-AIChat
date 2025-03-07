import React, { useLayoutEffect, useRef, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, TouchableWithoutFeedback, Keyboard, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { FontAwesome } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useBotStore } from '@/store/useBotStore';
import ChatInput from '@/components/chat/ChatInput';
import MessageList, { MessageListRef } from '@/components/chat/MessageList';
import i18n from '@/i18n/i18n';

// 导入自定义hooks
import { useChatMessages } from '@/hooks/useChatMessages';
import { useChatActions } from '@/hooks/useChatActions';
import { useChatSelection } from '@/hooks/useChatSelection';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function ChatScreen() {
    // 获取参数和基础设置
    const { id } = useLocalSearchParams<{ id: string }>();
    const backgroundColor = useThemeColor({}, 'cardBackground');
    const iconColor = useThemeColor({}, 'text');
    const errorColor = useThemeColor({}, 'error');
    const navigation = useNavigation();
    const router = useRouter();
    const messageListRef = useRef<MessageListRef>(null);
    const getBotInfo = useBotStore(state => state.getBotInfo);
    const botInfo = getBotInfo(id);

    // 使用消息管理hook
    const {
        messages,
        setMessages,
        isLoading,
        handleLoadMore,
        totalMessages,
        setTotalMessages,
        deleteMessages,
        isFirstLoadRef,
        manualRefresh,
        shouldScrollToBottom, // 获取滚动标志
        setShouldScrollToBottom // 获取设置滚动标志的方法
    } = useChatMessages(id);

    // 使用消息操作hook
    const {
        handleSendMessage,
        handleRetry,
        handleStopGeneration,
        handleVoiceInput,
        handleFileUpload,
        isGenerating
    } = useChatActions(id, messages, setMessages, totalMessages, setTotalMessages);

    // 使用消息选择hook
    const {
        isSelectMode,
        setIsSelectMode,
        selectedMessages,
        setSelectedMessages, // 使用原始的setter
        showDeleteDialog,
        setShowDeleteDialog,
        handleCancelSelect,
        handleLongPress,
        handleSelect,
        handleDeleteConfirm
    } = useChatSelection(deleteMessages);

    // 监控消息状态，不再需要基于消息长度自动滚动
    // 实际的滚动逻辑已经在 MessageList 组件内部处理
    useEffect(() => {
        // 仅第一次进入页面时记录日志
        if (isFirstLoadRef.current && messages.length > 0) {
            console.log('首次加载完成，有消息数量:', messages.length);
        }
    }, [messages.length, isFirstLoadRef]);

    // 首次加载后，滚动到底部
    useEffect(() => {
        if (isFirstLoadRef.current && messages.length > 0) {
            isFirstLoadRef.current = false;
            const timer = setTimeout(() => {
                messageListRef.current?.scrollToEnd(true);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [messages]);

    // 优化：确保首次进入聊天页面时立即滚动到最新消息
    useEffect(() => {
        // 当消息加载完成后滚动到底部
        if (messages.length > 0 && !isLoading) {
            const timer = setTimeout(() => {
                messageListRef.current?.scrollToEnd(false);
                // 双保险：强制标记为应该滚动到底部
                if (setShouldScrollToBottom) {
                    setShouldScrollToBottom(true);
                }
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [messages.length, isLoading, setShouldScrollToBottom]);

    // 当发送新消息后，确保滚动到底部
    const handleSendMessageWithScroll = useCallback((text: string) => {
        // 先设置滚动标志
        if (setShouldScrollToBottom) {
            setShouldScrollToBottom(true);
        }

        // 然后发送消息
        const result = handleSendMessage(text);

        // 延迟执行滚动，确保新消息已渲染
        setTimeout(() => {
            messageListRef.current?.scrollToEnd(true);
        }, 500);

        return result;
    }, [handleSendMessage, setShouldScrollToBottom]);

    // 设置导航栏配置
    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitleAlign: 'center',
            title: isSelectMode
                ? `${selectedMessages.size} ${i18n.t('chat.selectedCount')}`
                : botInfo?.name || 'Chat',
            headerRight: () => (
                isSelectMode ? (
                    <TouchableOpacity
                        onPress={() => setShowDeleteDialog(true)}
                        style={styles.headerButton}
                    >
                        <FontAwesome name="trash" size={20} color={errorColor} />
                    </TouchableOpacity>
                ) : (
                    <View style={styles.headerButtonContainer}>
                        <TouchableOpacity
                            onPress={manualRefresh}
                            style={styles.headerButton}
                        >
                            <FontAwesome name="refresh" size={16} color={iconColor} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => router.push(`/editBot/${id}`)}
                            style={styles.headerButton}
                        >
                            <FontAwesome name="navicon" size={16} color={iconColor} />
                        </TouchableOpacity>
                    </View>
                )
            ),
            headerLeft: () => (
                isSelectMode ? (
                    <TouchableOpacity
                        onPress={handleCancelSelect}
                        style={styles.headerButton}
                    >
                        <FontAwesome name="times" size={20} color={iconColor} />
                    </TouchableOpacity>
                ) : undefined
            ),
        });
    }, [
        navigation, botInfo, iconColor, errorColor, id,
        isSelectMode, selectedMessages.size, handleCancelSelect, router,
        manualRefresh // 添加新依赖
    ]);

    // 键盘消失
    const dismissKeyboard = useCallback(() => {
        Keyboard.dismiss();
    }, []);

    // 使用useMemo封装传递给MessageList的所有props
    const messageListProps = useMemo(() => ({
        messages,
        onRetry: handleRetry,
        onLoadMore: handleLoadMore,
        isLoading,
        onDeleteMessages: deleteMessages,
        onStopGeneration: handleStopGeneration,
        isGenerating,
        setShowDeleteDialog,
        handleCancelSelect,
        isSelectMode,
        selectedMessages,
        showDeleteDialog,
        setIsSelectMode: (value: boolean) => setIsSelectMode(value), // 确保正确的类型
        setSelectedMessages: (value: Set<string>) => setSelectedMessages(value), // 确保正确的类型
        shouldScrollToBottom,
        setShouldScrollToBottom
    }), [
        messages,
        handleRetry,
        handleLoadMore,
        isLoading,
        deleteMessages,
        handleStopGeneration,
        isGenerating,
        setShowDeleteDialog,
        handleCancelSelect,
        isSelectMode,
        selectedMessages,
        showDeleteDialog,
        setIsSelectMode,
        setSelectedMessages, // 更新依赖项
        // 添加新的依赖
        shouldScrollToBottom,
        setShouldScrollToBottom
    ]);

    return (
        <SafeAreaProvider>
            <View style={[styles.safeArea, { backgroundColor }]}>
                <TouchableWithoutFeedback onPress={dismissKeyboard}>
                    <View style={[styles.container, { backgroundColor }]}>
                        <MessageList
                            ref={messageListRef}
                            {...messageListProps}
                        />
                    </View>
                </TouchableWithoutFeedback>
                {!isSelectMode && (
                    <ChatInput
                        onSendMessage={handleSendMessageWithScroll} // 使用封装后的方法
                        onVoiceInput={handleVoiceInput}
                        onFileUpload={handleFileUpload}
                    />
                )}
            </View>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        marginTop: Platform.OS === 'ios' ? 78 : 85,
    },
    container: {
        flex: 1,
        marginBottom: 50,
    },
    messageList: {
        flex: 1,
    },
    headerButtonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 55
    },
    headerButton: {
        paddingHorizontal: 10,
        marginHorizontal: 4,
    },
});
