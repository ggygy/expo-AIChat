import { useState, useCallback } from 'react';
import { Message } from '@/constants/chat';
import { useBotStore } from '@/store/useBotStore';
import { useProviderStore } from '@/store/useProviderStore';
import { ModelProviderId } from '@/constants/ModelProviders';
import { BaseMessageChunk, AIMessage, HumanMessage } from '@langchain/core/messages';
import { messageDb } from '@/database';
import { ProviderFactory } from '@/provider/ProviderFactory';

export const useAIChat = (botId: string) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const getBotInfo = useBotStore(state => state.getBotInfo);
  const getProviderConfig = useProviderStore(state => state.providers);

  const generateResponse = useCallback(async (messages: Message[]) => {
    const botInfo = getBotInfo(botId);
    if (!botInfo) {
      throw new Error('Bot configuration not found');
    }

    const provider = getProviderConfig.find(p => p.id === botInfo.providerId);
    if (!provider) {
      throw new Error('Provider configuration not found');
    }

    const modelProvider = ProviderFactory.createProvider(provider.id as ModelProviderId);
    modelProvider.initialize({
      vendor: provider.id as ModelProviderId,
      apiKey: provider.apiKey,
      modelName: botInfo.modelId,
      baseUrl: provider.baseUrl,
      temperature: botInfo.temperature,
      topP: botInfo.topP,
      maxTokens: botInfo.enableMaxTokens ? botInfo.maxTokens : undefined,
      streamOutput: botInfo.streamOutput,
      systemPrompt: botInfo.systemPrompt,
    });

    return { modelProvider, botInfo };
  }, [getBotInfo, getProviderConfig, botId]);

  const sendMessage = useCallback(async (
    userMessage: Message,
    onUpdateMessage: (messages: Message[]) => void
  ) => {
    setIsGenerating(true);
    setError(null);

    let assistantMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      contentType: 'text',
      status: 'sending'
    };

    try {
      await messageDb.addMessage(botId, userMessage);
      await messageDb.addMessage(botId, assistantMessage);
      onUpdateMessage([userMessage, assistantMessage]);

      const historyMessages = await messageDb.getMessages(botId, 10);
      const { modelProvider, botInfo } = await generateResponse(historyMessages);
      
      const langChainMessages: BaseMessageChunk[] = historyMessages
        .slice(-botInfo.maxContextLength) // 限制上下文长度
        .map(msg => {
          if (msg.role === 'user') {
            return new HumanMessage({
              content: msg.content,
            }) as unknown as BaseMessageChunk;
          }
          return new AIMessage({
            content: msg.content,
          }) as unknown as BaseMessageChunk;
        });

      console.log('langChainMessages', langChainMessages);
      

      if (botInfo?.streamOutput) {
        let fullContent = '';
        let hasStartedStreaming = false;
        let streamGenerator: AsyncGenerator<string>;

        try {
          // 先获取生成器
          streamGenerator = modelProvider.stream(langChainMessages);
          let receivedFirstChunk = false;
          
          // 使用 for await 处理流
          for await (const chunk of streamGenerator) {
            if (!receivedFirstChunk) receivedFirstChunk = true;
            hasStartedStreaming = true;
            if (chunk) {
              fullContent += chunk;
              assistantMessage = {
                ...assistantMessage,
                content: fullContent,
                status: 'streaming'
              };
              onUpdateMessage([userMessage, assistantMessage]);
            }
          }

          if (!receivedFirstChunk) {
            throw new Error('No data received in stream');
          }

          if (!hasStartedStreaming || !fullContent) {
            throw new Error('No valid response content received');
          }

          assistantMessage = {
            ...assistantMessage,
            content: fullContent,
            status: 'sent'
          };
        } catch (streamError) {
          console.error('Streaming error:', streamError);
          // 如果流式传输失败，回退到非流式请求
          const response = await modelProvider.chat(langChainMessages);
          if (!response) {
            throw new Error('Failed to get response from fallback request');
          }
          assistantMessage = {
            ...assistantMessage,
            content: response,
            status: 'sent'
          };
        }
      } else {
        // 非流式请求
        const response = await modelProvider.chat(langChainMessages);
        if (!response) {
          throw new Error('Empty response received');
        }
        assistantMessage = {
          ...assistantMessage,
          content: response,
          status: 'sent'
        };
      }

      // 保存成功的响应
      await messageDb.updateMessageStatus(assistantMessage.id, 'sent');
      onUpdateMessage([userMessage, assistantMessage]);

    } catch (err) {
      console.error('Error generating response:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate response';
      setError(errorMessage);
      
      assistantMessage = {
        ...assistantMessage,
        status: 'error',
        error: errorMessage
      };
      
      await messageDb.updateMessageStatus(
        assistantMessage.id,
        'error',
        errorMessage
      );
      
      onUpdateMessage([userMessage, assistantMessage]);
    } finally {
      setIsGenerating(false);
    }
  }, [botId, generateResponse]);

  return {
    sendMessage,
    isGenerating,
    error,
    setIsGenerating
  };
};
