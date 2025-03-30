// 内容类型
export type ContentType = 'text' | 'markdown' | 'image' | 'code' | 'audio' | 'video' | 'file';

// 消息类型
export type MessageType = 'normal' | 'thinking' | 'system';

// 消息角色
export type Role = 'user' | 'assistant' | 'system';

// 消息状态
export type MessageStatus = 'sending' | 'streaming' | 'sent' | 'error';

// token使用信息
export interface TokenUsage {
  total_tokens?: number;
  prompt_tokens?: number;
  completion_tokens?: number;
}

// 消息对象
export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  contentType?: ContentType;
  messageType?: MessageType; // 新增：区分普通消息和思考过程
  status?: MessageStatus;
  error?: string;
  tokenUsage?: TokenUsage; // 添加token使用信息字段
  // 新增字段：思考内容
  thinkingContent?: string;
  // 新增字段：是否显示思考内容
  isThinkingExpanded?: boolean;
  toolCalls?: any[]; // 工具调用信息
  invalidToolCalls?: any[]; // 无效的工具调用信息
  metadata?: any; // 附加元数据
}

// 助手特性
export interface AssistantCapabilities {
  canGenerateImages?: boolean;
  canAccessWeb?: boolean;
  canAccessFiles?: boolean;
  canRunCode?: boolean;
}

// 聊天系统提示
export interface SystemPrompt {
  name: string;
  content: string;
  description?: string;
}
