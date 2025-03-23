import { useCallback, useState, useRef, useEffect } from 'react';
import { FlashList } from '@shopify/flash-list';
import { Message } from '@/constants/chat';
import { getScrollDelay } from '@/utils/platformFixes';

/**
 * 消息列表滚动处理 Hook - 优化版本，适用于反转列表
 */
export const useMessageScroll = (
  messages: Message[],
  listRef: React.RefObject<FlashList<Message>>,
  shouldScrollToBottom?: { current: boolean },
  setShouldScrollToBottom?: (value: boolean) => void,
) => {
  // 滚动状态跟踪
  const [isScrolling, setIsScrolling] = useState(false);
  // 控制"滚动到底部"按钮显示状态
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isScrollingInProgressRef = useRef(false);
  const viewableItemsRef = useRef<any[]>([]);
  const initialScrollCompletedRef = useRef(false);
  const lastScrollEventTime = useRef(0);
  
  // 简化后的安全滚动到底部方法 - 适用于反转列表
  const safeScrollToEnd = useCallback((animated: boolean = true) => {
    try {
      if (!listRef.current) return;

      // 对于反转列表，滚动到顶部即是滚动到最新消息
      setTimeout(() => {
        if (!listRef.current) return;
        
        try {
          // 使用scrollToOffset而非scrollToEnd，更可靠
          listRef.current.scrollToOffset({
            offset: 0,
            animated
          });
        } catch (error) {
          console.error('滚动执行失败:', error);
        }
      }, getScrollDelay(animated));
    } catch (error) {
      console.error('滚动准备失败:', error);
    }
  }, [listRef]);
  
  // 处理滚动事件 - 简化版，只检测是否显示"滚动到底部"按钮
  const handleScroll = useCallback((event: any) => {
    const { contentOffset, layoutMeasurement } = event.nativeEvent;
    
    // 对于反转列表，offset > 0 表示已经滚动离开了最新消息区域
    // 当滚动超过一定距离时显示"滚动到底部"按钮
    const showButton = contentOffset.y > layoutMeasurement.height * 0.3;
    setShowScrollToBottom(showButton);
    
    // 节流滚动处理
    const currentTime = Date.now();
    if (currentTime - lastScrollEventTime.current < 16) {
      return;
    }
    
    lastScrollEventTime.current = currentTime;
    setIsScrolling(true);
    
    // 清除之前的超时
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // 设置新的超时来延迟重置滚动状态
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, []);
  
  // 滚动开始拖动
  const handleScrollBeginDrag = useCallback(() => {
    isScrollingInProgressRef.current = true;
    setIsScrolling(true);
    
    // 用户主动滚动时，取消自动滚动到底部
    if (setShouldScrollToBottom && shouldScrollToBottom?.current) {
      setShouldScrollToBottom(false);
    }
  }, [setShouldScrollToBottom, shouldScrollToBottom]);
  
  // 滚动结束拖动
  const handleScrollEndDrag = useCallback(() => {
    setTimeout(() => {
      isScrollingInProgressRef.current = false;
      setIsScrolling(false);
    }, 300);
  }, []);
  
  // 滚动动量结束
  const handleMomentumScrollEnd = useCallback(() => {
    isScrollingInProgressRef.current = false;
    setIsScrolling(false);
    initialScrollCompletedRef.current = true;
  }, []);
  
  // 可视项发生变化 - 简化版本，仅检测是否位于最新消息处
  const handleViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    viewableItemsRef.current = viewableItems;
    
    if (viewableItems.length && messages.length > 0 && setShouldScrollToBottom) {
      // 对于反转列表，检查第一条消息是否在可视范围内（即最新消息）
      const isAtBottom = viewableItems.some(
        (item: any) => item.item?.id === messages[messages.length - 1].id
      );
      
      // 当最新消息可见时，更新shouldScrollToBottom并隐藏按钮
      if (isAtBottom) {
        if (!shouldScrollToBottom?.current) {
          setShouldScrollToBottom(true);
        }
        setShowScrollToBottom(false);
      }
    }
  }, [messages, setShouldScrollToBottom, shouldScrollToBottom]);
  
  // 简化的布局处理函数 - 仅在首次布局时滚动到最新消息
  const handleLayout = useCallback(() => {
    if (!initialScrollCompletedRef.current && messages.length > 0) {
      setTimeout(() => {
        if (listRef.current) {
          // 对于反转列表，滚动到offset 0即可显示最新消息
          listRef.current.scrollToOffset({ offset: 0, animated: false });
          initialScrollCompletedRef.current = true;
        }
      }, 100);
    }
  }, [listRef, messages.length]);
  
  // 统一的滚动处理函数 - 简化版本
  const handleMessagesChanged = useCallback(() => {
    if (!initialScrollCompletedRef.current || messages.length === 0) {
      return;
    }
    
    // 当新消息添加且应该滚动到底部时，执行滚动
    if (shouldScrollToBottom?.current && !isScrollingInProgressRef.current) {
      safeScrollToEnd(true);
    }
  }, [messages.length, shouldScrollToBottom, safeScrollToEnd]);
  
  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // 返回更精简的API
  return {
    isScrolling,
    showScrollToBottom,
    safeScrollToEnd,
    handleViewableItemsChanged,
    handleScroll,
    handleScrollBeginDrag,
    handleScrollEndDrag,
    handleMomentumScrollEnd,
    isScrollingInProgress: () => isScrollingInProgressRef.current,
    handleLayout,
    handleMessagesChanged,
    // 基本视图配置
    viewAbilityConfig: {
      itemVisiblePercentThreshold: 50,
      minimumViewTime: 300,
    },
    // 必要的FlashList属性
    getFlashListProps: () => ({
      estimatedItemSize: 100,
      maintainVisibleContentPosition: {
        minIndexForVisible: 0,
        autoscrollToTopThreshold: 10
      },
    }),
  };
};
