import { useState, useEffect, useRef, useCallback } from 'react';
import { Message } from '@/constants/chat';
import { messageDb } from '@/database';

/**
 * 消息管理Hook - 适配反转列表的消息加载逻辑
 */
export function useChatMessages(chatId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalMessages, setTotalMessages] = useState(0);
  const isFirstLoadRef = useRef(true);
  const shouldScrollToBottomRef = useRef(true);
  const lastLoadTimestampRef = useRef(0);
  const initialBatchSizeRef = useRef(15); // 初始加载的消息数量（最新的几条）
  const regularBatchSizeRef = useRef(10); // 常规加载批次大小
  const isPreloadingRef = useRef(false); // 是否正在预加载
  
  // 分页相关状态
  const currentPageRef = useRef(1);
  const allMessagesLoadedRef = useRef(false);
  
  // 初始加载最新的几条消息
  useEffect(() => {
    let isMounted = true;
    
    const loadInitialMessages = async () => {
      if (!chatId) return;
      
      setIsLoading(true);
      try {
        // 获取消息总数
        const count = await messageDb.getMessageCount(chatId);
        setTotalMessages(count || 0);
        
        if (count === 0) {
          setMessages([]);
          return;
        }
        
        // 计算从末尾开始的偏移量
        const offset = Math.max(0, count - initialBatchSizeRef.current);
        console.log(`初始加载最新消息: 总数=${count}, 偏移=${offset}, 数量=${initialBatchSizeRef.current}`);
        
        // 加载最新的 N 条消息
        const result = await messageDb.getMessages(chatId, initialBatchSizeRef.current, offset);
        
        if (isMounted) {
          if (result && result.length > 0) {
            // 排序 - 保持时间戳升序排序，从旧到新
            const sortedMessages = [...result].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
            setMessages(sortedMessages);
            
            // 重置页码
            currentPageRef.current = 1;
            
            // 判断是否已加载所有消息
            allMessagesLoadedRef.current = (offset === 0);
          }
          lastLoadTimestampRef.current = Date.now();
        }
      } catch (error) {
        console.error('加载聊天消息失败:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadInitialMessages();
    
    return () => {
      isMounted = false;
    };
  }, [chatId]);
  
  // 加载更多历史消息 - 适用于反转列表的上拉加载逻辑
  const loadMoreMessages = useCallback(async () => {
    if (!chatId || isLoading || isPreloadingRef.current || allMessagesLoadedRef.current) {
      console.log(`加载取消: ${isLoading ? '正在加载' : isPreloadingRef.current ? '正在预加载' : '已加载所有消息'}`);
      return false;
    }
    
    // 节流控制: 如果距离上次加载不足1秒，则不执行
    const currentTime = Date.now();
    if (currentTime - lastLoadTimestampRef.current < 100) {
      console.log('加载节流: 上次加载时间太近');
      return false;
    }
    
    console.log(`开始加载更早消息: 页码=${currentPageRef.current + 1}`);
    isPreloadingRef.current = true;
    setIsLoading(true);
    
    try {
      // 计算偏移量和批次大小，针对反转列表
      const currentCount = messages.length;
      const offset = Math.max(0, currentCount - (currentPageRef.current + 1) * regularBatchSizeRef.current);
      const batchSize = regularBatchSizeRef.current;
      
      console.log(`加载更早消息: 偏移=${offset}, 批量大小=${batchSize}`);
      
      // 获取更早的消息
      const olderMessages = await messageDb.getMessages(chatId, batchSize, offset);
      console.log(`成功加载${olderMessages?.length || 0}条更早消息`);
      
      // 如果获取到了消息
      if (olderMessages && olderMessages.length > 0) {
        setMessages(oldMessages => {
          // 使用Map去重，避免重复消息
          const messageMap = new Map<string, Message>();
          
          // 先添加现有消息
          oldMessages.forEach(msg => {
            messageMap.set(msg.id, msg);
          });
          
          // 再添加新消息
          olderMessages.forEach(msg => {
            if (!messageMap.has(msg.id)) {
              messageMap.set(msg.id, msg);
            }
          });
          
          // 转换回数组并排序 - 保持升序排序
          return Array.from(messageMap.values())
            .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        });
        
        // 更新页码
        currentPageRef.current += 1;
        
        // 判断是否已加载所有消息
        if (offset <= batchSize) {
          allMessagesLoadedRef.current = true;
          console.log('已加载所有历史消息');
        }
        
        lastLoadTimestampRef.current = currentTime;
        return true;
      } else {
        // 没有更多消息可加载
        allMessagesLoadedRef.current = true;
        console.log('没有更多历史消息');
        return false;
      }
    } catch (error) {
      console.error('加载更多消息失败:', error);
      return false;
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        isPreloadingRef.current = false;
      }, 300);
    }
  }, [chatId, isLoading, messages.length]);
  
  // 手动刷新聊天记录 - 保持与原来逻辑兼容
  const manualRefresh = useCallback(async () => {
    if (!chatId) return;
    
    setIsLoading(true);
    // 重置所有偏移量和状态
    currentPageRef.current = 1;
    allMessagesLoadedRef.current = false;
    
    try {
      // 重新获取消息总数
      const count = await messageDb.getMessageCount(chatId);
      setTotalMessages(count || 0);
      
      if (count === 0) {
        setMessages([]);
        return;
      }
      
      // 计算从末尾开始的偏移量
      const offset = Math.max(0, count - initialBatchSizeRef.current);
      
      // 加载最新的 N 条消息
      const result = await messageDb.getMessages(chatId, initialBatchSizeRef.current, offset);
      
      if (result && result.length > 0) {
        // 按时间戳升序排序
        const sortedMessages = [...result].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        setMessages(sortedMessages);
        
        // 更新页码
        currentPageRef.current = 1;
        
        // 检查是否已加载所有消息
        allMessagesLoadedRef.current = (offset === 0);
      } else {
        setMessages([]);
      }
      
      lastLoadTimestampRef.current = Date.now();
      shouldScrollToBottomRef.current = true;
    } catch (error) {
      console.error('刷新聊天记录失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [chatId]);
  
  // 删除消息
  const deleteMessages = useCallback(async (messageIds: string[]): Promise<boolean> => {
    if (!messageIds.length) return true;
    
    try {
      // 乐观更新：立即从UI中移除消息
      setMessages(prevMessages => 
        prevMessages.filter(msg => !messageIds.includes(msg.id))
      );
      
      // 调整总消息数和偏移量
      const deletedCount = messageIds.length;
      setTotalMessages(prev => Math.max(0, prev - deletedCount));
      
      // 异步删除数据库中的消息
      for (const messageId of messageIds) {
        await messageDb.deleteMessage(messageId);
      }
      
      return true;
    } catch (error) {
      console.error('删除消息失败:', error);
      // 如果删除失败，重新获取最新消息
      manualRefresh();
      return false;
    }
  }, [chatId, manualRefresh]);
  
  // 添加单条消息到列表
  const addMessage = useCallback((message: Message) => {
    setMessages(prev => {
      // 检查消息是否已存在
      const exists = prev.some(m => m.id === message.id);
      if (exists) {
        // 如果消息已存在，则更新它
        return prev.map(m => m.id === message.id ? message : m)
          .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      } else {
        // 添加新消息并排序
        return [...prev, message]
          .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      }
    });
    
    // 增加总消息计数
    setTotalMessages(prev => prev + 1);
  }, []);
  
  // 设置是否应该滚动到底部
  const setShouldScrollToBottom = useCallback((value: boolean) => {
    shouldScrollToBottomRef.current = value;
  }, []);
  
  // 启用预加载
  const enablePreloading = useCallback(() => {
    if (isPreloadingRef.current || isLoading || allMessagesLoadedRef.current) return;
    
    isPreloadingRef.current = true;
    
    // 执行预加载
    const preload = async () => {
      try {
        if (!allMessagesLoadedRef.current) {
          await loadMoreMessages();
        }
      } catch (error) {
        console.error('预加载失败:', error);
      } finally {
        isPreloadingRef.current = false;
      }
    };
    
    preload();
  }, [loadMoreMessages, isLoading]);
  
  // 检查是否已加载所有消息
  const hasLoadedAllMessages = useCallback(() => {
    return allMessagesLoadedRef.current;
  }, []);
  
  return {
    messages,
    setMessages,
    isLoading,
    onLoadMore: loadMoreMessages,
    totalMessages,
    setTotalMessages,
    deleteMessages,
    addMessage,
    isFirstLoadRef,
    manualRefresh,
    shouldScrollToBottom: shouldScrollToBottomRef,
    setShouldScrollToBottom,
    enablePreloading,
    hasLoadedAllMessages,
  };
}