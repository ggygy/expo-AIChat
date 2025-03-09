import { useCallback, useRef } from 'react';
import { Message } from '@/constants/chat';

type MessageUpdateCallback = (messages: Message[]) => void;

export function useMessageProcessor() {
  // UI更新控制
  const lastUpdateTimeRef = useRef<number>(0);
  const pendingUpdateRef = useRef<{messages: Message[], callback: MessageUpdateCallback} | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // 清除更新间隔
  const clearUpdateInterval = useCallback(() => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
  }, []);

  // 使用节流方式更新UI，确保UI保持响应
  const scheduleUiUpdate = useCallback((messages: Message[], callback: MessageUpdateCallback) => {
    const now = Date.now();
    // 存储最新的消息
    pendingUpdateRef.current = { messages, callback };
    
    // 如果没有定时器在运行，则创建一个
    if (!updateIntervalRef.current) {
      console.log('创建UI更新定时器');
      updateIntervalRef.current = setInterval(() => {
        // 如果有待更新的消息，则执行更新
        if (pendingUpdateRef.current) {
          const { messages, callback } = pendingUpdateRef.current;
          // 执行回调前清空待更新内容，避免循环引用问题
          pendingUpdateRef.current = null;
          lastUpdateTimeRef.current = Date.now();
          
          // 使用requestAnimationFrame以确保在渲染帧中执行更新
          requestAnimationFrame(() => {
            try {
              // 创建深拷贝以防止引用问题
              const messagesCopy = messages.map(m => ({...m}));
              callback(messagesCopy);
            } catch (error) {
              console.error('UI更新回调执行失败:', error);
            }
          });
        } else {
          clearUpdateInterval();
        }
      }, 100); // 降至100ms，提高更新频率
    }
    
    // 降低强制更新的间隔，避免过于频繁但又确保UI及时更新
    if (now - lastUpdateTimeRef.current > 150) { // 降低到150ms
      // 避免循环引用，先清空待更新内容
      pendingUpdateRef.current = null;
      lastUpdateTimeRef.current = now;
      
      // 使用requestAnimationFrame确保在渲染帧中进行更新
      requestAnimationFrame(() => {
        try {
          // 创建深拷贝以防止引用问题
          const messagesCopy = messages.map(m => ({...m}));
          callback(messagesCopy);
        } catch (error) {
          console.error('强制UI更新回调执行失败:', error);
        }
      });
    }
  }, [clearUpdateInterval]);
  
  return {
    scheduleUiUpdate,
    updateIntervalRef,
    clearUpdateInterval
  };
}
