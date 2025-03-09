import { useState, useCallback, useEffect, useRef } from 'react';
import { Message, ContentType } from '@/constants/chat';
import { useBotStore } from '@/store/useBotStore';
import { useProviderStore } from '@/store/useProviderStore';
import { useLangChainTools } from './useLangChainTools';
import { useMessageProcessor } from './chat/useMessageProcessor';
import { useMessagePersistence } from './chat';
import { useStreamProcessor } from './chat';
import { ProviderFactory } from '@/provider/ProviderFactory';
import { ModelProviderId } from '@/constants/ModelProviders';
import { messageDb } from '@/database';

type MessageUpdateCallback = (messages: Message[]) => void;

export function useAIChat(botId: string) {
  // 主要状态
  const [isGenerating, setIsGenerating] = useState(false);
  const isGeneratingRef = useRef(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  
  // 外部 Store
  const getBotInfo = useBotStore(state => state.getBotInfo);
  const { providers } = useProviderStore();
  
  // 使用新的 LangChain 工具
  const { prepareSystemPrompt, prepareLangChainMessages, loadEnabledTools } = useLangChainTools(botId);
  
  // 使用拆分后的模块
  const { 
    scheduleUiUpdate, 
    updateIntervalRef, 
    clearUpdateInterval 
  } = useMessageProcessor();
  
  const {
    persistMessages,
    updateMessageContent,
    saveErrorMessage
  } = useMessagePersistence(botId);
  
  const {
    handleStreamResponse,
    isStoppedManuallyRef
  } = useStreamProcessor(botId, scheduleUiUpdate);
  
  // 更新 isGenerating 状态时，同时更新 ref
  useEffect(() => {
    isGeneratingRef.current = isGenerating;
  }, [isGenerating]);
  
  // 清理函数
  useEffect(() => {
    return () => {
      if (abortController) {
        abortController.abort();
      }
      clearUpdateInterval();
    };
  }, [abortController, clearUpdateInterval]);

  const sendMessage = useCallback(
    async (userMessage: Message, onUpdate: MessageUpdateCallback) => {
      try {
        // 确保不使用外部持久化逻辑，直接在这里处理
        console.log('开始发送消息流程，用户消息:', userMessage);
        
        // 在开始新对话前重置手动停止标记
        isStoppedManuallyRef.current = false;
        
        const botInfo = getBotInfo(botId);
        if (!botInfo) {
          throw new Error('Bot configuration not found');
        }

        // 获取提供商配置
        const provider = providers.find(p => p.id === botInfo.providerId);
        if (!provider) {
          throw new Error('Provider not found');
        }

        // 确保用户消息 ID 唯一
        const userMessageId = userMessage.id || `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const userMsg = {
          ...userMessage,
          id: userMessageId
        };

        // 准备 AI 助手的回复消息
        const assistantMessageId = `assistant_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const assistantMessage: Message = {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          thinkingContent: '',
          isThinkingExpanded: true,
          timestamp: Date.now(),
          contentType: 'markdown' as ContentType,
          status: 'streaming' as any
        };

        // 直接保存用户和助手消息 - 确保异步操作完成
        console.log('直接保存用户消息到数据库');
        try {
          await messageDb.addMessage(botId, userMsg);
          console.log('用户消息成功保存到数据库，ID:', userMsg.id);
          
          console.log('直接保存助手消息到数据库');
          await messageDb.addMessage(botId, assistantMessage);
          console.log('助手消息成功保存到数据库，ID:', assistantMessage.id);
        } catch (dbError) {
          console.error('保存消息到数据库失败:', dbError);
          // 继续执行对话流程
        }
        
        // 立即更新UI，确保消息显示
        console.log('立即更新UI显示消息对');
        onUpdate([userMsg, assistantMessage]); 

        // 创建中止控制器
        const controller = new AbortController();
        setAbortController(controller);
        
        // 标记为正在生成
        setIsGenerating(true);
        isGeneratingRef.current = true;

        // 获取聊天历史和处理上下文 (注意可能需要限制历史长度)
        const chatHistory = await messageDb.getMessages(botId, 30, 0);
        console.log(`获取到聊天历史 ${chatHistory.length} 条消息`);
        
        // 应用 maxContextLength 限制
        const finalHistory = botInfo.maxContextLength && botInfo.maxContextLength > 0
          ? chatHistory.slice(-botInfo.maxContextLength * 2)
          : chatHistory;
        
        // 准备系统提示词和LangChain消息
        const finalSystemPrompt = await prepareSystemPrompt(userMsg);
        const langchainMessages = prepareLangChainMessages(finalHistory, finalSystemPrompt);
        
        // 加载启用的工具
        const enabledTools = loadEnabledTools();

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
          systemPrompt: finalSystemPrompt,
          tools: enabledTools.length ? enabledTools : undefined,
        });

        // 如果支持流式输出，处理流式响应
        if (botInfo.streamOutput) {
          console.log('开始流式生成响应...');
          try {
            const stream = await modelProvider.stream(langchainMessages);
            const finalAssistantMessage = await handleStreamResponse(
              stream, 
              userMsg, 
              assistantMessage, 
              isGeneratingRef,
              onUpdate
            );
            console.log('流式响应生成完成:', finalAssistantMessage.id);
            
            // 额外确保最终消息也被传递给UI，增加延迟确保UI更新
            setTimeout(() => {
              console.log('Final update to UI with completed message');
              onUpdate([userMsg, finalAssistantMessage]);
            }, 200);
          } catch (streamError) {
            console.error('流式生成错误:', streamError);
            throw streamError;
          }
        } else {
          // 非流式输出处理
          console.log('开始非流式生成响应...');
          const response = await modelProvider.chat(langchainMessages);
          console.log(`获取到非流式响应: ${response.length} 字符`);

          // 保存完整响应到数据库
          try {
            await messageDb.updateMessageContent(
              assistantMessage.id, 
              response, 
              'sent', 
              'markdown'
            );
            console.log('非流式响应已保存到数据库');
          } catch (err) {
            console.error('保存非流式响应失败:', err);
          }
          
          // 更新助手消息
          const updatedAssistantMessage: Message = {
            ...assistantMessage,
            content: response,
            contentType: 'markdown' as ContentType,
            status: 'sent'
          };
          
          // 更新 UI - 确保使用正确的用户消息
          console.log('更新UI显示非流式响应');
          onUpdate([userMsg, updatedAssistantMessage]);
        }
        
        return true;
      } catch (error) {
        console.error('AI chat error:', error);
        
        // 创建并保存错误消息
        const errorMessage = await saveErrorMessage(error, userMessage);
        
        // 更新 UI
        onUpdate([userMessage, errorMessage]);
        
        return false;
      } finally {
        // 重置生成状态和中止控制器
        setIsGenerating(false);
        isGeneratingRef.current = false;
        isStoppedManuallyRef.current = false;
        setAbortController(null);
        clearUpdateInterval();
      }
    },
    [
      botId, 
      providers, 
      getBotInfo, 
      updateMessageContent, 
      saveErrorMessage,
      handleStreamResponse, 
      prepareSystemPrompt, 
      prepareLangChainMessages, 
      loadEnabledTools,
      isStoppedManuallyRef,
      clearUpdateInterval
    ]
  );

  // 封装设置生成状态的函数，同时更新ref
  const setGeneratingState = useCallback((state: boolean) => {
    // 如果当前正在生成，并且要设置为非生成状态（即停止生成）
    if (isGeneratingRef.current && !state) {
      console.log('检测到生成被手动停止，将保存当前已生成内容');
      isStoppedManuallyRef.current = true;
    }
    
    setIsGenerating(state);
    isGeneratingRef.current = state;
  }, [isStoppedManuallyRef]);

  // 增加一个函数用于停止生成，确保在停止时保存内容
  const stopGeneration = useCallback(() => {
    console.log('用户请求停止生成');
    isStoppedManuallyRef.current = true;
    
    if (abortController) {
      abortController.abort();
    }
    
    setIsGenerating(false);
    isGeneratingRef.current = false;
  }, [abortController, isStoppedManuallyRef]);

  return {
    sendMessage,
    isGenerating,
    setIsGenerating: setGeneratingState,
    stopGeneration,
  };
}
