import React, { useLayoutEffect, useState, useCallback } from 'react';
import { View, StyleSheet, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { FontAwesome } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useBotStore } from '@/store/useBotStore';
import { Message } from '@/constants/chat';
import { messageDb } from '@/database';
import { useFocusEffect } from '@react-navigation/native';
import { useAIChat } from '@/hooks/useAIChat';
import ChatInput from '@/components/chat/ChatInput';
import MessageList from '@/components/chat/MessageList';
import i18n from '@/i18n/i18n';

export default function ChatScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const backgroundColor = useThemeColor({}, 'cardBackground');
    const iconColor = useThemeColor({}, 'text');
    const errorColor = useThemeColor({}, 'error');
    const navigation = useNavigation();
    const router = useRouter();
    const getBotInfo = useBotStore(state => state.getBotInfo);
    const botInfo = getBotInfo(id);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const pageSize = 20;
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const { sendMessage, isGenerating, setIsGenerating } = useAIChat(id);
    const updateBotStats = useBotStore(state => state.updateBotStats);

    const loadMessages = useCallback(async (pageNum: number) => {
        if (isLoading || (!hasMore && pageNum > 0)) return;
        setIsLoading(true);
        try {
            const newMessages = await messageDb.getMessages(id, pageSize, pageNum * pageSize);
            if (newMessages.length < pageSize) {
                setHasMore(false);
            }
            if (pageNum === 0) {
                setMessages(newMessages);
            } else {
                setMessages(prev => [...prev, ...newMessages]);
            }
            setPage(pageNum);
        } catch (error) {
            console.error('Failed to load messages:', error);
        } finally {
            setIsLoading(false);
        }
    }, [id, isLoading, hasMore]);

    const handleLoadMore = useCallback(() => {
        if (hasMore && !isLoading) {
            loadMessages(page + 1);
        }
    }, [loadMessages, page, hasMore, isLoading]);

    useFocusEffect(
        useCallback(() => {
            loadMessages(0);
        }, [loadMessages])
    );

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
                    <TouchableOpacity 
                        onPress={() => router.push(`/editBot/${id}`)}
                        style={styles.headerButton}
                    >
                        <FontAwesome name="navicon" size={16} color={iconColor} />
                    </TouchableOpacity>
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
    }, [navigation, botInfo, iconColor, id, isSelectMode, selectedMessages.size]);

    const handleSendMessage = async (text: string) => {
        const newMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: Date.now(),
            contentType: 'text',
            status: 'sent'
        };
        
        try {
            await sendMessage(newMessage, (updatedMessages) => {
                setMessages(prev => {
                    const filtered = prev.filter(msg => 
                        !updatedMessages.find(m => m.id === msg.id)
                    );
                    const newMessages = [...filtered, ...updatedMessages];
                    
                    // 更新机器人的最后消息预览和时间戳
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage) {
                        updateBotStats(id, {
                            lastMessageAt: lastMessage.timestamp,
                            lastMessagePreview: lastMessage.content.slice(0, 50),
                            messagesCount: newMessages.length
                        });
                    }
                    
                    return newMessages;
                });
            });
        } catch (error) {
            console.error('Failed to handle message:', error);
        }
    };

    const handleRetry = (messageId: string) => {
        // TODO: 实现重试逻辑
    };

    const handleVoiceInput = () => {
        console.log('Voice input activated');
        // TODO: 实现语音输入逻辑
    };

    const handleFileUpload = () => {
        console.log('File upload triggered');
        // TODO: 实现文件上传逻辑
    };

    const handleDeleteMessages = useCallback(async (messageIds: string[]) => {
        try {
            await Promise.all(messageIds.map(id => messageDb.deleteMessage(id)));
            setMessages(prev => prev.filter(msg => !messageIds.includes(msg.id)));
        } catch (error) {
            console.error('Failed to delete messages:', error);
        }
    }, []);

    const handleStopGeneration = useCallback(() => {
        setIsGenerating(false);
        // TODO: 实际停止 API 调用的逻辑
    }, []);

    const handleCancelSelect = useCallback(() => {
        requestAnimationFrame(() => {
            setIsSelectMode(false);
            setSelectedMessages(new Set());
        });
    }, []);

    useLayoutEffect(() => {
        if (!isSelectMode) {
            setSelectedMessages(new Set());
        }
    }, [isSelectMode]);

    const dismissKeyboard = () => {
        Keyboard.dismiss();
    };

    return (
        <View style={[styles.safeArea, { backgroundColor }]}>
            <TouchableWithoutFeedback onPress={dismissKeyboard}>
                <View style={[styles.container, { backgroundColor }]}>
                    <MessageList
                        messages={messages}
                        onRetry={handleRetry}
                        onLoadMore={handleLoadMore}
                        isLoading={isLoading}
                        onDeleteMessages={handleDeleteMessages}
                        onStopGeneration={handleStopGeneration}
                        isGenerating={isGenerating}
                        setShowDeleteDialog={setShowDeleteDialog}
                        handleCancelSelect={handleCancelSelect}
                        isSelectMode={isSelectMode}
                        selectedMessages={selectedMessages}
                        showDeleteDialog={showDeleteDialog}
                        setIsSelectMode={setIsSelectMode}
                        setSelectedMessages={setSelectedMessages}
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
    },
    messageList: {
        flex: 1,
    },
    headerButton: {
        padding: 10,
        marginHorizontal: 4,
    },
});
