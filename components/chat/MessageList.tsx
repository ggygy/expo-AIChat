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
  const [isPreloading, setIsPreloading] = useState(false); // 新增预加载状态
  
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
    viewAbilityConfig,
    getFlashListProps,
    isScrollingInProgress,
    handleLayout,
    handleLoadMore, // 从 hook 中获取 handleLoadMore
    setLoadMoreCallback,
    // 使用新增API
    handlePreloadMore,
    setLoadMoreThreshold,
    setLoadThrottleTime,
    isLoadingMore,
    handleMessagesChanged,
    initialLayoutCompletedRef
  } = useMessageScroll(messages, listRef, shouldScrollToBottom, setShouldScrollToBottom);
  
  // 自定义预加载逻辑，增加视觉反馈
  const triggerPreloadWithFeedback = useCallback(async () => {
    if (isLoadingMore() || !onLoadMore) return;
    
    setIsPreloading(true);
    try {
      // 使用预加载函数
      await handlePreloadMore();
    } finally {
      // 延迟关闭预加载状态，确保用户能看到视觉反馈
      setTimeout(() => setIsPreloading(false), 500);
    }
  }, [handlePreloadMore, isLoadingMore, onLoadMore]);
  
  // 设置加载更多回调，包装原始回调以支持异步处理和视觉反馈
  useEffect(() => {
    if (onLoadMore) {
      setLoadMoreCallback(() => {
        // 返回一个函数作为真正的回调
        return async () => {
          // 添加延迟，模拟网络请求时间
          await new Promise(resolve => setTimeout(resolve, 100));
          onLoadMore();
        };
      });
    }
  }, [onLoadMore, setLoadMoreCallback]);
  
  // 配置预加载参数
  useEffect(() => {
    // 设置预加载阈值为80%（即当滚动到顶部20%位置时预加载）
    setLoadMoreThreshold(0.8);
    // 设置节流时间为800ms
    setLoadThrottleTime(800);
  }, [setLoadMoreThreshold, setLoadThrottleTime]);
  
  // 暴露滚动方法给父组件
  useImperativeHandle(ref, () => ({
    scrollToEnd
  }));
  
  // 消息长按事件 - 现在通过操作菜单进入选择模式
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
        onEnterSelectMode={() => handleEnterSelectMode(item)}
        onPress={() => isSelectMode && handleSelect(item)}
        isSelected={selectedMessages.has(item.id)}
        selectable={isSelectMode}
        onDeleteMessage={handleDeleteSingleMessage}
        key={item.id}
        isStreaming={isStreamingMessage}
      />
    );
  }, [onRetry, handleSelect, selectedMessagesStr, isSelectMode, handleEnterSelectMode, streamingMessageIdRef.current, handleDeleteSingleMessage]);
  
  // 停止生成的处理函数
  const handleStopGeneration = useCallback((e: any) => {
    // 阻止事件冒泡
    e.stopPropagation?.();
    if (typeof onStopGeneration === 'function') {
      onStopGeneration();
    }
  }, [onStopGeneration]);
  
  // 使用一个统一的消息滚动管理器
  const messageScrollManagerRef = useRef({
    hasInitialScrolled: false,
    lastScrolledMessagesLength: 0,
    lastScrollTime: 0
  });
  
  // 追踪流式消息内容长度变化
  const lastContentLengthRef = useRef<Record<string, number>>({});
  
  // 跟踪消息变化是否来自于初始加载
  const isFirstLoadRef = useRef(true);
  
  // 统一使用effect监听消息变化，与布局事件协调
  useEffect(() => {
    if (messages.length > 0) {
      if (isFirstLoadRef.current) {
        // 首次加载消息时，让布局事件处理滚动
        console.log('首次加载消息，等待布局事件处理滚动');
        isFirstLoadRef.current = false;
      } else if (initialLayoutCompletedRef.current) {
        // 非首次加载且布局已完成，处理滚动
        handleMessagesChanged();
      }
    }
  }, [messages, handleMessagesChanged, initialLayoutCompletedRef]);
  
  // 使用更明确的布局处理函数
  const handleListLayout = useCallback((event: any) => {
    console.log('触发FlashList布局事件');
    handleLayout();
  }, [handleLayout]);
  
  // 简化流式消息的滚动逻辑，统一使用上面的处理器
  useEffect(() => {
    // 检测是否有流式消息更新
    const streamingMessage = messages.find(m => m.status === 'streaming');
    
    if (streamingMessage && 
        shouldScrollToBottom?.current && 
        !isScrolling && 
        !isScrollingInProgress() && 
        initialLayoutCompletedRef.current) {
      // 内容长度节流，不是每次内容更新都滚动
      const msgId = streamingMessage.id;
      const contentLength = streamingMessage.content.length;
      
      // 只在内容有显著变化时滚动
      if (!lastContentLengthRef.current[msgId] || 
          contentLength - (lastContentLengthRef.current[msgId] || 0) > 50) {
        
        // 更新记录的内容长度
        lastContentLengthRef.current[msgId] = contentLength;
        
        // 使用统一的滚动逻辑
        handleMessagesChanged();
      }
    }
  }, [messages, handleMessagesChanged, isScrolling, shouldScrollToBottom, isScrollingInProgress, initialLayoutCompletedRef]);
  
  // 添加时间引用
  const lastAutoScrollTimeRef = useRef(0);
  
  // 获取FlashList特定配置
  const flashListProps = getFlashListProps();
  
  return (
    <View style={styles.container}>
      {/* 预加载指示器 */}
      {isPreloading && !isLoading && (
        <View style={styles.preloadingIndicator}>
          <ActivityIndicator size="small" color="#007AFF" />
        </View>
      )}
      
      <FlashList
        ref={listRef}
        data={messages}
        renderItem={renderMessage}
        inverted={false}
        estimatedItemSize={flashListProps.estimatedItemSize}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={true}
        onLayout={handleListLayout} // 使用更明确的布局处理函数
        contentContainerStyle={{
          paddingVertical: 8,
          paddingBottom: isGenerating ? 80 : 60
        }}
        extraData={selectedMessagesStr}
        keyExtractor={(item) => item.id || `item-${item.timestamp}`}
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewAbilityConfig}
        disableAutoLayout={false}
        drawDistance={flashListProps.drawDistance}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 10
        }}
        scrollEventThrottle={16}
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
  // contentContainer 样式可以保留在这里，但我们将直接在 contentContainerStyle 属性中使用
  contentContainer: {
    paddingVertical: 8,
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
    padding: 9,
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
  // 新增预加载指示器样式
  preloadingIndicator: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingVertical: 6,
    borderRadius: 15,
    marginHorizontal: 140,
  },
});

export default memo(MessageList);
