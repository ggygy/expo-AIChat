import { useState, useCallback, useEffect } from 'react';
import i18n from '@/i18n/i18n';
import { showSuccess, showError } from '@/utils/toast'; // 导入 Toast 辅助函数
import { Message } from '@/constants/chat';

type DeleteMessagesFunction = (messageIds: string[]) => Promise<boolean>;

export function useChatSelection(onDeleteMessages: DeleteMessagesFunction) {
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 取消选择模式
  const handleCancelSelect = useCallback(() => {
    setIsSelectMode(false);
    setSelectedMessages(new Set());
  }, []);

  // 处理长按消息，进入选择模式
  const handleLongPress = useCallback((message: Message) => {
    setIsSelectMode(true);
    setSelectedMessages(new Set([message.id]));
  }, []);

  // 处理单击消息，选择或取消选择
  const handleSelect = useCallback((message: Message) => {
    setSelectedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(message.id)) {
        newSet.delete(message.id);
      } else {
        newSet.add(message.id);
      }
      return newSet;
    });
  }, []);

  // 确认删除选中的消息
  const handleDeleteConfirm = useCallback(async () => {
    if (selectedMessages.size === 0) return;
    
    setIsDeleting(true);
    try {
      const result = await onDeleteMessages(Array.from(selectedMessages));
      
      if (result) {
        showSuccess('chat.deleteSuccess', { count: selectedMessages.size });
        handleCancelSelect();
      } else {
        showError('chat.deleteFailed');
      }
    } catch (error) {
      showError('chat.deleteFailed');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  }, [selectedMessages, onDeleteMessages, handleCancelSelect]);

  // 退出选择模式时清除选中的消息
  useEffect(() => {
    if (!isSelectMode) {
      setSelectedMessages(new Set());
    }
  }, [isSelectMode]);

  return {
    isSelectMode,
    setIsSelectMode,
    selectedMessages,
    setSelectedMessages, // 导出原始的setSelectedMessages
    showDeleteDialog,
    setShowDeleteDialog,
    isDeleting,
    handleCancelSelect,
    handleLongPress,
    handleSelect,
    handleDeleteConfirm
  };
}
