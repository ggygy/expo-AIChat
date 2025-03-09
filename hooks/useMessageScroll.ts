import { useCallback, useState, useRef, useEffect } from 'react';
import { FlashList } from '@shopify/flash-list';
import { Message } from '@/constants/chat';
import { getScrollDelay, needsSpecialScrollHandling } from '@/utils/platformFixes';

/**
 * 消息列表滚动处理 Hook
 * 统一管理滚动状态、滚动事件和加载更多逻辑
 */
export const useMessageScroll = (
  messages: Message[],
  listRef: React.RefObject<FlashList<Message>>,
  shouldScrollToBottom?: { current: boolean },
  setShouldScrollToBottom?: (value: boolean) => void,
) => {
  // 滚动状态跟踪
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadMoreCallbackRef = useRef<(() => void) | null>(null);
  const isScrollingInProgressRef = useRef(false);
  const viewableItemsRef = useRef<any[]>([]);
  const initialScrollCompletedRef = useRef(false);
  const lastContentOffsetY = useRef(0);
  const lastScrollEventTime = useRef(0);
  
  // 预加载和节流控制相关的状态
  const isLoadingMoreRef = useRef(false);
  const lastLoadMoreTimeRef = useRef(0);
  const scrollPositionRef = useRef(0);
  const loadMoreThresholdRef = useRef(0.7); // 当滚动到前70%时触发预加载
  const loadThrottleTimeRef = useRef(1000); // 1秒节流时间
  
  // 初始布局完成标志
  const initialLayoutCompletedRef = useRef(false);
  
  // 检查是否正在滚动
  const isScrollingInProgress = useCallback(() => {
    return isScrollingInProgressRef.current;
  }, []);
  
  // 设置加载更多的回调函数
  const setLoadMoreCallback = useCallback((callback: () => void) => {
    loadMoreCallbackRef.current = callback;
  }, []);
  
  // 处理向上滚动加载更多的前置检查
  const handleBeforeLoadMore = useCallback(() => {
    // 如果已初始化完成且没有正在滚动，可以执行加载更多
    if (initialScrollCompletedRef.current && !isScrollingInProgressRef.current) {
      return true;
    }
    return false;
  }, []);
  
  // 安全的滚动执行器，处理多种错误情况
  const safeScrollToEnd = useCallback((animated: boolean = true) => {
    try {
      // 使用双重保护机制确保安全滚动
      if (!listRef.current) {
        console.log('scrollToEnd取消：列表不存在');
        return;
      }
      
      // 获取基于平台的延迟时间
      const scrollDelay = getScrollDelay(animated);
      
      // 延迟执行滚动，确保UI已经完成渲染
      setTimeout(() => {
        if (!listRef.current) return;
        
        try {
          const flashList = listRef.current;
          
          // 平台特定处理
          if (needsSpecialScrollHandling()) {
            console.log('使用平台特定滚动逻辑');
            // 部分平台在滚动前需要重新确认渲染完成
            setTimeout(() => {
              try {
                if (flashList && typeof flashList.scrollToEnd === 'function') {
                  flashList.scrollToEnd({ animated });
                }
              } catch (e) {
                console.error('平台特定滚动失败:', e);
              }
            }, 100);
            return;
          }
          
          // 标准处理
          if (typeof flashList.scrollToEnd !== 'function') {
            console.log('FlashList不支持scrollToEnd方法');
            return;
          }
          
          // 使用requestAnimationFrame确保在渲染循环中执行
          requestAnimationFrame(() => {
            try {
              // 最后一层安全检查
              if (flashList && typeof flashList.scrollToEnd === 'function') {
                flashList.scrollToEnd({ animated });
                console.log('安全滚动成功执行');
              }
            } catch (innerError) {
              console.error('最终滚动执行失败:', innerError);
            }
          });
        } catch (timeoutError) {
          console.error('滚动超时处理失败:', timeoutError);
        }
      }, scrollDelay);
    } catch (outerError) {
      console.error('准备安全滚动失败:', outerError);
    }
  }, [listRef]);
  
  // 处理滚动事件 - 支持预加载
  const handleScroll = useCallback((event: any) => {
    const currentTime = Date.now();
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    
    // 保存当前滚动位置，用于预加载计算
    scrollPositionRef.current = contentOffset.y;
    
    // 节流滚动处理，避免过于频繁的状态更新
    if (currentTime - lastScrollEventTime.current < 16) {
      return;
    }
    
    lastScrollEventTime.current = currentTime;
    
    // 记录内容偏移量用于判断滚动方向
    lastContentOffsetY.current = contentOffset.y;
    
    // 更新滚动状态
    setIsScrolling(true);
    
    // 预加载逻辑：检测是否滚动到了需要预加载的位置
    if (contentOffset.y <= contentSize.height * (1 - loadMoreThresholdRef.current) && 
        !isLoadingMoreRef.current &&
        currentTime - lastLoadMoreTimeRef.current > loadThrottleTimeRef.current) {
      
      // 满足预加载条件，触发加载
      handlePreloadMore();
    }
    
    // 清除之前的超时
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // 设置新的超时来延迟重置滚动状态
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, []);
  
  // 预加载处理函数
  const handlePreloadMore = useCallback(() => {
    if (loadMoreCallbackRef.current && !isLoadingMoreRef.current) {
      console.log('触发预加载');
      isLoadingMoreRef.current = true;
      lastLoadMoreTimeRef.current = Date.now();
      
      // 调用加载回调
      try {
        loadMoreCallbackRef.current();
        
        // 设置加载完成的延迟，防止短时间内重复触发
        setTimeout(() => {
          isLoadingMoreRef.current = false;
        }, loadThrottleTimeRef.current);
      } catch (error) {
        console.error('加载更多消息失败:', error);
        isLoadingMoreRef.current = false;
      }
    }
  }, []);
  
  // 滚动开始拖动
  const handleScrollBeginDrag = useCallback(() => {
    isScrollingInProgressRef.current = true;
    setIsScrolling(true);
    
    // 用户主动滚动时，可以取消自动滚动到底部
    if (setShouldScrollToBottom && shouldScrollToBottom?.current) {
      setShouldScrollToBottom(false);
    }
  }, [setShouldScrollToBottom, shouldScrollToBottom]);
  
  // 滚动结束拖动
  const handleScrollEndDrag = useCallback(() => {
    // 设置短暂延迟再标记滚动结束，以处理滚动惯性
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
  
  // 可视项发生变化
  const handleViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    viewableItemsRef.current = viewableItems;
    
    // 检查是否已滚动到底部
    if (viewableItems.length && messages.length > 0) {
      const lastVisibleItem = viewableItems[viewableItems.length - 1];
      const isLastMessageVisible = lastVisibleItem?.item?.id === messages[messages.length - 1]?.id;
      
      // 如果最后一条消息可见，自动启用"滚动到底部"
      if (isLastMessageVisible && setShouldScrollToBottom && !shouldScrollToBottom?.current) {
        setShouldScrollToBottom(true);
      }
    }
  }, [messages, setShouldScrollToBottom, shouldScrollToBottom]);
  
  // 列表布局完成
  const handleLayout = useCallback(() => {
    // 添加防抖保护，避免多次触发
    if (!initialLayoutCompletedRef.current) {
      console.log('准备首次布局滚动...');
      
      // 给列表一些时间进行渲染，使用更长的延时以确保布局完全完成
      setTimeout(() => {
        try {
          if (listRef.current && !initialLayoutCompletedRef.current) {
            console.log('首次布局完成后滚动到底部');
            // 使用安全滚动方法而不是直接调用scrollToEnd
            safeScrollToEnd(false);
            // 即使有错误，也标记初始布局已完成，避免重复尝试
            initialLayoutCompletedRef.current = true;
            console.log('初始滚动过程完成');
          }
        } catch (error) {
          console.error('初始滚动执行失败:', error);
          // 即使出错也标记为已完成，避免重复触发
          initialLayoutCompletedRef.current = true;
        }
      }, 3000); // 增加延迟时间到3000ms，确保布局完成
    }
  }, [safeScrollToEnd, listRef]);
  
  // 优化加载更多处理函数
  const handleLoadMore = useCallback(() => {
    // 当前时间
    const currentTime = Date.now();
    
    // 如果距离上次加载时间小于节流时间，则跳过
    if (currentTime - lastLoadMoreTimeRef.current < loadThrottleTimeRef.current) {
      return;
    }
    
    // 如果正在加载或初始化未完成，跳过
    if (isLoadingMoreRef.current || !initialScrollCompletedRef.current) {
      return;
    }
    
    if (loadMoreCallbackRef.current) {
      console.log('触发onEndReached的加载更多');
      isLoadingMoreRef.current = true;
      lastLoadMoreTimeRef.current = currentTime;
      
      try {
        loadMoreCallbackRef.current();
        
        // 设置加载完成的延迟，防止短时间内重复触发
        setTimeout(() => {
          isLoadingMoreRef.current = false;
        }, loadThrottleTimeRef.current);
      } catch (error) {
        console.error('加载更多消息失败:', error);
        isLoadingMoreRef.current = false;
      }
    }
  }, []);
  
  // 统一的滚动处理函数，处理消息更新引起的滚动
  const handleMessagesChanged = useCallback(() => {
    // 如果初始布局已完成但消息列表为空，就不进行处理
    if (initialLayoutCompletedRef.current && messages.length === 0) {
      return;
    }
    
    // 如果初始布局尚未完成，这说明是首次加载，让 handleLayout 处理滚动
    if (!initialLayoutCompletedRef.current) {
      console.log('初始布局尚未完成，消息变化不触发滚动');
      return;
    }
    
    // 增加时间间隔控制，减少日志和滚动次数
    const now = Date.now();
    const timeSinceLastScroll = now - lastScrollEventTime.current;
    
    // 降低滚动间隔阈值，使消息流更新时滚动更加及时
    if (timeSinceLastScroll < 300) { // 300ms的节流间隔
      return;
    }
    
    console.log('检测到消息更新，准备滚动');
    
    // 当滚动标志为真且距离上次滚动超过阈值时才触发滚动
    if (shouldScrollToBottom?.current) {
      lastScrollEventTime.current = now;
      
      // 使用定时器延迟滚动，确保UI更新完成
      setTimeout(() => {
        if (!isScrollingInProgressRef.current) {
          // 使用安全滚动方法
          safeScrollToEnd(true);
        }
      }, 100);
    }
  }, [messages, shouldScrollToBottom, safeScrollToEnd, isScrollingInProgressRef]);
  
  // 监听消息列表变化
  const messageChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    // 防止在流式返回时重复执行初始化逻辑
    if (messages.length > 0 && !initialLayoutCompletedRef.current) {
      console.log('初次加载消息，将在布局完成后处理滚动');
    } else if (initialLayoutCompletedRef.current) {
      // 使用防抖处理消息变化，减少频繁触发
      if (messageChangeTimeoutRef.current) {
        clearTimeout(messageChangeTimeoutRef.current);
      }
      
      messageChangeTimeoutRef.current = setTimeout(() => {
        handleMessagesChanged();
        messageChangeTimeoutRef.current = null;
      }, 100); // 100ms的防抖延迟
    }
  }, [messages.length, handleMessagesChanged]);

  // 允许外部设置预加载阈值
  const setLoadMoreThreshold = useCallback((threshold: number) => {
    if (threshold >= 0 && threshold <= 1) {
      loadMoreThresholdRef.current = threshold;
    }
  }, []);
  
  // 允许外部设置节流时间
  const setLoadThrottleTime = useCallback((time: number) => {
    if (time > 0) {
      loadThrottleTimeRef.current = time;
    }
  }, []);
  
  // 返回 FlashList 需要的配置
  const getFlashListProps = useCallback(() => {
    return {
      estimatedItemSize: 100,  // 估计每个消息的高度
      drawDistance: 1500,      // 增加预渲染距离，提高滚动体验
      maintainVisibleContentPosition: {
        minIndexForVisible: 0,
        autoscrollToTopThreshold: 10
      },
      onEndReachedThreshold: 0.3, // 提前触发加载更多
    };
  }, []);
  
  // FlashList 的可视性配置
  const viewAbilityConfig = {
    itemVisiblePercentThreshold: 50,  // 项目可见度阈值
    minimumViewTime: 300,             // 最小可见时间
  };
  
  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (messageChangeTimeoutRef.current) {
        clearTimeout(messageChangeTimeoutRef.current);
      }
    };
  }, []);

  return {
    isScrolling,
    safeScrollToEnd,
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
    handleLoadMore,
    setLoadMoreCallback,
    handlePreloadMore,
    setLoadMoreThreshold,
    setLoadThrottleTime,
    isLoadingMore: () => isLoadingMoreRef.current,
    handleMessagesChanged,
    initialLayoutCompletedRef,
  };
};
