import { useState, useCallback, useRef, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Message } from '@/constants/chat';
import { messageDb } from '@/database';
import { useBotStore } from '@/store/useBotStore';
import { AppState, AppStateStatus } from 'react-native';

// 定义消息状态的类型，确保与 Message 接口兼容
type MessageStatus = 'sending' | 'streaming' | 'sent' | 'error';

export function useChatMessages(chatId: string, pageSize = 50) {
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

  // 加载消息
  const loadMessages = useCallback(async (pageNum: number) => {
    if (isLoadingRef.current || (!hasMore && pageNum > 0)) return;
    
    // 防止频繁重复加载 - 如果上次加载时间在500ms内，则跳过
    const now = Date.now();
    if (now - lastFocusTimeRef.current < 500 && pageNum === 0) {
      console.log('跳过重复加载');
      return;
    }
    lastFocusTimeRef.current = now;
    
    console.log(`开始加载消息, chatId: ${chatId}, page: ${pageNum}`);
    isLoadingRef.current = true;
    setIsLoading(true);
    
    try {
      // 首先获取消息总数，以便更新机器人统计信息
      const count = await messageDb.getMessageCount(chatId);
      console.log(`消息总数: ${count}`);
      setTotalMessages(count);
      
      const newMessages = await messageDb.getMessages(chatId, pageSize, pageNum * pageSize);
      console.log(`从数据库加载到的消息: ${newMessages.length}`);
      
      if (newMessages.length < pageSize) {
        setHasMore(false);
      }
      
      // 确保消息角色正确
      const validatedMessages = newMessages.map(msg => ({
        ...msg,
        role: msg.role as 'user' | 'assistant' | 'system'
      }));
      
      if (pageNum === 0) {
        console.log('设置初始消息');
        setMessages(validatedMessages);
        messagesLengthRef.current = validatedMessages.length; // 更新消息长度引用
      } else {
        console.log('追加更多消息');
        setMessages(prev => {
          // 检查是否有重复消息
          const existingIds = new Set(prev.map(m => m.id));
          const uniqueMessages = validatedMessages.filter(m => !existingIds.has(m.id));
          const newMessages = [...prev, ...uniqueMessages];
          messagesLengthRef.current = newMessages.length; // 更新消息长度引用
          return newMessages;
        });
      }
      setPage(pageNum);
      
      // 更新机器人统计信息
      if (validatedMessages.length > 0 && count > 0) {
        const lastMessage = validatedMessages[validatedMessages.length - 1];
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
  
  // 处理加载更多消息
  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoadingRef.current) {
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
  
  // 修改聚焦效果仅在首次渲染或显式要求刷新时加载
  useFocusEffect(
    useCallback(() => {
      if (isFirstLoadRef.current) {
        console.log('首次聚焦，加载消息');
        loadMessages(0);
      }
      
      return () => {
        // 只记录日志，不执行其他操作
        console.log('页面失去焦点');
      };
    }, [loadMessages])
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
  
  // 添加消息
  const appendMessage = useCallback((message: Message) => {
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

  // 添加一个手动刷新方法
  const manualRefresh = useCallback(() => {
    console.log('手动刷新消息');
    isFirstLoadRef.current = true;
    refreshMessages();
  }, [refreshMessages]);

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
    manualRefresh
  };
}