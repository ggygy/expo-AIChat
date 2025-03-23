import { useCallback, useState, useRef } from 'react';
import { Message } from '@/constants/chat';
import Toast from 'react-native-toast-message';
import i18n from '@/i18n/i18n';

interface UseMessageOperationsProps {
  onDeleteMessages?: (messageIds: string[]) => void;
  setIsSelectMode: (value: boolean) => void;
  setSelectedMessages: (value: Set<string>) => void;
  setShowDeleteDialog: (show: boolean) => void;
  handleCancelSelect: () => void;
}

/**
 * 消息操作处理 Hook - 处理消息选择、删除等操作
 */
export const useMessageOperations = ({
  onDeleteMessages,
  setIsSelectMode,
  setSelectedMessages,
  setShowDeleteDialog,
  handleCancelSelect
}: UseMessageOperationsProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const streamingMessageIdRef = useRef<string | null>(null);
  const lastContentLengthRef = useRef<Record<string, number>>({});
  const lastAutoScrollTimeRef = useRef(0);
  
  // 进入消息选择模式
  const handleEnterSelectMode = useCallback(async (message: Message) => {
    return new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        setIsSelectMode(true);
        setSelectedMessages(new Set([message.id]));
        resolve();
      });
    });
  }, [setIsSelectMode, setSelectedMessages]);
  
  // 消息点击事件 - 在选择模式下选择/取消选择消息
  const handleSelect = useCallback((message: Message) => {
    requestAnimationFrame(() => {
      setSelectedMessages(prev => {
        const newSet = new Set(prev);
        if (newSet.has(message.id)) {
          newSet.delete(message.id);
        } else {
          newSet.add(message.id);
        }
        return newSet;
      });
    });
  }, [setSelectedMessages]);
  
  // 确认删除选中的消息
  const handleDeleteConfirm = useCallback(async (selectedMessages: Set<string>) => {
    if (selectedMessages.size > 0) {
      setIsDeleting(true);
      try {
        await onDeleteMessages?.(Array.from(selectedMessages));
        Toast.show({
          type: 'success',
          text1: i18n.t('common.success'),
          text2: i18n.t('chat.deleteSuccess', { count: selectedMessages.size }),
        });
        handleCancelSelect();
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: i18n.t('common.error'),
          text2: i18n.t('chat.deleteFailed'),
        });
      } finally {
        setIsDeleting(false);
        setShowDeleteDialog(false);
      }
    }
  }, [onDeleteMessages, handleCancelSelect, setShowDeleteDialog]);
  
  // 取消删除对话框
  const handleCancelDialog = useCallback(() => {
    if (!isDeleting) {
      setShowDeleteDialog(false);
    }
  }, [isDeleting, setShowDeleteDialog]);
  
  // 删除单个消息
  const handleDeleteSingleMessage = useCallback((messageId: string) => {
    if (onDeleteMessages) {
      onDeleteMessages([messageId]);
      Toast.show({
        type: 'success',
        text1: i18n.t('common.success'),
        text2: i18n.t('chat.deleteSuccess', { count: 1 }),
      });
    }
  }, [onDeleteMessages]);
  
  // 停止生成的处理函数
  const handleStopGeneration = useCallback((e: any, onStopGeneration?: () => void) => {
    // 阻止事件冒泡
    e.stopPropagation?.();
    if (typeof onStopGeneration === 'function') {
      onStopGeneration();
    }
  }, []);
  
  // 更新流式消息ID
  const updateStreamingMessageId = useCallback((messages: Message[]) => {
    // 找到流式状态的消息
    const streamingMessage = messages.find(m => m.status === 'streaming');
    streamingMessageIdRef.current = streamingMessage?.id || null;
    return streamingMessage;
  }, []);

  return {
    isDeleting,
    handleEnterSelectMode,
    handleSelect,
    handleDeleteConfirm,
    handleCancelDialog,
    handleDeleteSingleMessage,
    handleStopGeneration,
    streamingMessageIdRef,
    lastContentLengthRef,
    lastAutoScrollTimeRef,
    updateStreamingMessageId,
  };
};
