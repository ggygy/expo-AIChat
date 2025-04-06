import { useState, useCallback, useEffect } from 'react';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import { ToolInterface } from "@langchain/core/tools"; // 更改导入
import { Message } from '@/constants/chat';
import { useBotStore } from '@/store/useBotStore';
import { usePromptStore } from '@/store/usePromptStore';
import { useToolStore } from '@/store/useToolStore';
import { createPromptTemplate } from '@/langchain/prompt';
import { createDynamicTool } from '@/langchain/tools';
import { enhanceSystemPrompt } from '@/utils/chunkProcessor';

/**
 * 用于处理LangChain模板和工具的hook
 */
export function useLangChainTools(botId: string) {
  const { templates } = usePromptStore();
  const { tools } = useToolStore();
  const getBotInfo = useBotStore(state => state.getBotInfo);
  
  /**
   * 准备系统提示词，优先使用提示词模板
   */
  const prepareSystemPrompt = useCallback(async (
    userMessage: Message
  ): Promise<string> => {
    const botInfo = getBotInfo(botId);
    if (!botInfo) return '';
    
    let finalSystemPrompt = botInfo.systemPrompt || '';
    
    // 如果设置了提示词模板ID，则应用提示词模板
    if (botInfo.promptTemplateId) {
      const promptTemplate = templates.find(t => t.id === botInfo.promptTemplateId);
      if (promptTemplate) {
        // 使用langchain的PromptTemplate渲染模板
        const template = createPromptTemplate(promptTemplate);
        try {
          // 生成默认变量映射
          const defaultVariables: Record<string, string> = {};
          promptTemplate.inputVariables.forEach(variable => {
            // 为每个变量提供一个默认值，优先使用userMessage.content作为input
            if (variable === 'input') {
              defaultVariables[variable] = userMessage.content;
            } else {
              defaultVariables[variable] = '';
            }
          });
          
          // 使用用户消息的内容作为模板的输入变量
          const renderedPrompt = await template.format(defaultVariables);
          finalSystemPrompt = renderedPrompt;
          console.log('使用提示词模板:', promptTemplate.name);
        } catch (error) {
          console.error('渲染提示词模板失败:', error);
          // 如果模板渲染失败，回退到系统提示
        }
      }
    }
    
    // 使用enhanceSystemPrompt增强系统提示
    if (botInfo.chainOfThought && botInfo.chainOfThought > 0) {
      finalSystemPrompt = enhanceSystemPrompt(finalSystemPrompt, botInfo.chainOfThought);
    }
    
    return finalSystemPrompt;
  }, [botId, templates, getBotInfo]);

  /**
   * 转换聊天历史为LangChain消息格式
   */
  const prepareLangChainMessages = useCallback((
    chatHistory: Message[],
    systemPrompt?: string
  ) => {
    // 确保消息按时间顺序排序
    chatHistory.sort((a, b) => a.timestamp - b.timestamp);
    
    // 转换消息为Langchain消息格式
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
    
    // 如果系统提示存在且历史消息中没有系统消息，则添加
    if (systemPrompt && !langchainMessages.some(msg => msg instanceof SystemMessage)) {
      const systemMessage = new SystemMessage({ content: systemPrompt });
      langchainMessages.unshift(systemMessage);
    }
    
    return langchainMessages;
  }, []);

  /**
   * 加载Bot启用的工具
   */
  const loadEnabledTools = useCallback((): ToolInterface[] => {
    const botInfo = getBotInfo(botId);
    if (!botInfo || !botInfo.enabledToolIds?.length) return [];
    
    const enabledTools: ToolInterface[] = [];
    
    // 只加载启用的工具
    for (const toolId of botInfo.enabledToolIds) {
      const toolDef = tools.find(t => t.id === toolId);
      if (toolDef) {
        try {
          const tool = createDynamicTool(toolDef);
          console.log(`加载工具: ${toolDef.name}`, tool);
          
          enabledTools.push(tool);
        } catch (error) {
          console.error(`初始化工具"${toolDef.name}"失败:`, error);
        }
      }
    }
    
    if (enabledTools.length) {
      console.log(`已加载${enabledTools.length}个工具`);
    }
    
    return enabledTools;
  }, [botId, tools, getBotInfo]);

  return {
    prepareSystemPrompt,
    prepareLangChainMessages,
    loadEnabledTools
  };
}
