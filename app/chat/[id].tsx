import React, { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import { View, StyleSheet, TouchableWithoutFeedback, Keyboard, Platform, Animated, KeyboardAvoidingView } from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useBotStore } from '@/store/useBotStore';
import ChatInput from '@/components/chat/ChatInput';
import MessageList, { MessageListRef } from '@/components/chat/MessageList';
import ChatSettings from '@/components/chat/ChatSettings';

// 导入自定义hooks
import { useChatMessages } from '@/hooks/useChatMessages';
import { useChatActions } from '@/hooks/useChatActions';
import { useChatSelection } from '@/hooks/useChatSelection';
import { useChatNavigation } from '@/hooks/useChatNavigation';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function ChatScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const backgroundColor = useThemeColor({}, 'cardBackground');
    const iconColor = useThemeColor({}, 'text');
    const errorColor = useThemeColor({}, 'error');
    const messageListRef = useRef<MessageListRef>(null);
    const getBotInfo = useBotStore(state => state.getBotInfo);
    const botInfo = getBotInfo(id);
    
    // 设置状态和动画值
    const [showSettings, setShowSettings] = useState(false);
    const settingsAnimation = useRef(new Animated.Value(0)).current;
    
    // 设置动画效果
    useEffect(() => {
      Animated.timing(settingsAnimation, {
        toValue: showSettings ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, [showSettings, settingsAnimation]);
    
    // 设置面板动画样式
    const settingsStyle = {
      transform: [{
        translateY: settingsAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [-300, 0],
        })
      }],
      opacity: settingsAnimation,
    };

    // 使用消息管理hook
    const {
        messages,
        setMessages,
        isLoading,
        onLoadMore,
        totalMessages,
        setTotalMessages,
        deleteMessages,
        addMessage,
        isFirstLoadRef,
        manualRefresh,
        shouldScrollToBottom,
        setShouldScrollToBottom
    } = useChatMessages(id);

    // 使用消息操作hook
    const {
        handleSendMessage,
        handleRetry,
        handleStopGeneration,
        handleVoiceInput,
        handleFileUpload,
        isGenerating
    } = useChatActions(id, messages, setMessages, totalMessages, setTotalMessages, addMessage); // 添加 addMessage 参数

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

    // 优化切换设置的处理函数
    const toggleSettings = useCallback(() => {
      setShowSettings(prev => !prev);
    }, []);
    
    // 设置面板点击外部关闭
    const handleOverlayPress = useCallback(() => {
      if (showSettings) {
        setShowSettings(false);
      }
    }, [showSettings]);

    // 使用导航配置hook，并获取header高度
    const { headerHeight } = useChatNavigation({
        botName: botInfo?.name,
        iconColor,
        errorColor,
        botId: id,
        isSelectMode,
        selectedMessagesCount: selectedMessages.size,
        handleCancelSelect,
        setShowDeleteDialog,
        manualRefresh,
        toggleSettings, // 传递优化后的切换函数
        showSettings,
        headerHeight: Platform.OS === 'ios' ? 58 : 70
    });

    // 监控消息状态，不再需要基于消息长度自动滚动
    // 实际的滚动逻辑已经在 MessageList 组件内部处理
    useEffect(() => {
        // 仅第一次进入页面时记录日志，并且确保只执行一次
        if (isFirstLoadRef.current && messages.length > 0) {
            console.log('首次加载完成，有消息数量:', messages.length);
            isFirstLoadRef.current = false;
            
            // 确保设置滚动到底部标志为true
            if (setShouldScrollToBottom) {
                setShouldScrollToBottom(true);
            }
        }
    }, [messages.length, setShouldScrollToBottom]);

    // 当发送新消息后，确保滚动到底部
    const handleSendMessageWithScroll = useCallback((text: string) => {
        // 先设置滚动标志
        if (setShouldScrollToBottom) {
            setShouldScrollToBottom(true);
        }

        // 发送消息
        const result = handleSendMessage(text);
        
        return result;
    }, [handleSendMessage, setShouldScrollToBottom]);

    // 键盘消失
    const dismissKeyboard = useCallback(() => {
        Keyboard.dismiss();
    }, []);

    // 使用useMemo封装传递给MessageList的所有props
    const messageListProps = useMemo(() => ({
        messages,
        onRetry: handleRetry,
        onLoadMore, // 使用统一命名
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
        setShouldScrollToBottom,
    }), [
        messages,
        handleRetry,
        onLoadMore,
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
        setSelectedMessages,
        shouldScrollToBottom,
        setShouldScrollToBottom,
    ]);

    // 添加键盘状态跟踪
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    
    // 监听键盘事件
    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            () => {
                setKeyboardVisible(true);
            }
        );
        const keyboardDidHideListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => {
                setKeyboardVisible(false);
            }
        );

        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    return (
        <SafeAreaProvider>
            <KeyboardAvoidingView 
                style={{ flex: 1 }}
                enabled={keyboardVisible}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight + 14 : 0}
            >
                <View style={[
                    styles.safeArea, 
                    { 
                        backgroundColor,
                        marginTop: Platform.OS === 'ios' ? headerHeight + 14 : headerHeight + 20
                    }
                ]}>
                    <View style={[styles.messageListContainer, { backgroundColor }]}>
                        <MessageList
                            ref={messageListRef}
                            {...messageListProps}
                        />
                    </View>
                    
                    {!isSelectMode && (
                        <View style={styles.inputContainer}>
                            <ChatInput
                                onSendMessage={handleSendMessageWithScroll}
                                onVoiceInput={handleVoiceInput}
                                onFileUpload={handleFileUpload}
                            />
                        </View>
                    )}
                    
                    {/* 设置面板 */}
                    {showSettings && (
                        <ChatSettings 
                            botId={id} 
                            onClose={() => setShowSettings(false)}
                        />
                    )}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        position: 'relative', // 确保子元素可以相对于此容器定位
    },
    messageListContainer: {
        flex: 1,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 60, // 留出输入框的高度
    },
    inputContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 60, // 输入框高度
        backgroundColor: 'transparent', // 确保背景透明，防止遮挡
    },
    settingsOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000,
    },
    container: {
        flex: 1,
    },
    // ...other existing styles...
});
