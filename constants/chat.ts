export type MessageRole = 'user' | 'assistant' | 'system';
export type MessageStatus = 'sending' | 'streaming' | 'sent' | 'error';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  contentType?: 'text' | 'markdown';
  status?: MessageStatus;
  error?: string;
}
