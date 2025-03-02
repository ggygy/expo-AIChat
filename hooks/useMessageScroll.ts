import { useCallback, useEffect, useRef, useState } from 'react';
import { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Message } from '@/constants/chat';

// 定义可见项变更的类型
type ViewableItemsChangedInfo = {
  viewableItems: Array<ViewToken>;
  changed: Array<ViewToken>;
};

interface ViewToken {
  item: any;
  key: string;
  index: number | null;
  isViewable: boolean;
  section?: any;
}

/**
 * 消息列表滚动逻辑的Hook
 * @param messages 消息列表
 * @param listRef FlashList的引用
 * @param shouldScrollToBottom 是否应该滚动到底部的引用
 * @param setShouldScrollToBottom 设置是否应该滚动到底部的方法
 * @returns 滚动相关的handlers和状态
 */
export function useMessageScroll(
  messages: Message[],
  listRef: React.RefObject<FlashList<Message>>,
  shouldScrollToBottom?: { current: boolean },
  setShouldScrollToBottom?: (value: boolean) => void
) {
  const [isScrolling, setIsScrolling] = useState(false);
  const prevMessagesLength = useRef(messages.length);
  const lastContentHeight = useRef(0);
  const isUserScrollingRef = useRef(false);
  const hasInitialScrolled = useRef(false);
  const lastScrollY = useRef(0);
  
  // 跟踪最后一条流式消息的内容长度，用于检测变化
  const lastStreamingContentLength = useRef(0);
  // 跟踪上次滚动的时间，用于防抖
  const lastScrollTimeRef = useRef(0);
  
  // 检测是否有流式消息正在更新
  const detectStreamingMessage = useCallback(() => {
    const streamingMessage = messages.find(m => m.status === 'streaming');
    if (streamingMessage) {
      const currentLength = streamingMessage.content.length;
      
      // 如果内容长度增加了，需要滚动
      if (currentLength > lastStreamingContentLength.current) {
        const contentChange = currentLength - lastStreamingContentLength.current;
        lastStreamingContentLength.current = currentLength;
        return { hasChange: true, contentChange };
      }
      
      lastStreamingContentLength.current = currentLength;
      return { hasChange: false, contentChange: 0 };
    }
    return { hasChange: false, contentChange: 0 };
  }, [messages]);
  
  // 滚动到底部方法 - 使用多种策略确保滚动成功
  const scrollToEnd = useCallback((animated = true) => {
    // 如果用户正在手动滚动，不干扰用户操作
    if (isUserScrollingRef.current) {
      return;
    }
    
    // 防抖 - 避免短时间内触发多次滚动
    const now = Date.now();
    if (now - lastScrollTimeRef.current < 150) {
      return; // 忽略过于频繁的滚动请求
    }
    lastScrollTimeRef.current = now;
    
    if (listRef.current && messages.length > 0) {
      // 优先使用滚动到索引，这样更可靠
      try {
        listRef.current.scrollToIndex({
          index: messages.length - 1,
          animated,
          viewPosition: 1.0 // 完全可见
        });
        return;
      } catch (err) {
        console.log('滚动到索引失败，尝试替代方法');
      }
      
      // 备选：滚动到指定偏移量
      try {
        setTimeout(() => {
          listRef.current?.scrollToOffset({
            offset: lastContentHeight.current,
            animated
          });
        }, 10);
      } catch (error) {
        console.warn('所有滚动方法均失败', error);
      }
    }
  }, [messages.length, listRef]);
  
  // 监听消息列表变化的效果，处理自动滚动
  useEffect(() => {
    // 检测流式消息变化
    const { hasChange, contentChange } = detectStreamingMessage();
    
    // 如果有流式消息正在更新且应该滚动到底部
    if (hasChange && contentChange > 20 && shouldScrollToBottom?.current) {
      scrollToEnd(true);
    }
    // 如果消息数量发生变化且应该滚动到底部（如发送新消息）
    else if (messages.length > prevMessagesLength.current && shouldScrollToBottom?.current) {
      scrollToEnd(true);
    }
    
    // 更新消息长度引用
    prevMessagesLength.current = messages.length;
  }, [messages, detectStreamingMessage, scrollToEnd, shouldScrollToBottom]);
  
  // 初始加载时滚动到底部
  useEffect(() => {
    if (messages.length > 0 && !hasInitialScrolled.current) {
      console.log('初始化滚动到底部');
      
      // 延迟滚动以确保列表已渲染
      const timer = setTimeout(() => {
        scrollToEnd(false);
        hasInitialScrolled.current = true;
        
        // 双重保险：再次尝试滚动
        setTimeout(() => {
          scrollToEnd(false);
        }, 300);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [messages.length, scrollToEnd]);
  
  // 处理可见项变更
  const handleViewableItemsChanged = useCallback(({
    viewableItems,
  }: ViewableItemsChangedInfo) => {
    if (!setShouldScrollToBottom || !viewableItems.length) return;
    
    try {
      // 检查最后一条消息是否可见
      const lastVisibleItemIndex = viewableItems[viewableItems.length - 1]?.index;
      if (lastVisibleItemIndex !== null && lastVisibleItemIndex === messages.length - 1) {
        // 如果最后一条消息可见，确保应该自动滚动
        if (!shouldScrollToBottom?.current) setShouldScrollToBottom(true);
      }
    } catch (error) {
      console.error('处理可视项目发生错误:', error);
    }
  }, [messages.length, setShouldScrollToBottom, shouldScrollToBottom]);
  
  // 处理滚动事件
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    
    // 更新内容高度参考
    if (contentSize.height !== lastContentHeight.current) {
      lastContentHeight.current = contentSize.height;
    }
    
    // 跟踪滚动方向
    const currentScrollY = contentOffset.y;
    const isScrollingDown = currentScrollY > lastScrollY.current;
    lastScrollY.current = currentScrollY;
    
    // 检测是否靠近底部
    const distanceFromBottom = 
      contentSize.height - layoutMeasurement.height - contentOffset.y;
    const isNearBottom = distanceFromBottom < layoutMeasurement.height * 0.2; // 是否接近底部20%
    
    // 设置自动滚动标志
    if (setShouldScrollToBottom) {
      if (isScrollingDown && isNearBottom) {
        // 用户向下滚动且接近底部，保持自动滚动
        setShouldScrollToBottom(true);
      } else if (!isScrollingDown && !isNearBottom && isUserScrollingRef.current) {
        // 用户向上滚动且离开底部区域，关闭自动滚动
        setShouldScrollToBottom(false);
      }
    }
  }, [setShouldScrollToBottom]);
  
  // 处理开始拖拽事件
  const handleScrollBeginDrag = useCallback(() => {
    setIsScrolling(true);
    isUserScrollingRef.current = true;
  }, []);
  
  // 处理结束拖拽事件
  const handleScrollEndDrag = useCallback(() => {
    isUserScrollingRef.current = false;
  }, []);
  
  // 处理动量滚动结束事件
  const handleMomentumScrollEnd = useCallback(() => {
    setIsScrolling(false);
    isUserScrollingRef.current = false;
  }, []);
  
  // 处理加载更多之前的操作
  const handleBeforeLoadMore = useCallback(() => {
    if (setShouldScrollToBottom) {
      setShouldScrollToBottom(false);
    }
  }, [setShouldScrollToBottom]);
  
  // 获取FlashList组件的配置属性
  const getFlashListProps = useCallback(() => {
    return {
      maintainVisibleContentPosition: {
        minIndexForVisible: 0,
        autoscrollToTopThreshold: 10
      },
      estimatedItemSize: 150,
      drawDistance: 300,
      disableAutoLayout: false
    };
  }, []);
  
  // 提供viewabilityConfig的默认值，避免为空
  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 100,
    waitForInteraction: false
  };

  return {
    isScrolling,
    scrollToEnd,
    handleViewableItemsChanged,
    handleScroll,
    handleScrollBeginDrag,
    handleScrollEndDrag,
    handleMomentumScrollEnd,
    handleBeforeLoadMore,
    viewabilityConfig,
    hasInitialScrolled,
    getFlashListProps
  };
}
