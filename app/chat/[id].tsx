import React, { useLayoutEffect, useRef, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, TouchableWithoutFeedback, Keyboard } from 'react-native';
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
        messagesLengthRef,
        manualRefresh // 新增的手动刷新方法
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

    // 监听消息变化，滚动到底部
    useEffect(() => {
        if (messages.length > messagesLengthRef.current) {
            // 延迟滚动以确保 UI 已更新
            const timer = setTimeout(() => {
                messageListRef.current?.scrollToEnd(true);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [messages.length]);

    // 首次加载后，滚动到底部
    useEffect(() => {
        if (isFirstLoadRef.current && messages.length > 0) {
            isFirstLoadRef.current = false;
            const timer = setTimeout(() => {
                messageListRef.current?.scrollToEnd(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [messages]);

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
        setIsSelectMode,
        setSelectedMessages,
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
    ]);

    return (
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
                    onSendMessage={handleSendMessage}
                    onVoiceInput={handleVoiceInput}
                    onFileUpload={handleFileUpload}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
        paddingBottom: 50,
    },
    messageList: {
        flex: 1,
    },
    headerButtonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerButton: {
        padding: 10,
        marginHorizontal: 4,
    },
});
