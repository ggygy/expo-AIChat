import { MessageType } from '@/constants/chat';

// 导入必要的类型
import { Message } from '@/constants/chat';

// 定义 token 使用信息类型
export interface TokenUsage {
  total_tokens?: number;
  prompt_tokens?: number;
  completion_tokens?: number;
}

// 定义正确的返回类型
export interface ProcessedChunk {
  content: string;
  thinkingContent: string;
  tokenUsage?: TokenUsage;
  toolCalls?: any[];
  invalidToolCalls?: any[];
  metadata?: any;
}

/**
 * 处理API返回的数据块，分离正常内容和思考内容
 * @param chunk 从API接收到的数据块
 * @param existingContent 当前已累积的内容
 * @param existingThinkingContent 当前已累积的思考内容
 * @param tokenUsage token使用情况
 * @returns 处理后的内容对象，包含普通内容和思考内容
 */
export function processChunk(
  chunk: any, 
  existingContent: string, 
  existingThinkingContent: string,
  tokenUsage?: { 
    total_tokens?: number, 
    prompt_tokens?: number, 
    completion_tokens?: number 
  }
): ProcessedChunk {
  // 初始化内容，使用现有内容
  let content = existingContent;
  let thinkingContent = existingThinkingContent;
  
  // 打印接收到的chunk结构，便于调试
  if (process.env.NODE_ENV === 'development') {
    try {
      // console.log('收到chunk:', JSON.stringify(chunk, null, 2).substring(0, 100) + '...');
    } catch (e) {
      console.log('收到非JSON格式chunk');
    }
  }

  let chunkContent: string | undefined;
  let chunkThinking: string | undefined;
  let chunkType: MessageType = 'normal';
  let metadata: any = {};
  let toolCalls: any[] = [];
  let invalidToolCalls: any[] = [];
  
  // 提取令牌使用信息
  let totalTokens = tokenUsage?.total_tokens || 0;
  let promptTokens = tokenUsage?.prompt_tokens || 0;
  let completionTokens = tokenUsage?.completion_tokens || 0;
  
  // 处理各种可能的token使用信息格式
  // 1. 尝试从response_metadata.usage中提取
  if (chunk.response_metadata?.usage) {
    const usage = chunk.response_metadata.usage;
    if (usage.total_tokens) totalTokens = usage.total_tokens;
    if (usage.prompt_tokens) promptTokens = usage.prompt_tokens;
    if (usage.completion_tokens) completionTokens = usage.completion_tokens;
  }
  
  // 2. 尝试从usage_metadata中提取
  if (chunk.usage_metadata) {
    const usage = chunk.usage_metadata;
    if (usage.total_tokens) totalTokens = usage.total_tokens;
    if (usage.input_tokens) promptTokens = usage.input_tokens;
    if (usage.output_tokens) completionTokens = usage.output_tokens;
    
    // 保存详细的token使用信息
    if (usage.input_token_details || usage.output_token_details) {
      metadata.tokenDetails = {
        input: usage.input_token_details,
        output: usage.output_token_details
      };
    }
  }
  
  // 3. 尝试从kwargs.usage_metadata中提取
  if (chunk.kwargs?.usage_metadata) {
    const usage = chunk.kwargs.usage_metadata;
    if (usage.total_tokens) totalTokens = usage.total_tokens;
    if (usage.input_tokens) promptTokens = usage.input_tokens;
    if (usage.output_tokens) completionTokens = usage.output_tokens;
  }
  
  // 提取工具调用信息
  if (chunk.tool_calls && Array.isArray(chunk.tool_calls)) {
    toolCalls = chunk.tool_calls;
  } else if (chunk.kwargs?.tool_calls && Array.isArray(chunk.kwargs.tool_calls)) {
    toolCalls = chunk.kwargs.tool_calls;
  }
  
  // 提取无效工具调用
  if (chunk.invalid_tool_calls && Array.isArray(chunk.invalid_tool_calls)) {
    invalidToolCalls = chunk.invalid_tool_calls;
  } else if (chunk.kwargs?.invalid_tool_calls && Array.isArray(chunk.kwargs.invalid_tool_calls)) {
    invalidToolCalls = chunk.kwargs.invalid_tool_calls;
  }
  
  // 处理常规内容
  if (typeof chunk.content === 'string') {
    chunkContent = chunk.content;
  } else if (chunk.kwargs?.content && typeof chunk.kwargs.content === 'string') {
    chunkContent = chunk.kwargs.content;
  }
  
  // 处理思考过程 - 检查所有可能的思考内容字段
  // 1. additional_kwargs.reasoning_content
  if (chunk.additional_kwargs?.reasoning_content) {
    chunkType = 'thinking';
    chunkThinking = chunk.additional_kwargs.reasoning_content;
  } 
  // 2. additional_kwargs.thinking
  else if (chunk.additional_kwargs?.thinking) {
    chunkType = 'thinking';
    chunkThinking = chunk.additional_kwargs.thinking;
  }
  // 3. reasoning 字段
  else if (chunk.reasoning || (chunk.content && chunk.content.reasoning)) {
    chunkType = 'thinking';
    chunkThinking = chunk.reasoning || chunk.content.reasoning;
  }
  // 4. kwargs.additional_kwargs 中寻找思考内容
  else if (chunk.kwargs?.additional_kwargs?.reasoning_content) {
    chunkType = 'thinking';
    chunkThinking = chunk.kwargs.additional_kwargs.reasoning_content;
  }
  
  // 更新内容，将新块追加到现有内容
  if (chunkContent) {
    content = content + chunkContent;
  }
  
  if (chunkThinking) {
    thinkingContent = thinkingContent + chunkThinking;
  }
  
  // 特殊处理: 如果内容包含思考过程的标记，尝试分离
  if (content && !thinkingContent) {
    const thinkingPatterns = [
      { start: '思考：', end: '\n回答：' },
      { start: '思考:', end: '\n回答:' },
      { start: 'Thinking:', end: '\nAnswer:' },
      { start: '# 思考过程', end: '\n# 回答' },
      { start: 'Reasoning:', end: '\nResponse:' }
    ];
    
    for (const pattern of thinkingPatterns) {
      const startIdx = content.indexOf(pattern.start);
      const endIdx = content.indexOf(pattern.end);
      
      if (startIdx !== -1 && endIdx !== -1 && startIdx < endIdx) {
        thinkingContent = content.substring(startIdx, endIdx + pattern.end.length);
        content = content.substring(0, startIdx) + content.substring(endIdx + pattern.end.length);
        break;
      }
    }
  }
  
  // 记录最终提取的内容
  if (thinkingContent && thinkingContent !== existingThinkingContent) {
    console.log('更新思考内容，当前长度:', thinkingContent.length);
  }
  
  // 更新返回结果，包含所有提取的信息
  return {
    content,
    thinkingContent,
    tokenUsage: {
      total_tokens: totalTokens,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens
    },
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    invalidToolCalls: invalidToolCalls.length > 0 ? invalidToolCalls : undefined,
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined
  };
}

