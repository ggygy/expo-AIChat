import React, { memo, useCallback, useState, useMemo, useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import { StyleSheet, View, Text, useWindowDimensions } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Message } from '@/constants/chat';
import MessageCard from './MessageCard';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import i18n from '@/i18n/i18n';
import { useMessageScroll } from '@/hooks/useMessageScroll';
import { useMessageOperations } from '@/hooks/useMessageOperations';
import { getPlatformOptimizedFlashListProps } from '@/utils/platformFixes';
import MessageIndicators from './MessageIndicators';

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
  hasLoadedAllMessages?: () => boolean; // 新增参数检查是否已加载所有消息
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
  hasLoadedAllMessages,
}, ref) => {
  const [isPreloading, setIsPreloading] = useState(false);
  const iconColor = useThemeColor({}, 'text');
  const listRef = useRef<FlashList<Message>>(null);
  const windowDimensions = useWindowDimensions();
  
  // 使用消息操作Hook
  const {
    isDeleting,
    handleEnterSelectMode,
    handleSelect,
    handleDeleteConfirm,
    handleCancelDialog,
    handleDeleteSingleMessage,
    handleStopGeneration: baseHandleStopGeneration,
    streamingMessageIdRef,
    lastAutoScrollTimeRef,
    updateStreamingMessageId,
  } = useMessageOperations({
    onDeleteMessages,
    setIsSelectMode,
    setSelectedMessages,
    setShowDeleteDialog,
    handleCancelSelect
  });
  
  // 使用滚动逻辑 Hook - 获取showScrollToBottom状态
  const {
    showScrollToBottom,
    safeScrollToEnd,
    handleViewableItemsChanged,
    handleScroll,
    handleScrollBeginDrag,
    handleScrollEndDrag,
    handleMomentumScrollEnd,
  } = useMessageScroll(messages, listRef, shouldScrollToBottom, setShouldScrollToBottom);
  
  // 新增：用于保存上次滚动位置
  const lastScrollPositionRef = useRef(0);
  const isFirstLayoutRef = useRef(true);
  
  // 使用自定义滚动处理Hook
  const handleCustomScroll = useCallback((event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    
    // 保存当前滚动位置
    lastScrollPositionRef.current = contentOffset.y;
    
    // 当滚动到接近底部时（反转后为接近顶部的历史消息）
    if (!isLoading && !hasLoadedAllMessages?.() && 
        contentOffset.y > contentSize.height - layoutMeasurement.height * 1.5) {
      const now = Date.now();
      if (now - lastAutoScrollTimeRef.current > 1000) { // 节流1秒
        lastAutoScrollTimeRef.current = now;
        console.log('接近顶部，加载更多历史消息');
        onLoadMore?.();
      }
    }
  }, [isLoading, hasLoadedAllMessages, onLoadMore]);
  
  // 封装停止生成的处理函数
  const handleStopGenerationWrapper = useCallback((e: any) => {
    baseHandleStopGeneration(e, onStopGeneration);
  }, [baseHandleStopGeneration, onStopGeneration]);
  
  // 创建用于比较的选中消息字符串
  const selectedMessagesStr = useMemo(() => 
    JSON.stringify(Array.from(selectedMessages)) + isSelectMode, 
    [selectedMessages, isSelectMode]
  );
  
  // 检测是否有正在流式传输的消息
  useEffect(() => {
    updateStreamingMessageId(messages);
  }, [messages, updateStreamingMessageId]);
  
  // 优化FlashList性能配置
  const flashListProps = useMemo(() => {
    const platformProps = getPlatformOptimizedFlashListProps();
    return {
      // 估计项目大小 - 增加估计值以减少测量频率
      estimatedItemSize: 150,
      
      // 禁用视图回收，这有助于防止快速滚动时的黑屏
      removeClippedSubviews: false,
      
      // 保持可见内容位置，提高滚动体验
      maintainVisibleContentPosition: {
        minIndexForVisible: 0,
        autoscrollToTopThreshold: 10
      },
      
      // 增加绘制距离，提前渲染更多内容防止黑屏
      drawDistance: windowDimensions.height * 2,
      
      // 提供列表尺寸估计，减少初始测量时间
      estimatedListSize: { 
        width: windowDimensions.width, 
        height: windowDimensions.height 
      },
      
      // 禁用水平列表高度测量，进一步优化性能
      disableHorizontalListHeightMeasurement: true,
    };
  }, [windowDimensions.width, windowDimensions.height]);
  
  // 优化渲染项目函数 - 支持测量目标和类型区分
  const renderMessage = useCallback(({ item, index, target }: { 
    item: Message, 
    index: number, 
    target?: "Cell" | "StickyHeader" | "Measurement" 
  }) => {
    // 如果是测量阶段，返回简化版本以提高性能
    if (target === "Measurement") {
      return <View style={{ height: 150 }} />;
    }
    
    // 确保item存在
    if (!item) {
      console.warn('Rendering null item at index', index);
      return <View style={{ height: 150 }} />;
    }
    
    const isStreamingMessage = item.id === streamingMessageIdRef.current;
    
    return (
      <MessageCard
        message={item}
        onRetry={item.status === 'error' ? () => onRetry?.(item.id) : undefined}
        onEnterSelectMode={() => handleEnterSelectMode(item)}
        onPress={() => isSelectMode && handleSelect(item)}
        isSelected={selectedMessages.has(item.id || '')}
        selectable={isSelectMode}
        onDeleteMessage={handleDeleteSingleMessage}
        key={item.id || `item-${index}`}
        isStreaming={isStreamingMessage}
      />
    );
  }, [onRetry, handleSelect, selectedMessagesStr, isSelectMode, handleEnterSelectMode, 
      streamingMessageIdRef.current, handleDeleteSingleMessage]);
  
  // 添加类型检测函数 - 帮助FlashList优化重用
  const getItemType = useCallback((item: Message) => {
    if (!item) return 'unknown';
    return item.role === 'user' ? 'user' : 'assistant';
  }, []);
  
  // 提供布局覆盖函数 - 优化尺寸估计
  const overrideItemLayout = useCallback((layout: {span?: number, size?: number}, item: Message, index: number) => {
    if (!item) return;
    
    // 根据消息内容长度和类型估算大小
    const estimatedHeight = item.role === 'user' 
      ? 80 + Math.min(300, (item.content?.length || 0) * 0.1) 
      : 120 + Math.min(500, ((item.content?.length || 0) + (item.thinkingContent?.length || 0)) * 0.15);
    
    layout.size = Math.max(100, estimatedHeight);
  }, []);
  
  // 反转消息列表以便最新消息在底部展示
  const reversedMessages = useMemo(() => {
    if (!messages || !Array.isArray(messages)) {
      console.warn('messages is not an array');
      return [];
    }
    return [...messages].reverse(); // 创建副本并反转，避免修改原始数据
  }, [messages]);

  // 处理布局事件，初次布局后滚动到底部（对于反转列表是顶部）
  const handleListLayout = useCallback((event: any) => {
    if (isFirstLayoutRef.current && listRef.current && messages.length > 0) {
      console.log('首次布局完成，滚动到最新消息');
      isFirstLayoutRef.current = false;
      
      // 对于反转列表，scrollToOffset({offset: 0}) 会滚动到底部（最新消息）
      setTimeout(() => {
        listRef.current?.scrollToOffset({
          offset: 0,
          animated: false
        });
      }, 100);
    }
  }, [messages.length]);
  
  // 暴露滚动方法给父组件 - 适用于反转列表
  useImperativeHandle(ref, () => ({
    scrollToEnd: (animated: boolean = true) => {
      console.log("外部调用滚动到底部");
      if (listRef.current) {
        // 对于反转列表，滚动到offset 0就是滚动到底部（最新消息）
        listRef.current.scrollToOffset({
          offset: 0,
          animated
        });
      }
    }
  }), []);

  // 当有新消息添加时自动滚动到底部
  useEffect(() => {
    if (shouldScrollToBottom?.current && messages.length > 0 && !isFirstLayoutRef.current) {
      // 检测是否有新消息添加（对于反转列表，是在数组前面添加）
      console.log('检测到新消息，滚动到底部');
      
      // 短暂延迟以确保渲染完成
      setTimeout(() => {
        if (listRef.current) {
          listRef.current.scrollToOffset({
            offset: 0,
            animated: true
          });
        }
      }, 100);
    }
  }, [messages.length, shouldScrollToBottom]);
  
  // 处理滚动到底部按钮点击事件
  const handleScrollToBottomPress = useCallback(() => {
    if (setShouldScrollToBottom) {
      setShouldScrollToBottom(true);
    }
    safeScrollToEnd(true);
  }, [safeScrollToEnd, setShouldScrollToBottom]);
  
  return (
    <View style={styles.container}>
      {hasLoadedAllMessages?.() && messages && messages.length > 0 && (
        <View style={styles.allMessagesLoadedIndicator}>
          <Text style={styles.allMessagesLoadedText}>{i18n.t('chat.allMessagesLoaded')}</Text>
        </View>
      )}
      
      <FlashList
        ref={listRef}
        data={reversedMessages}
        renderItem={renderMessage}
        inverted={true}
        
        // 基本配置
        estimatedItemSize={flashListProps.estimatedItemSize}
        removeClippedSubviews={flashListProps.removeClippedSubviews}
        estimatedListSize={flashListProps.estimatedListSize}
        
        // 高级渲染优化
        drawDistance={flashListProps.drawDistance}
        disableHorizontalListHeightMeasurement={flashListProps.disableHorizontalListHeightMeasurement}
        getItemType={getItemType}
        overrideItemLayout={overrideItemLayout}
        
        // 滚动优化
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={true}
        onLayout={handleListLayout}
        ListFooterComponent={<View style={{height: 30}}></View>}
        contentContainerStyle={{
          paddingVertical: 4,
        }}
        extraData={selectedMessagesStr}
        keyExtractor={(item) => item?.id || `item-${item?.timestamp || Math.random()}`}
        onScroll={handleScroll}
        maintainVisibleContentPosition={flashListProps.maintainVisibleContentPosition}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        overScrollMode="never"
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onViewableItemsChanged={handleViewableItemsChanged}
      />

      <MessageIndicators 
        isLoading={isLoading}
        isGenerating={isGenerating}
        showScrollToBottom={showScrollToBottom && !isGenerating}
        onScrollToBottom={handleScrollToBottomPress}
        onStopGeneration={handleStopGenerationWrapper}
        iconColor={iconColor}
      />

      <ConfirmDialog
        visible={showDeleteDialog}
        title={i18n.t('chat.deleteConfirmTitle')}
        message={i18n.t('chat.deleteConfirmMessage', { count: selectedMessages.size })}
        onConfirm={() => handleDeleteConfirm(selectedMessages)}
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
    position: 'relative', // 确保子元素可以正确定位
  },
  allMessagesLoadedIndicator: {
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allMessagesLoadedText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});

export default memo(MessageList);