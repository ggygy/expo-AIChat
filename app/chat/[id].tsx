import React from 'react';
import { View, StyleSheet, SafeAreaView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useThemeColor } from '@/hooks/useThemeColor';
import ChatInput from '@/components/chat/ChatInput';

export default function ChatScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const backgroundColor = useThemeColor({}, 'background');

    const handleSendMessage = (text: string) => {
        console.log('Sending message:', text);
        // TODO: 实现发送消息逻辑
    };

    const handleVoiceInput = () => {
        console.log('Voice input activated');
        // TODO: 实现语音输入逻辑
    };

    const handleFileUpload = () => {
        console.log('File upload triggered');
        // TODO: 实现文件上传逻辑
    };

    const dismissKeyboard = () => {
        Keyboard.dismiss();
    };

    return (
        <View style={[styles.safeArea, { backgroundColor }]}>
            <TouchableWithoutFeedback onPress={dismissKeyboard}>
                <View style={[styles.container, { backgroundColor }]}>
                    <View style={[styles.messageList, { backgroundColor }]}>
                        {/* TODO: 添加消息列表组件 */}
                    </View>
                </View>
            </TouchableWithoutFeedback>
            {/* 移至外层以避免触摸事件冲突 */}
            <ChatInput
                onSendMessage={handleSendMessage}
                onVoiceInput={handleVoiceInput}
                onFileUpload={handleFileUpload}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
        paddingBottom: 100, // 为输入框预留空间
    },
    messageList: {
        flex: 1,
    },
});
