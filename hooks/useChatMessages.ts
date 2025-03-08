import { useState, useEffect, useRef, useCallback } from 'react';
import { Message } from '@/constants/chat';
import { messageDb } from '@/database';

/**
 * 消息管理Hook - 使用本地数据库加载消息，添加优化的批量加载和预加载功能
 */
export function useChatMessages(chatId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalMessages, setTotalMessages] = useState(0);
  const isFirstLoadRef = useRef(true);
  const shouldScrollToBottomRef = useRef(true);
  const lastLoadTimestampRef = useRef(0);
  const offsetRef = useRef(0);
  const batchSizeRef = useRef(20); // 每次加载的消息数量
  const isPreloadingRef = useRef(false); // 是否正在预加载
  
  // 初始加载消息
  useEffect(() => {
    let isMounted = true;
    
    const loadInitialMessages = async () => {
      if (!chatId) return;
      
      setIsLoading(true);
      try {
        // 从本地数据库加载消息
        const result = await messageDb.getMessages(chatId, batchSizeRef.current, 0);
        // 使用 getMessageCount 方法获取消息总数，或者根据结果长度确定
        const count = await messageDb.getMessageCount(chatId);
        
        if (isMounted) {
          if (result && result.length > 0) {
            // 修改排序方式：按时间戳升序排序（最旧的消息在前面，最新的在后面）
            const sortedMessages = [...result].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
            setMessages(sortedMessages);
            offsetRef.current = result.length;
          }
          setTotalMessages(count || 0);
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
  
  // 加载更多消息 - 优化版本，从本地数据库加载
  const handleLoadMore = useCallback(async () => {
    if (!chatId || isLoading || isPreloadingRef.current) return;
    
    // 节流控制: 如果距离上次加载不足1秒，则不执行
    const currentTime = Date.now();
    if (currentTime - lastLoadTimestampRef.current < 1000) {
      return;
    }
    
    // 如果没有更多消息可加载，提前返回
    if (messages.length >= totalMessages) {
      return;
    }
    
    isPreloadingRef.current = true;
    setIsLoading(true);
    
    try {
      // 使用requestAnimationFrame执行异步操作，避免阻塞UI
      await new Promise(resolve => requestAnimationFrame(resolve));
      
      const offset = offsetRef.current;
      console.log(`加载更多消息: 偏移=${offset}, 批量大小=${batchSizeRef.current}`);
      
      // 从本地数据库加载更多消息
      const olderMessages = await messageDb.getMessages(chatId, batchSizeRef.current, offset);
      
      // 自适应批量大小：根据加载速度调整
      const loadingTime = Date.now() - currentTime;
      if (loadingTime < 300 && batchSizeRef.current < 40) {
        batchSizeRef.current = Math.min(40, batchSizeRef.current + 5);
      } else if (loadingTime > 1000 && batchSizeRef.current > 15) {
        batchSizeRef.current = Math.max(15, batchSizeRef.current - 5);
      }
      
      if (olderMessages && olderMessages.length > 0) {
        setMessages(oldMessages => {
          // 使用Map去重，避免重复消息
          const messageMap = new Map<string, Message>();
          
          // 先添加现有消息
          oldMessages.forEach(msg => {
            messageMap.set(msg.id, msg);
          });
          
          // 添加新消息，并检查重复
          olderMessages.forEach(msg => {
            if (!messageMap.has(msg.id)) {
              messageMap.set(msg.id, msg);
            }
          });
          
          // 转换回数组并排序 - 修改为按时间戳升序排序
          const newMessages = Array.from(messageMap.values())
            .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
          
          // 更新偏移量
          offsetRef.current += olderMessages.length;
          
          return newMessages;
        });
        
        lastLoadTimestampRef.current = currentTime;
      }
    } catch (error) {
      console.error('加载更多消息失败:', error);
    } finally {
      setIsLoading(false);
      // 延迟重置预加载状态，避免短时间内多次触发
      setTimeout(() => {
        isPreloadingRef.current = false;
      }, 300);
    }
  }, [chatId, isLoading, messages.length, totalMessages]);
  
  // 手动刷新聊天记录
  const manualRefresh = useCallback(async () => {
    if (!chatId) return;
    
    setIsLoading(true);
    offsetRef.current = 0;
    
    try {
      // 重新获取消息总数，使用正确的方法名
      const count = await messageDb.getMessageCount(chatId);
      
      // 重新获取第一批消息
      const result = await messageDb.getMessages(chatId, batchSizeRef.current, 0);
      
      if (result && result.length > 0) {
        // 修改排序方式：按时间戳升序排序
        const sortedMessages = [...result].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        setMessages(sortedMessages);
        offsetRef.current = result.length;
      } else {
        setMessages([]);
      }
      
      setTotalMessages(count || 0);
      lastLoadTimestampRef.current = Date.now();
      shouldScrollToBottomRef.current = true;
    } catch (error) {
      console.error('刷新聊天记录失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [chatId]);
  
  // 删除消息 - 修改返回类型为 Promise<boolean>
  const deleteMessages = useCallback(async (messageIds: string[]): Promise<boolean> => {
    if (!messageIds.length) return true; // 如果没有消息要删除，直接返回成功
    
    try {
      // 乐观更新：立即从UI中移除消息
      setMessages(prevMessages => 
        prevMessages.filter(msg => !messageIds.includes(msg.id))
      );
      
      // 调整总消息数
      setTotalMessages(prev => Math.max(0, prev - messageIds.length));
      
      // 异步删除数据库中的消息
      for (const messageId of messageIds) {
        await messageDb.deleteMessage(messageId);
      }
      
      // 更新偏移量
      offsetRef.current = Math.max(0, offsetRef.current - messageIds.length);
      
      return true; // 删除成功返回 true
    } catch (error) {
      console.error('删除消息失败:', error);
      // 如果删除失败，重新获取最新消息
      manualRefresh();
      return false; // 删除失败返回 false
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
          .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0)); // 修改为按时间戳升序排序
      } else {
        // 否则添加新消息 - 新消息应该添加到数组末尾而不是开头
        return [...prev, message]
          .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0)); // 修改为按时间戳升序排序
      }
    });
    
    // 增加总消息计数
    setTotalMessages(prev => prev + 1);
    
    // 增加偏移量
    offsetRef.current += 1;
  }, []);
  
  // 设置是否应该滚动到底部
  const setShouldScrollToBottom = useCallback((value: boolean) => {
    shouldScrollToBottomRef.current = value;
  }, []);
  
  // 启用预加载的函数，可以由组件调用
  const enablePreloading = useCallback(() => {
    if (isPreloadingRef.current || isLoading || messages.length >= totalMessages) return;
    
    isPreloadingRef.current = true;
    
    // 执行预加载
    const preload = async () => {
      try {
        if (messages.length < totalMessages) {
          await handleLoadMore();
        }
      } catch (error) {
        console.error('预加载失败:', error);
      } finally {
        isPreloadingRef.current = false;
      }
    };
    
    preload();
  }, [handleLoadMore, isLoading, messages.length, totalMessages]);
  
  return {
    messages,
    setMessages,
    isLoading,
    handleLoadMore,
    totalMessages,
    setTotalMessages,
    deleteMessages,
    addMessage,
    isFirstLoadRef,
    manualRefresh,
    shouldScrollToBottom: shouldScrollToBottomRef,
    setShouldScrollToBottom,
    enablePreloading,
  };
}