/**
 * 增强系统提示以支持思维链功能
 * @param systemPrompt 原始系统提示
 * @param chainOfThoughtLevel 思维链级别 (0-3)
 * @returns 增强后的系统提示
 */
export function enhanceSystemPrompt(systemPrompt: string, chainOfThoughtLevel: number): string {
  if (!chainOfThoughtLevel || chainOfThoughtLevel <= 0) {
    return systemPrompt;
  }
  
  let finalSystemPrompt = systemPrompt || '';
  
  // 根据 chainOfThought 级别添加相应的提示语
  switch (chainOfThoughtLevel) {
    case 1: // 基础思考能力
      finalSystemPrompt += finalSystemPrompt ? '\n\n' : '';
      finalSystemPrompt += '当遇到复杂问题时，请先分步骤思考，然后再给出最终答案。';
      break;
    case 2: // 增强思考能力
      finalSystemPrompt += finalSystemPrompt ? '\n\n' : '';
      finalSystemPrompt += '请使用以下格式回答需要深入思考的问题：\n' + 
                          '思考: [这里写你的分析过程，包括步骤和逻辑推导]\n' +
                          '回答: [这里写你的最终答案]';
      break;
    case 3: // 专家思考能力
      finalSystemPrompt += finalSystemPrompt ? '\n\n' : '';
      finalSystemPrompt += '你是一位擅长批判性思维的专家。对于复杂问题，请使用以下思考框架：\n' +
                          '1. 问题分析: 确定真正需要解决的问题\n' +
                          '2. 思考路径: 列出所有可能的解决方案\n' + 
                          '3. 分析评估: 评估每个方案的优缺点\n' +
                          '4. 结论: 给出最合适的答案并解释原因';
      break;
  }
  
  console.log(`应用思维链级别 ${chainOfThoughtLevel}: 系统提示已增强`);
  return finalSystemPrompt;
}
