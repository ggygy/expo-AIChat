import { useState, useCallback, useEffect, useRef } from 'react';
import { ContentType, Message } from '@/constants/chat';
import { useBotStore } from '@/store/useBotStore';
import { useProviderStore } from '@/store/useProviderStore';
import { messageDb } from '@/database';
import { ProviderFactory } from '@/provider/ProviderFactory';
import { ModelProviderId } from '@/constants/ModelProviders';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import i18n from '@/i18n/i18n'; // 导入 i18n

type MessageUpdateCallback = (messages: Message[]) => void;
// 定义消息状态的类型以确保类型安全
type MessageStatus = 'sending' | 'streaming' | 'sent' | 'error';

export function useAIChat(botId: string) {
  const [isGenerating, setIsGenerating] = useState(false);
  // 使用ref来跟踪生成状态，确保异步操作可以访问到最新的状态值
  const isGeneratingRef = useRef(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const getBotInfo = useBotStore(state => state.getBotInfo);
  const { providers } = useProviderStore();
  
  // 更新 isGenerating 状态时，同时更新 ref
  useEffect(() => {
    isGeneratingRef.current = isGenerating;
  }, [isGenerating]);
  
  // 如果组件卸载，中止正在进行的请求
  useEffect(() => {
    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  }, [abortController]);

  const sendMessage = useCallback(
    async (userMessage: Message, onUpdate: MessageUpdateCallback) => {
      try {
        const botInfo = getBotInfo(botId);
        if (!botInfo) {
          throw new Error('Bot configuration not found');
        }

        // 获取提供商配置
        const provider = providers.find(p => p.id === botInfo.providerId);
        if (!provider) {
          throw new Error('Provider not found');
        }

        // 准备 AI 助手的回复消息 - 指定 markdown 类型
        const assistantMessage: Message = {
          id: `assistant_${Date.now()}`,
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
          contentType: 'markdown', // 将内容类型设置为 markdown
          status: 'streaming' as MessageStatus
        };

        // 保存助手消息到数据库
        await messageDb.addMessage(botId, assistantMessage);
        
        // 更新消息列表
        onUpdate([userMessage, assistantMessage]);

        // 创建中止控制器
        const controller = new AbortController();
        setAbortController(controller);
        
        // 标记为正在生成
        setIsGenerating(true);
        isGeneratingRef.current = true; // 直接设置 ref 确保立即生效

        // 获取聊天历史
        let chatHistory = await messageDb.getMessages(botId, 50, 0);
        
        // 转换消息为 Langchain 消息格式
        const langchainMessages = chatHistory.map(msg => {
          switch (msg.role) {
            case 'user':
              return new HumanMessage({ content: msg.content });
            case 'assistant':
              return new AIMessage({ content: msg.content });
            case 'system':
              return new SystemMessage({ content: msg.content });
            default:
              return new HumanMessage({ content: msg.content });
          }
        });
        
        // 考虑系统提示
        if (botInfo.systemPrompt && !langchainMessages.some(msg => msg instanceof SystemMessage)) {
          const systemMessage = new SystemMessage({ content: botInfo.systemPrompt });
          langchainMessages.unshift(systemMessage);
        }

        // 创建模型提供商实例
        const modelProvider = ProviderFactory.createProvider(botInfo.providerId as ModelProviderId);
        if (!modelProvider) {
          throw new Error(`Unsupported provider: ${botInfo.providerId}`);
        }

        // 初始化模型
        modelProvider.initialize({
          vendor: botInfo.providerId as any,
          modelName: botInfo.modelId,
          apiKey: provider.apiKey,
          baseUrl: provider.baseUrl,
          temperature: botInfo.temperature,
          maxTokens: botInfo.enableMaxTokens ? botInfo.maxTokens : undefined,
          topP: botInfo.topP,
          streamOutput: botInfo.streamOutput,
          systemPrompt: botInfo.systemPrompt
        });

        // 如果支持流式输出
        if (botInfo.streamOutput) {
          let content = '';
          let lastSaveLength = 0; // 记录上次保存的内容长度
          const stream = await modelProvider.stream(langchainMessages);
          
          try {
            for await (const chunk of stream) {
              if (!isGeneratingRef.current) {
                console.log('流式生成被中止');
                break;
              }
              
              const chunkContent = chunk.content;
              if (typeof chunkContent === 'string') {
                content += chunkContent;
                
                // 更新助手消息 - 保持 markdown 类型
                const updatedAssistantMessage = {
                  ...assistantMessage,
                  content,
                  contentType: 'markdown' as ContentType
                };
                
                // 定期保存内容到数据库，避免过于频繁的 I/O
                // 每当内容增加超过50个字符，或每5秒保存一次
                if (content.length - lastSaveLength > 50) {
                  console.log(`保存中间内容到数据库: ${content.length} 字符`);
                  await messageDb.updateMessageContent(
                    assistantMessage.id, 
                    content, 
                    'streaming', 
                    'markdown' // 传递内容类型
                  );
                  lastSaveLength = content.length;
                }
                
                // 回调更新 UI
                onUpdate([userMessage, updatedAssistantMessage]);
              }
            }
          } catch (error) {
            console.error('流式生成错误:', error);
            if (isGeneratingRef.current) { // 只有在未主动中止时才视为错误
              throw error;
            }
          }

          // 保存最终的完整内容
          console.log(`保存完整内容到数据库: ${content.length} 字符`);
          await messageDb.updateMessageContent(
            assistantMessage.id, 
            content, 
            'sent', 
            'markdown' // 传递内容类型
          );
          
          // 更新最终消息
          const finalAssistantMessage: Message = {
            ...assistantMessage,
            content,
            contentType: 'markdown', // 确保类型不变
            status: 'sent' as MessageStatus
          };
          
          // 最后一次更新 UI
          onUpdate([userMessage, finalAssistantMessage]);
        } else {
          // 非流式输出
          const response = await modelProvider.chat(langchainMessages);
          console.log(`获取到非流式响应: ${response.length} 字符`);

          // 保存完整响应到数据库
          await messageDb.updateMessageContent(
            assistantMessage.id, 
            response, 
            'sent', 
            'markdown' // 传递内容类型
          );
          
          // 更新助手消息
          const updatedAssistantMessage: Message = {
            ...assistantMessage,
            content: response,
            contentType: 'markdown', // 确保类型不变
            status: 'sent' as MessageStatus
          };
          
          // 更新 UI
          onUpdate([userMessage, updatedAssistantMessage]);
        }
      } catch (error) {
        console.error('AI chat error:', error);
        
        // 创建错误消息
        const errorMessage: Message = {
          id: `error_${Date.now()}`,
          role: 'assistant',
          content: i18n.t('chat.errorResponse'), // 使用本地化文本
          timestamp: Date.now(),
          contentType: 'text',
          status: 'error' as MessageStatus,
          error: error instanceof Error ? error.message : i18n.t('common.unknownError') // 使用本地化文本
        };
        
        // 保存错误消息
        await messageDb.addMessage(botId, errorMessage);
        
        // 更新 UI
        onUpdate([userMessage, errorMessage]);
        
        throw error;
      } finally {
        // 重置生成状态和中止控制器
        setIsGenerating(false);
        isGeneratingRef.current = false;
        setAbortController(null);
      }
    },
    [botId, providers, getBotInfo]
  );

  // 封装设置生成状态的函数，同时更新ref
  const setGeneratingState = useCallback((state: boolean) => {
    setIsGenerating(state);
    isGeneratingRef.current = state;
  }, []);

  return {
    sendMessage,
    isGenerating,
    setIsGenerating: setGeneratingState,
  };
}
