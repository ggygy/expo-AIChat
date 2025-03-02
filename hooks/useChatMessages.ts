import { useState, useCallback, useRef, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Message } from '@/constants/chat';
import { messageDb } from '@/database';
import { useBotStore } from '@/store/useBotStore';
import { AppState, AppStateStatus } from 'react-native';

// 定义消息状态的类型，确保与 Message 接口兼容
type MessageStatus = 'sending' | 'streaming' | 'sent' | 'error';

export function useChatMessages(chatId: string, pageSize = 15) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalMessages, setTotalMessages] = useState(0);
  const messagesLengthRef = useRef(0);
  const isFirstLoadRef = useRef(true);
  const isLoadingRef = useRef(false);
  
  // 使用ref来防止重复加载
  const lastFocusTimeRef = useRef(0);
  const appStateRef = useRef(AppState.currentState);
  
  // 从 botStore 获取更新统计数据的方法
  const updateBotStats = useBotStore(state => state.updateBotStats);

  // 新增：记录是否需要滚动到底部
  const shouldScrollToBottom = useRef(true);
  // 新增：记录是否是首次加载更多消息
  const isFirstLoadMore = useRef(true);

  // 加载消息
  const loadMessages = useCallback(async (pageNum: number) => {
    if (isLoadingRef.current || (!hasMore && pageNum > 0)) return;
    
    // 修改防抖逻辑 - 只在非强制加载模式下执行防抖
    const now = Date.now();
    const isRecentLoad = now - lastFocusTimeRef.current < 500;
    
    // 添加强制加载参数，在初次加载时忽略防抖
    const forceLoad = pageNum === 0 && isFirstLoadRef.current;
    
    if (isRecentLoad && pageNum === 0 && !forceLoad) {
      console.log('跳过重复加载 - 时间间隔太短');
      return;
    }
    
    lastFocusTimeRef.current = now;
    
    console.log(`开始加载消息, chatId: ${chatId}, page: ${pageNum}, 强制加载: ${forceLoad}`);
    isLoadingRef.current = true;
    setIsLoading(true);
    
    try {
      // 首先获取消息总数，以便更新机器人统计信息
      const count = await messageDb.getMessageCount(chatId);
      console.log(`消息总数: ${count}`);
      setTotalMessages(count);
      
      // 如果是初始加载且有足够多消息，则直接从最新的消息开始显示
      let offset = pageNum * pageSize;
      if (pageNum === 0 && count > pageSize && isFirstLoadRef.current) {
        offset = Math.max(0, count - pageSize);
        console.log(`首次加载，从偏移量 ${offset} 开始加载最新消息`);
        // 强制设置滚动标志为true
        shouldScrollToBottom.current = true;
      }
      
      const newMessages = await messageDb.getMessages(chatId, pageSize, offset);
      console.log(`从数据库加载到的消息: ${newMessages.length}, 偏移量: ${offset}`);
      
      if (pageNum > 0 && newMessages.length < pageSize) {
        setHasMore(false);
      }
      
      // 确保消息按时间顺序排列
      const validatedMessages = newMessages
        .map(msg => ({
          ...msg,
          role: msg.role as 'user' | 'assistant' | 'system'
        }))
        .sort((a, b) => a.timestamp - b.timestamp);
      
      if (pageNum === 0) {
        console.log('设置初始消息，总数:', validatedMessages.length);
        setMessages(validatedMessages);
        messagesLengthRef.current = validatedMessages.length;
        // 初始加载应该滚动到底部
        shouldScrollToBottom.current = true;
      } else {
        console.log('追加更多消息');
        setMessages(prev => {
          // 检查是否有重复消息并保持顺序
          const existingIds = new Set(prev.map(m => m.id));
          const uniqueMessages = validatedMessages.filter(m => !existingIds.has(m.id));
          
          // 如果是加载更早的消息，则添加到前面
          const newMessages = [...uniqueMessages, ...prev];
          messagesLengthRef.current = newMessages.length;
          
          // 加载更多消息时不应该自动滚动到底部
          shouldScrollToBottom.current = false;
          return newMessages;
        });
        
        // 标记已经进行过一次加载更多操作
        if (isFirstLoadMore.current) {
          isFirstLoadMore.current = false;
        }
      }
      
      setPage(pageNum);
      
      // 更新机器人统计信息
      if (count > 0 && validatedMessages.length > 0) {
        // 获取最新的消息（时间戳最大的）
        const lastMessage = [...validatedMessages].sort((a, b) => b.timestamp - a.timestamp)[0];
        updateBotStats(chatId, {
          messagesCount: count,
          lastMessageAt: lastMessage.timestamp,
          lastMessagePreview: lastMessage.content.substring(0, 50) + (lastMessage.content.length > 50 ? '...' : '')
        });
      }
      
      // 首次加载完成后重置标志
      if (pageNum === 0) {
        isFirstLoadRef.current = false;
      }
    } catch (error) {
      console.error('加载消息失败:', error);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [chatId, hasMore, updateBotStats, pageSize]);
  
  // 处理加载更多消息 - 加载较早的消息（向上加载）
  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoadingRef.current) {
      console.log('加载更多早期消息');
      // 当向上滚动加载更多时，设置不自动滚动到底部
      shouldScrollToBottom.current = false;
      loadMessages(page + 1);
    }
  }, [loadMessages, page, hasMore]);
  
  // 重新加载消息
  const refreshMessages = useCallback(() => {
    isFirstLoadRef.current = true;
    setPage(0);
    setHasMore(true);
    loadMessages(0);
  }, [loadMessages]);
  
  // 监控应用状态变化
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) && 
        nextAppState === 'active'
      ) {
        console.log('应用从后台恢复，刷新消息');
        refreshMessages();
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [refreshMessages]);
  
  // 修改聚焦效果，确保能够加载初始消息
  useFocusEffect(
    useCallback(() => {
      // 强制设置初次加载标志为true，确保消息能被加载
      if (messages.length === 0) {
        console.log('消息列表为空，设置为首次加载');
        isFirstLoadRef.current = true;
      }
      
      if (isFirstLoadRef.current) {
        console.log('首次聚焦，强制加载消息');
        shouldScrollToBottom.current = true;
        // 延迟一点加载以确保组件完全挂载
        setTimeout(() => {
          loadMessages(0);
        }, 50);
      } else {
        console.log('非首次聚焦，跳过消息加载');
      }
      
      return () => {
        console.log('页面失去焦点');
      };
    }, [loadMessages, messages.length])
  );

  // 更新消息列表
  const updateMessages = useCallback((newMessages: Message[]) => {
    setMessages(prev => {
      const filtered = prev.filter(msg => 
        !newMessages.find(m => m.id === msg.id)
      );
      return [...filtered, ...newMessages];
    });
  }, []);
  
  // 添加消息 - 添加新消息时应该滚动到底部
  const appendMessage = useCallback((message: Message) => {
    shouldScrollToBottom.current = true;
    setMessages(prev => [...prev, message]);
  }, []);
  
  // 更新消息状态
  const updateMessageStatus = useCallback((messageId: string, status: MessageStatus, error?: string) => {
    setMessages(prev => prev.map(m => 
      m.id === messageId ? {
        ...m,
        status: status as MessageStatus,
        error
      } : m
    ));
  }, []);

  // 删除消息
  const deleteMessages = useCallback(async (messageIds: string[]) => {
    try {
      await Promise.all(messageIds.map(id => messageDb.deleteMessage(id)));
      setMessages(prev => prev.filter(msg => !messageIds.includes(msg.id)));
      
      // 更新消息总数
      const newTotal = totalMessages - messageIds.length;
      setTotalMessages(newTotal);
      
      // 更新机器人统计
      if (newTotal > 0) {
        const remainingMessages = messages.filter(msg => !messageIds.includes(msg.id));
        if (remainingMessages.length > 0) {
          const lastMessage = remainingMessages[remainingMessages.length - 1];
          updateBotStats(chatId, {
            messagesCount: newTotal,
            lastMessageAt: lastMessage.timestamp,
            lastMessagePreview: lastMessage.content.substring(0, 50) + (lastMessage.content.length > 50 ? '...' : '')
          });
        }
      } else {
        updateBotStats(chatId, {
          messagesCount: 0,
          lastMessageAt: undefined,
          lastMessagePreview: undefined
        });
      }
      
      return true;
    } catch (error) {
      console.error('Failed to delete messages:', error);
      return false;
    }
  }, [messages, totalMessages, updateBotStats, chatId]);

  // 添加一个debug方法，用于检查当前加载的消息
  const debugMessages = useCallback(() => {
    console.log('当前消息列表:', messages);
    return messages;
  }, [messages]);

  // 添加一个强制重新加载的方法
  const forceLoadMessages = useCallback(() => {
    console.log('强制重新加载消息');
    isFirstLoadRef.current = true;
    lastFocusTimeRef.current = 0; // 重置时间戳，确保不会跳过加载
    setPage(0);
    setHasMore(true);
    loadMessages(0);
  }, [loadMessages]);

  // 用这个替代原来的manualRefresh方法
  const manualRefresh = useCallback(() => {
    console.log('手动刷新消息');
    forceLoadMessages();
  }, [forceLoadMessages]);

  // 重置滚动标识
  const setShouldScrollToBottom = useCallback((value: boolean = true) => {
    shouldScrollToBottom.current = value;
  }, []);

  return {
    messages,
    setMessages,
    isLoading,
    hasMore,
    totalMessages,
    setTotalMessages,
    handleLoadMore,
    refreshMessages,
    loadMessages,
    updateMessages,
    appendMessage,
    updateMessageStatus,
    deleteMessages,
    isFirstLoadRef,
    messagesLengthRef,
    debugMessages,
    manualRefresh,
    forceLoadMessages,
    shouldScrollToBottom,
    setShouldScrollToBottom
  };
}