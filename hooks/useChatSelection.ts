import { useState, useCallback, useEffect } from 'react';
import i18n from '@/i18n/i18n';
import { showSuccess, showError } from '@/utils/toast'; // 导入 Toast 辅助函数

export function useChatSelection(onDeleteMessages: (messageIds: string[]) => Promise<boolean>) {
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
  const handleLongPress = useCallback((messageId: string) => {
    setIsSelectMode(true);
    setSelectedMessages(new Set([messageId]));
  }, []);

  // 处理单击消息，选择或取消选择
  const handleSelect = useCallback((messageId: string) => {
    setSelectedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
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
