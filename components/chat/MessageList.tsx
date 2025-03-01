import React, { memo, useCallback, useState, useMemo, useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Message } from '@/constants/chat';
import MessageCard from './MessageCard';
import { useThemeColor } from '@/hooks/useThemeColor';
import { FontAwesome } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import i18n from '@/i18n/i18n';
import Toast from 'react-native-toast-message';
import { useMessageScroll } from '@/hooks/useMessageScroll';

interface MessageListProps {
  messages: Message[];
  onRetry?: (messageId: string) => void;
  onLoadMore?: () => void;
  isLoading?: boolean;
  onDeleteMessages?: (messageIds: string[]) => void;
  onStopGeneration?: () => void;
  isGenerating?: boolean;
  setShowDeleteDialog: (show: boolean) => void;
  handleCancelSelect: () => void;
  isSelectMode: boolean;
  selectedMessages: Set<string>;
  showDeleteDialog: boolean;
  setIsSelectMode: (value: boolean) => void;
  setSelectedMessages: (value: Set<string>) => void;
  shouldScrollToBottom?: { current: boolean };
  setShouldScrollToBottom?: (value: boolean) => void;
}

export interface MessageListRef {
  scrollToEnd: (animated?: boolean) => void;
}

const MessageList = forwardRef<MessageListRef, MessageListProps>(({
  messages,
  onRetry,
  onLoadMore,
  isLoading,
  onDeleteMessages,
  onStopGeneration,
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
}, ref) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const iconColor = useThemeColor({}, 'text');
  const listRef = useRef<FlashList<Message>>(null);
  
  // 使用滚动逻辑 Hook
  const {
    isScrolling,
    scrollToEnd,
    handleViewableItemsChanged,
    handleScroll,
    handleScrollBeginDrag,
    handleScrollEndDrag,
    handleMomentumScrollEnd,
    handleBeforeLoadMore,
    viewabilityConfig
  } = useMessageScroll(messages, listRef, shouldScrollToBottom, setShouldScrollToBottom);
  
  // 暴露滚动方法给父组件
  useImperativeHandle(ref, () => ({
    scrollToEnd
  }));
  
  // 消息长按事件 - 进入选择模式
  const handleLongPress = useCallback((message: Message) => {
    requestAnimationFrame(() => {
      setIsSelectMode(true);
      setSelectedMessages(new Set([message.id]));
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
  const handleDeleteConfirm = useCallback(async () => {
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
  }, [selectedMessages, onDeleteMessages, handleCancelSelect]);
  
  // 取消删除对话框
  const handleCancelDialog = useCallback(() => {
    if (!isDeleting) {
      setShowDeleteDialog(false);
    }
  }, [isDeleting]);
  
  // 创建用于比较的选中消息字符串
  const selectedMessagesStr = useMemo(() => 
    JSON.stringify(Array.from(selectedMessages)) + isSelectMode, 
    [selectedMessages, isSelectMode]
  );
  
  // 渲染单个消息项
  const renderMessage = useCallback(({ item }: { item: Message }) => (
    <MessageCard
      message={item}
      onRetry={item.status === 'error' ? () => onRetry?.(item.id) : undefined}
      onLongPress={() => handleLongPress(item)}
      onPress={() => isSelectMode && handleSelect(item)}
      isSelected={selectedMessages.has(item.id)}
      selectable={isSelectMode}
    />
  ), [onRetry, handleLongPress, handleSelect, selectedMessagesStr, isSelectMode]);
  
  // 列表底部加载指示器
  const footerComponent = useMemo(() => {
    if (!isLoading && !isGenerating) return null;
    
    return (
      <View style={styles.footerContainer}>
        {isLoading && (
          <View style={styles.loadingFooter}>
            <ActivityIndicator />
          </View>
        )}
        {isGenerating && (
          <TouchableOpacity 
            style={styles.stopButton}
            onPress={onStopGeneration}
          >
            <FontAwesome name="stop-circle" size={24} color={iconColor} />
          </TouchableOpacity>
        )}
      </View>
    );
  }, [isLoading, isGenerating, onStopGeneration, iconColor]);
  
  // 处理加载更多消息 - 结合滚动优化
  const handleLoadMore = useCallback(() => {
    if (!isLoading && !isScrolling) {
      handleBeforeLoadMore();
      onLoadMore?.();
    }
  }, [onLoadMore, isLoading, isScrolling, handleBeforeLoadMore]);
  
  // 添加初始加载后的效果来滚动到底部
  useEffect(() => {
    if (messages.length > 0) {
      // 在组件挂载后及消息变化时尝试滚动
      const timer = setTimeout(() => {
        scrollToEnd(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, []); // 空依赖数组确保只在挂载时执行一次
  
  return (
    <View style={styles.container}>
      <FlashList
        ref={listRef}
        data={messages}
        renderItem={renderMessage}
        estimatedItemSize={100}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.2}
        ListFooterComponent={footerComponent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        extraData={selectedMessagesStr}
        keyExtractor={(item) => item.id || `item-${item.timestamp}`}
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        disableAutoLayout={true}
        estimatedListSize={{ height: 500, width: 350 }}
        drawDistance={200}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      />

      <ConfirmDialog
        visible={showDeleteDialog}
        title={i18n.t('chat.deleteConfirmTitle')}
        message={i18n.t('chat.deleteConfirmMessage', { count: selectedMessages.size })}
        onConfirm={handleDeleteConfirm}
        onCancel={handleCancelDialog}
        confirmDisabled={isDeleting}
        confirmLoading={isDeleting}
        cancelDisabled={isDeleting}
        variant="danger"
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 16,
  },
  footerContainer: {
    padding: 16,
    alignItems: 'center',
    height: 72,
  },
  loadingFooter: {
    paddingVertical: 16,
  },
  stopButton: {
    padding: 8,
    borderRadius: 20,
  },
  selectionToolbar: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  toolbarInfo: {
    flex: 1,
    alignItems: 'center',
  },
});

export default memo(MessageList);
