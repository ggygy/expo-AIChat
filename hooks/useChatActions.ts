import { useCallback } from 'react';
import { Message, Role } from '@/constants/chat';
import { messageDb } from '@/database';
import { useAIChat } from '@/hooks/useAIChat';
import { useBotStore } from '@/store/useBotStore';
import i18n from '@/i18n/i18n';

// 定义消息状态的类型
type MessageStatus = 'sending' | 'streaming' | 'sent' | 'error';

export function useChatActions(
  chatId: string,
  messages: Message[],
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void,
  totalMessages: number,
  setTotalMessages: (count: number | ((prev: number) => number)) => void,
  addMessage?: (message: Message) => void // 新增可选参数
) {
  const { 
    sendMessage, 
    isGenerating, 
    setIsGenerating,
    stopGeneration
  } = useAIChat(chatId);
  const updateBotStats = useBotStore(state => state.updateBotStats);

  // 发送新消息
  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return false;
    
    console.log('准备发送消息:', text.substring(0, 30) + (text.length > 30 ? '...' : ''));
    
    // 创建用户消息对象
    const userMessage: Message = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      contentType: 'text',
      status: 'sent'
    };
    
    try {
      // 立即添加用户消息到UI
      console.log('添加用户消息到UI, ID:', userMessage.id);
      setMessages(prev => [...prev, userMessage]);
      
      // 更新消息总数，即使在调用sendMessage之前
      const newTotal = totalMessages + 1;
      setTotalMessages(newTotal);
      
      // 更新机器人统计
      updateBotStats(chatId, {
        messagesCount: newTotal,
        lastMessageAt: userMessage.timestamp,
        lastMessagePreview: text.substring(0, 50) + (text.length > 50 ? '...' : '')
      });

      // 发送消息并处理响应 - 使用队列处理机制确保UI更新顺序性
      console.log('调用sendMessage处理对话');
      let lastUpdateTime = Date.now();
      const pendingUpdates = new Map<string, Message>(); // 消息ID -> 最新消息状态
      
      const success = await sendMessage(userMessage, async (updatedMessages) => {
        try {
          console.log('收到消息更新:', 
            updatedMessages.map(m => `${m.role}:${m.id.substring(0, 8)}`).join(','));
          
          // 确保消息有正确的角色
          const validatedMessages: Message[] = updatedMessages.map(msg => ({
            ...msg,
            role: msg.id.startsWith('user') ? 'user' as Role : 'assistant' as Role
          }));
          
          // 对每条消息进行处理，存入pendingUpdates
          validatedMessages.forEach(msg => {
            pendingUpdates.set(msg.id, msg);
          });
          
          // 节流处理，每120ms最多更新一次UI
          const now = Date.now();
          if (now - lastUpdateTime >= 120) {
            lastUpdateTime = now;
            
            // 使用requestAnimationFrame确保在下一帧进行更新
            requestAnimationFrame(() => {
              if (pendingUpdates.size > 0) {
                // 获取待更新消息并清空队列
                const messagesToUpdate = Array.from(pendingUpdates.values());
                pendingUpdates.clear();
                
                // 更新UI
                setMessages(prev => {
                  // 创建一个ID -> 消息映射
                  const messageMap = new Map<string, Message>();
                  
                  // 先加入现有消息
                  prev.forEach(m => messageMap.set(m.id, m));
                  
                  // 用新消息替换或添加消息
                  messagesToUpdate.forEach(m => messageMap.set(m.id, m));
                  
                  // 转换回数组并确保顺序正确(按时间戳排序)
                  return Array.from(messageMap.values())
                    .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
                });
                
                console.log('更新了UI消息列表, 消息数:', messagesToUpdate.length);
              }
            });
          }
          
          // 如果有助手消息，更新机器人统计
          const botMessage = validatedMessages.find(m => m.role === 'assistant' && m.content);
          if (botMessage && botMessage.content) {
            updateBotStats(chatId, {
              messagesCount: newTotal,
              lastMessageAt: botMessage.timestamp,
              lastMessagePreview: botMessage.content.substring(0, 50) + 
                (botMessage.content.length > 50 ? '...' : '')
            });
          }
        } catch (updateError) {
          console.error('更新消息列表失败:', updateError);
        }
      });
      
      // 确保最后一次更新完成
      setTimeout(() => {
        if (pendingUpdates.size > 0) {
          const finalMessages = Array.from(pendingUpdates.values());
          console.log('发送完成后的最终UI更新, 消息数:', finalMessages.length);
          
          setMessages(prev => {
            const messageMap = new Map<string, Message>();
            prev.forEach(m => messageMap.set(m.id, m));
            finalMessages.forEach(m => messageMap.set(m.id, m));
            
            return Array.from(messageMap.values())
              .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
          });
        }
      }, 200);
      
      return success;
    } catch (error) {
      console.error('处理消息失败:', error);
      return false;
    }
  }, [chatId, sendMessage, totalMessages, updateBotStats, setMessages, setTotalMessages]);

  // 重试失败的消息
  const handleRetry = useCallback(async (messageId: string) => {
    const failedMessage = messages.find(m => m.id === messageId);
    if (!failedMessage) return false;
    
    // 找到前一条用户消息
    const userMessageIndex = messages.findIndex(m => m.id === messageId) - 1;
    if (userMessageIndex < 0) return false;
    
    const userMessage = messages[userMessageIndex];
    if (userMessage.role !== 'user') return false;
    
    // 更新消息状态为重试中
    await messageDb.updateMessageStatus(messageId, 'streaming');
    setMessages(prev => prev.map(m => 
      m.id === messageId ? {
        ...m, 
        status: 'streaming' as MessageStatus, 
        error: undefined
      } : m
    ));
    
    // 重新发送消息
    try {
      await sendMessage(userMessage, (updatedMessages) => {
        // 修复类型错误
        const validatedMessages: Message[] = updatedMessages.map(msg => ({
          ...msg,
          role: msg.id === userMessage.id ? 'user' as Role : 'assistant' as Role
        }));
        
        setMessages(prev => {
          const filtered = prev.filter(msg => 
            !validatedMessages.find(m => m.id === msg.id) && msg.id !== messageId
          );
          return [...filtered, ...validatedMessages];
        });
      });
      
      return true;
    } catch (error) {
      console.error('Retry failed:', error);
      await messageDb.updateMessageStatus(
        messageId, 
        'error', 
        error instanceof Error ? error.message : i18n.t('common.unknownError')
      );
      setMessages(prev => prev.map(m => 
        m.id === messageId ? {
          ...m, 
          status: 'error' as MessageStatus, 
          error: error instanceof Error ? error.message : i18n.t('common.unknownError')
        } : m
      ));
      return false;
    }
  }, [messages, sendMessage, setMessages]);

  // 停止生成 - 改进生成状态控制
  const handleStopGeneration = useCallback(() => {
    stopGeneration(); // 使用新的停止生成函数来确保保存内容
  }, [stopGeneration]);

  // 语音输入
  const handleVoiceInput = useCallback(() => {
    console.log('Voice input activated');
    // TODO: 实现语音输入逻辑
  }, []);

  // 文件上传
  const handleFileUpload = useCallback(() => {
    console.log('File upload triggered');
    // TODO: 实现文件上传逻辑
  }, []);

  return {
    handleSendMessage,
    handleRetry,
    handleStopGeneration,
    handleVoiceInput,
    handleFileUpload,
    isGenerating
  };
}
