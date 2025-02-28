export type MessageStatus = 'sending' | 'streaming' | 'sent' | 'error';
export type MessageRole = 'user' | 'assistant' | 'system';
export type ContentType = 'text' | 'image' | 'markdown';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  contentType: ContentType; // 确保这里包含 markdown 类型
  status?: MessageStatus;
  error?: string;
}
