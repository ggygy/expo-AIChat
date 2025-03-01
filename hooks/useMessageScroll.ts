import { useCallback, useEffect, useRef, useState } from 'react';
import { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { FlashList, ViewToken } from '@shopify/flash-list';
import { Message } from '@/constants/chat';

// 定义可见项变更的类型
type ViewableItemsChangedInfo = {
  viewableItems: Array<ViewToken>;
  changed: Array<ViewToken>;
};

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
  const lastScrollY = useRef(0);
  const hasInitialScrolled = useRef(false);
  
  // 滚动到底部方法 - 避免使用scrollToEnd
  const scrollToEnd = useCallback((animated = true) => {
    if (messages.length > 0) {
      try {
        // 使用setTimeout来确保UI已更新
        setTimeout(() => {
          try {
            listRef.current?.scrollToIndex({
              index: Math.max(0, messages.length - 1),
              animated: animated,
              viewOffset: 10 // 确保完全可见
            });
          } catch (innerError) {
            console.warn('滚动索引失败', innerError);
            // FlashList不支持直接使用scrollToEnd，所以使用scrollToIndex
            try {
              // 尝试再次滚动到底部
              setTimeout(() => {
                listRef.current?.scrollToIndex({
                  index: Math.max(0, messages.length - 1),
                  animated: false
                });
              }, 100);
            } catch (error) {
              console.warn('所有滚动方法均失败', error);
            }
          }
        }, 50);
      } catch (error) {
        console.warn('滚动到底部失败', error);
      }
    }
  }, [messages.length, listRef]);
  
  // 初始加载后强制滚动到底部
  useEffect(() => {
    // 只在初次渲染时执行一次
    if (messages.length > 0 && !hasInitialScrolled.current) {
      console.log('执行初次进入页面的滚动到底部');
      hasInitialScrolled.current = true;
      
      // 使用较长的延迟确保列表已完全渲染
      const timer = setTimeout(() => {
        scrollToEnd(false);
        
        // 双保险：再次尝试滚动
        setTimeout(() => {
          scrollToEnd(false);
        }, 300);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [messages.length, scrollToEnd]);
  
  // 在消息列表发生变化时处理自动滚动
  useEffect(() => {
    if (messages.length > prevMessagesLength.current && hasInitialScrolled.current) {
      // 新消息添加时，如果应该滚动到底部则执行
      if (shouldScrollToBottom?.current !== false) {
        const timer = setTimeout(() => {
          scrollToEnd(true);
        }, 100);
        return () => clearTimeout(timer);
      }
    }
    prevMessagesLength.current = messages.length;
  }, [messages.length, shouldScrollToBottom, scrollToEnd]);
  
  // 处理可见项变更
  const handleViewableItemsChanged = useCallback((info: ViewableItemsChangedInfo) => {
    if (!setShouldScrollToBottom || !info.viewableItems || info.viewableItems.length === 0) return;
    
    try {
      const lastItem = info.viewableItems[info.viewableItems.length - 1];
      const lastIndex = lastItem?.index;
      
      if (typeof lastIndex === 'number' && lastIndex === messages.length - 1) {
        setShouldScrollToBottom(true);
      }
    } catch (error) {
      // 忽略可能的类型错误
    }
  }, [messages.length, setShouldScrollToBottom]);
  
  // 处理滚动事件 - 检测是否滚动到底部
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!setShouldScrollToBottom) return;
    
    try {
      const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
      
      // 记录当前滚动位置，用于检测滚动方向
      const currentScrollY = contentOffset.y;
      const isScrollingDown = currentScrollY > lastScrollY.current;
      lastScrollY.current = currentScrollY;
      
      // 检测是否接近底部
      const paddingToBottom = 20;
      const isCloseToBottom = 
        layoutMeasurement && 
        contentSize && 
        contentOffset.y + layoutMeasurement.height >= 
        contentSize.height - paddingToBottom;
      
      // 如果向下滚动到底部，启用自动滚动
      if (isScrollingDown && isCloseToBottom) {
        setShouldScrollToBottom(true);
      }
      // 如果向上滚动，禁用自动滚动
      else if (!isScrollingDown && !isCloseToBottom) {
        setShouldScrollToBottom(false);
      }
    } catch (error) {
      // 忽略可能的空值错误
    }
  }, [setShouldScrollToBottom]);
  
  // 滚动开始事件
  const handleScrollBeginDrag = useCallback(() => {
    setIsScrolling(true);
  }, []);
  
  // 滚动结束事件
  const handleScrollEndDrag = useCallback(() => {
    setIsScrolling(false);
  }, []);
  
  // 滚动动量结束事件
  const handleMomentumScrollEnd = useCallback(() => {
    setIsScrolling(false);
  }, []);
  
  // 优化加载更多消息时的滚动行为
  const handleBeforeLoadMore = useCallback(() => {
    // 向上加载更多消息时，禁用自动滚动到底部
    if (setShouldScrollToBottom) {
      setShouldScrollToBottom(false);
    }
  }, [setShouldScrollToBottom]);
  
  // 预设的viewabilityConfig，避免null引用
  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 100,
    waitForInteraction: false
  };
  
  // 获取 FlashList 特定的配置
  const getFlashListProps = useCallback(() => {
    // FlashList特有的属性
    return {
      estimatedItemSize: 100,
      estimatedListSize: {
        height: 500,
        width: 350
      },
      drawDistance: 200,
      overrideItemLayout: undefined,
      disableAutoLayout: true,
      estimatedFirstItemOffset: 0,
      nestedScrollEnabled: true
    };
  }, []);

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
