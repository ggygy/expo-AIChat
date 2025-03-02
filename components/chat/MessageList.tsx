import React, { memo, useCallback, useState, useMemo, useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator, Pressable } from 'react-native';
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
    viewabilityConfig,
    getFlashListProps
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
  
  // 追踪最后一个流式消息的ID，用于识别需要优先更新的消息
  const streamingMessageIdRef = useRef<string | null>(null);
  
  // 检测是否有正在流式传输的消息
  useEffect(() => {
    // 找到流式状态的消息
    const streamingMessage = messages.find(m => m.status === 'streaming');
    streamingMessageIdRef.current = streamingMessage?.id || null;
  }, [messages]);
  
  // 修改渲染函数来优化流式消息的渲染
  const renderMessage = useCallback(({ item }: { item: Message }) => {
    // 确定是否是流式消息
    const isStreamingMessage = item.id === streamingMessageIdRef.current;
    
    return (
      <MessageCard
        message={item}
        onRetry={item.status === 'error' ? () => onRetry?.(item.id) : undefined}
        onLongPress={() => handleLongPress(item)}
        onPress={() => isSelectMode && handleSelect(item)}
        isSelected={selectedMessages.has(item.id)}
        selectable={isSelectMode}
        // 添加一个key来标记流式消息，强制实时更新
        key={isStreamingMessage ? `${item.id}-${Date.now()}` : item.id}
      />
    );
  }, [onRetry, handleLongPress, handleSelect, selectedMessagesStr, isSelectMode, streamingMessageIdRef.current]);
  
  // 列表底部加载指示器已从FlashList中移除，将在外部独立渲染
  
  // 处理加载更多消息 - 结合滚动优化
  const handleLoadMore = useCallback(() => {
    if (!isLoading && !isScrolling) {
      handleBeforeLoadMore();
      onLoadMore?.();
    }
  }, [onLoadMore, isLoading, isScrolling, handleBeforeLoadMore]);
  
  // 停止生成的处理函数
  const handleStopGeneration = useCallback((e: any) => {
    // 阻止事件冒泡
    e.stopPropagation?.();
    if (typeof onStopGeneration === 'function') {
      onStopGeneration();
    }
  }, [onStopGeneration]);
  
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
  
  // 确保顺畅滚动，特别是对流式消息
  useEffect(() => {
    // 如果存在流式消息则自动滚动到底部
    if (streamingMessageIdRef.current && !isScrolling) {
      scrollToEnd(false);
    }
  }, [messages, isScrolling, streamingMessageIdRef.current]);
  
  // 追踪流式消息内容
  const lastContentLengthRef = useRef<Record<string, number>>({});
  
  // 跟踪流式消息状态变化
  useEffect(() => {
    // 检测是否有流式消息更新
    const streamingMessage = messages.find(m => m.status === 'streaming');
    if (streamingMessage) {
      const msgId = streamingMessage.id;
      const contentLength = streamingMessage.content.length;
      
      // 如果内容长度大幅增加，需要滚动到底部
      if (!lastContentLengthRef.current[msgId] || 
          contentLength - (lastContentLengthRef.current[msgId] || 0) > 30) {
        
        // 更新记录的内容长度
        lastContentLengthRef.current[msgId] = contentLength;
        
        // 如果应该滚动到底部且不是用户手动滚动中
        if (shouldScrollToBottom?.current && !isScrolling) {
          // 使用requestAnimationFrame确保在下一帧绘制前滚动
          requestAnimationFrame(() => {
            scrollToEnd(true);
          });
        }
      }
    }
  }, [messages, scrollToEnd, isScrolling, shouldScrollToBottom]);
  
  // 获取FlashList特定配置
  const flashListProps = getFlashListProps();
  
  return (
    <View style={styles.container}>
      <FlashList
        ref={listRef}
        data={messages}
        renderItem={renderMessage}
        estimatedItemSize={flashListProps.estimatedItemSize}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.2}
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
        disableAutoLayout={flashListProps.disableAutoLayout}
        drawDistance={flashListProps.drawDistance}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 10
        }}
      />
      
      {/* 加载指示器和停止生成按钮作为独立组件 */}
      {(isLoading || isGenerating) && (
        <View style={styles.floatingFooterContainer}>
          {isLoading && (
            <View style={styles.loadingFooter}>
              <ActivityIndicator />
            </View>
          )}
          {isGenerating && (
            <Pressable 
              style={styles.stopButton}
              onPress={handleStopGeneration}
              hitSlop={20}
            >
              <FontAwesome name="stop-circle" size={24} color={iconColor} />
            </Pressable>
          )}
        </View>
      )}

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
  // 浮动在底部的加载指示器和停止按钮容器
  floatingFooterContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
    pointerEvents: 'box-none',
  },
  loadingFooter: {
    paddingVertical: 16,
  },
  stopButton: {
    padding: 6,
    borderRadius: 24,
    zIndex: 20,
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
