import { useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import * as Speech from 'expo-speech';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Platform, Share } from 'react-native';
import { ActionMenuItem } from '@/components/chat/ActionMenu';
import { Message } from '@/constants/chat';
import i18n from '@/i18n/i18n';
import { showSuccess, showError } from '@/utils/toast';

interface UseMessageActionsOptions {
  message: Message;
  onRetry?: () => void;
  onEnterSelectMode?: () => void;
  onDeleteMessage?: () => void;
  iconColor?: string;
  retryColor?: string;
  deleteColor?: string;
  dislikeColor?: string;
  colors?: any;
}

export const useMessageActions = ({
  message,
  onRetry,
  onEnterSelectMode,
  onDeleteMessage,
  iconColor = '#333',
  retryColor = '#f00',
  deleteColor = '#ff3b30',
  dislikeColor = '#666',
  colors,
}: UseMessageActionsOptions) => {
  // 操作菜单状态
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [isReading, setIsReading] = useState(false);
  
  // 添加文本选择浮层状态，替换之前的textSelectMode
  const [textSelectionOverlayVisible, setTextSelectionOverlayVisible] = useState(false);
  
  // 定义操作菜单项
  const getMenuActions = (): ActionMenuItem[] => {
    const actions: ActionMenuItem[] = [
      {
        id: 'copy',
        icon: 'copy',
        label: i18n.t('common.copy'),
        onPress: handleCopyText
      }
    ];

    // 添加朗读选项
    if (message.content) {
      actions.push({
        id: isReading ? 'stop-reading' : 'read',
        icon: isReading ? 'stop-circle' : 'volume-up',
        label: isReading ? i18n.t('chat.stopReading') : i18n.t('chat.readAloud'),
        onPress: isReading ? handleStopReading : handleReadAloud
      });
    }
    
    // 如果消息有错误状态且提供了重试函数，添加重试选项
    if (message.status === 'error' && onRetry) {
      actions.push({
        id: 'retry',
        icon: 'refresh',
        label: i18n.t('common.retry'),
        color: retryColor,
        onPress: onRetry
      });
    }
    
    // 分享选项
    if (message.content) {
      actions.push({
        id: 'share',
        icon: 'share',
        label: i18n.t('common.share'),
        onPress: handleShare
      });
    }
    
    // 添加文本选择选项 - 仅为非用户消息提供
    if (message.role !== 'user') {
      actions.push({
        id: 'select-text',
        icon: 'font',
        label: i18n.t('chat.selectText'),
        onPress: handleShowTextSelectionOverlay
      });
    }
    
    // 点踩选项 - 仅对AI消息
    if (message.role !== 'user') {
      actions.push({
        id: 'dislike',
        icon: 'thumbs-down',
        label: i18n.t('chat.dislike'),
        color: dislikeColor,
        onPress: handleDislike
      });
    }
    
    // 删除选项
    if (onDeleteMessage) {
      actions.push({
        id: 'delete',
        icon: 'trash',
        label: i18n.t('common.delete'),
        color: deleteColor,
        onPress: onDeleteMessage
      });
    }
    
    // 添加选择模式选项
    actions.push({
      id: 'select',
      icon: 'check-square-o',
      label: i18n.t('chat.selectMode'),
      onPress: () => {
        if (onEnterSelectMode) {
          onEnterSelectMode();
        }
      }
    });
    
    return actions;
  };
  
  // 复制文本
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
  
  // 朗读文本
  const handleReadAloud = async () => {
    try {
      const textToRead = message.content;
      
      if (!textToRead) return;
      
      // 检查是否正在朗读
      const isSpeaking = await Speech.isSpeakingAsync();
      
      if (isSpeaking) {
        await Speech.stop();
      }
      
      // 开始朗读
      setIsReading(true);
      await Speech.speak(textToRead, {
        language: i18n.locale.startsWith('zh') ? 'zh-CN' : 'en-US',
        rate: 0.9,
        onDone: () => setIsReading(false),
        onError: () => {
          setIsReading(false);
          showError('chat.readError');
        }
      });
    } catch (error) {
      setIsReading(false);
      showError('chat.readError');
    }
  };
  
  // 停止朗读
  const handleStopReading = async () => {
    try {
      await Speech.stop();
      setIsReading(false);
    } catch (error) {
      showError('common.error');
    }
  };
  
  // 处理分享
  const handleShare = async () => {
    try {
      // 分享文本内容，包括思考内容（如果有）
      const textToShare = message.thinkingContent 
        ? `${i18n.t('chat.thinking')}:\n${message.thinkingContent}\n\n${i18n.t('chat.answer')}:\n${message.content}`
        : message.content;
      
      if (!textToShare) return;
      
      if (Platform.OS === 'web') {
        // Web平台使用Navigator API
        if (navigator.share) {
          await navigator.share({
            text: textToShare
          });
        } else {
          // 回退到复制
          await Clipboard.setStringAsync(textToShare);
          showSuccess('common.copySuccess');
        }
      } else {
        // 原生平台使用React Native Share API
        if (Platform.OS === 'ios' || Platform.OS === 'android') {
          try {
            // 使用React Native内置的Share API
            const result = await Share.share({
              message: textToShare,
              title: i18n.t('chat.shareTitle')
            });
            
            if (result.action === Share.dismissedAction) {
              // 用户取消了分享
              return;
            }
          } catch (error) {
            // 如果Share API失败，尝试使用Expo Sharing API创建临时文件分享
            await shareViaFile(textToShare);
          }
        } else {
          // 其他平台使用Expo Sharing API
          await shareViaFile(textToShare);
        }
      }
    } catch (error) {
      console.error('分享失败:', error);
      showError('chat.shareFailed');
    }
  };
  
  // 通过创建临时文件来分享文本
  const shareViaFile = async (text: string) => {
    try {
      // 检查分享功能是否可用
      if (!(await Sharing.isAvailableAsync())) {
        await Clipboard.setStringAsync(text);
        showSuccess('common.copySuccess');
        return;
      }
      
      // 创建临时文本文件
      const fileName = `${FileSystem.cacheDirectory}share_message_${Date.now()}.txt`;
      await FileSystem.writeAsStringAsync(fileName, text);
      
      // 分享文件
      await Sharing.shareAsync(fileName, {
        mimeType: 'text/plain',
        dialogTitle: i18n.t('chat.shareMessage'),
      });
      
      // 分享完成后删除临时文件
      try {
        await FileSystem.deleteAsync(fileName, { idempotent: true });
      } catch (e) {
        // 忽略删除失败的错误
        console.log('清理临时文件失败', e);
      }
    } catch (error) {
      console.error('文件分享失败:', error);
      // 如果文件分享失败，回退到复制到剪贴板
      await Clipboard.setStringAsync(text);
      showSuccess('common.copySuccess');
    }
  };
  
  // 处理点踩
  const handleDislike = () => {
    // 这里应实现向后端发送反馈的逻辑
    showSuccess('chat.feedbackSent');
  };
  
  // 显示文本选择浮层
  const handleShowTextSelectionOverlay = () => {
    setTextSelectionOverlayVisible(true);
    setMenuVisible(false); // 关闭菜单
  };
  
  // 关闭文本选择浮层
  const handleCloseTextSelectionOverlay = () => {
    setTextSelectionOverlayVisible(false);
  };

  // 处理长按事件，显示操作菜单
  const handleLongPress = (event: any) => {
    // 直接使用触摸事件的位置来显示菜单
    const { pageX, pageY } = event.nativeEvent;
    
    setMenuPosition({
      x: pageX,
      y: pageY
    });
    setMenuVisible(true);
  };
  
  // 关闭操作菜单
  const closeMenu = () => {
    setMenuVisible(false);
  };
  
  // 组件卸载时清理
  const cleanup = () => {
    if (isReading) {
      Speech.stop();
    }
  };
  
  return {
    menuVisible,
    menuPosition,
    handleLongPress,
    closeMenu,
    getMenuActions,
    cleanup,
    isReading,
    textSelectionOverlayVisible,
    handleCloseTextSelectionOverlay,
  };
};
