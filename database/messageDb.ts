import { Message } from '@/constants/chat';
import { ensureDb, columnExists, addColumn } from './connection';

/**
 * 消息数据库操作
 */
export const messageDb = {
  /**
   * 检查消息是否存在
   */
  async messageExists(messageId: string): Promise<boolean> {
    const database = ensureDb();
    try {
      const result = await database.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM messages WHERE id = ?',
        [messageId]
      );
      return result ? result.count > 0 : false;
    } catch (error) {
      console.error('检查消息是否存在失败:', error);
      return false;
    }
  },

  /**
   * 添加新消息
   */
  async addMessage(chatId: string, message: Message) {
    const database = ensureDb();
    try {
      if (!['user', 'assistant', 'system'].includes(message.role)) {
        throw new Error(`无效的消息角色: ${message.role}`);
      }

      // 先检查消息是否存在，避免重复添加
      const exists = await this.messageExists(message.id);
      if (exists) {
        console.warn(`消息 ID ${message.id} 已存在，跳过添加`);
        return { success: true, skipped: true };
      }

      console.log(`添加消息: ${message.id}, 角色: ${message.role}, 聊天ID: ${chatId}`);
      
      // 先检查 messageType 列是否存在
      const hasMessageType = await columnExists(database, 'messages', 'messageType');
      
      try {
        if (hasMessageType) {
          // 如果列存在，使用包含 messageType 的插入语句
          await database.runAsync(
            `INSERT INTO messages (id, chatId, role, content, timestamp, contentType, messageType, status, error)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,

            [
              message.id,
              chatId,
              message.role,
              message.content,
              message.timestamp,
              message.contentType || 'text',
              message.messageType || 'normal',
              message.status || 'sent',
              message.error || null
            ]
          );
        } else {
          // 如果列不存在，使用不包含 messageType 的插入语句
          console.warn('messageType 列不存在，使用不包含该列的插入语句');
          await database.runAsync(
            `INSERT INTO messages (id, chatId, role, content, timestamp, contentType, status, error)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,

            [
              message.id,
              chatId,
              message.role,
              message.content,
              message.timestamp,
              message.contentType || 'text',
              message.status || 'sent',
              message.error || null
            ]
          );
        }
        
        return { success: true };
      } catch (insertError: any) {
        // 再次特殊处理唯一性约束错误
        if (insertError.message && insertError.message.includes('UNIQUE constraint failed')) {
          console.warn(`尝试插入时发现重复消息 ID ${message.id}, 跳过插入`);
          return { success: true, skipped: true };
        }
        throw insertError;
      }
    } catch (error) {
      console.error('添加消息失败:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  },

  /**
   * 获取消息列表
   */
  async getMessages(chatId: string, limit = 50, offset = 0): Promise<Message[]> {
    const database = ensureDb();
    try {
      console.log(`获取消息: chatId=${chatId}, limit=${limit}, offset=${offset}`);
      
      // 先检查列是否存在
      const hasTokenUsage = await columnExists(database, 'messages', 'token_usage');
      const hasThinkingContent = await columnExists(database, 'messages', 'thinking_content');
      const hasToolCalls = await columnExists(database, 'messages', 'tool_calls');
      const hasInvalidToolCalls = await columnExists(database, 'messages', 'invalid_tool_calls');
      const hasMetadata = await columnExists(database, 'messages', 'metadata');
      
      // 根据列的存在情况构建查询
      let query = `
        SELECT id, chatId, role, content, timestamp, contentType, status, error, messageType
      `;
      
      if (hasTokenUsage) {
        query += `, token_usage`;
      }
      
      if (hasThinkingContent) {
        query += `, thinking_content`;
      }
      
      if (hasToolCalls) {
        query += `, tool_calls`;
      }
      
      if (hasInvalidToolCalls) {
        query += `, invalid_tool_calls`;
      }
      
      if (hasMetadata) {
        query += `, metadata`;
      }
      
      query += ` FROM messages
                WHERE chatId = ? 
                ORDER BY timestamp ASC 
                LIMIT ? OFFSET ?`;
      
      const messages = await database.getAllAsync<any>(
        query,
        [chatId, limit, offset]
      );
      
      console.log(`获取到 ${messages?.length || 0} 条消息`);
      
      // 处理结果，将thinking_content映射到thinkingContent
      const validMessages = messages
        ?.filter(msg => 
          msg?.id && 
          msg?.content && 
          msg?.timestamp && 
          msg?.role && 
          ['user', 'assistant', 'system'].includes(msg.role)
        )
        .map(msg => {
          // 解析token使用信息
          let tokenUsage = undefined;
          if (hasTokenUsage && msg.token_usage) {
            try {
              tokenUsage = JSON.parse(msg.token_usage);
            } catch (error) {
              console.warn(`解析消息 ${msg.id} 的token_usage失败:`, error);
            }
          }
          
          // 解析工具调用信息
          let toolCalls = undefined;
          if (hasToolCalls && msg.tool_calls) {
            try {
              toolCalls = JSON.parse(msg.tool_calls);
            } catch (error) {
              console.warn(`解析消息 ${msg.id} 的tool_calls失败:`, error);
            }
          }
          
          // 解析无效工具调用信息
          let invalidToolCalls = undefined;
          if (hasInvalidToolCalls && msg.invalid_tool_calls) {
            try {
              invalidToolCalls = JSON.parse(msg.invalid_tool_calls);
            } catch (error) {
              console.warn(`解析消息 ${msg.id} 的invalid_tool_calls失败:`, error);
            }
          }
          
          // 解析其他元数据
          let metadata = undefined;
          if (hasMetadata && msg.metadata) {
            try {
              metadata = JSON.parse(msg.metadata);
            } catch (error) {
              console.warn(`解析消息 ${msg.id} 的metadata失败:`, error);
            }
          }
          
          // 构造标准消息对象
          const message: Message = {
            ...msg,
            role: msg.role as 'user' | 'assistant' | 'system',
            tokenUsage: tokenUsage,
            toolCalls: toolCalls,
            invalidToolCalls: invalidToolCalls,
            metadata: metadata
          };
          
          // 仅当列存在且值不为空时添加思考内容
          if (hasThinkingContent && msg.thinking_content) {
            message.thinkingContent = msg.thinking_content;
            message.isThinkingExpanded = true; // 默认展开思考内容
          }
          
          // 删除不标准的数据库字段
          if (hasThinkingContent) {
            delete (message as any).thinking_content;
          }
          if (hasTokenUsage) {
            delete (message as any).token_usage;
          }
          if (hasToolCalls) {
            delete (message as any).tool_calls;
          }
          if (hasInvalidToolCalls) {
            delete (message as any).invalid_tool_calls;
          }
          if (hasMetadata) {
            delete (message as any).metadata;
          }
          
          return message;
        })
        ?? [];
      
      return validMessages;
    } catch (error) {
      console.error('获取消息失败:', error);
      return [];
    }
  },

  /**
   * 更新消息状态
   */
  async updateMessageStatus(messageId: string, status: string, error?: string) {
    const database = ensureDb();
    try {
      console.log(`更新消息状态: ${messageId}, 状态: ${status}`);
      await database.runAsync(
        `UPDATE messages 
         SET status = ?, error = ? 
         WHERE id = ?`,
        [status, error || null, messageId]
      );
      return { success: true };
    } catch (error) {
      console.error('更新消息状态失败:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  },
}
