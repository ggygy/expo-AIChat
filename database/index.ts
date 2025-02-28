import * as SQLite from 'expo-sqlite';
import { Message } from '@/constants/chat';

let db: SQLite.SQLiteDatabase | null = null;
let isInitializing = false;
let initializationPromise: Promise<void> | null = null;

export const initDatabase = async () => {
  // 如果数据库已经初始化，直接返回
  if (db) {
    return;
  }

  // 如果正在初始化，等待初始化完成
  if (isInitializing && initializationPromise) {
    return initializationPromise;
  }

  isInitializing = true;
  initializationPromise = (async () => {
    try {
      console.log('正在初始化数据库...');
      db = await SQLite.openDatabaseAsync('chat.db');
      
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        
        CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY NOT NULL,
          chatId TEXT NOT NULL,
          role TEXT NOT NULL,
          content TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          contentType TEXT DEFAULT 'text',
          status TEXT DEFAULT 'sent' CHECK(status IN ('sending', 'streaming', 'sent', 'error')),
          error TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_messages_chatId ON messages(chatId);
        CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
      `);

      console.log('数据库初始化成功');
    } catch (error) {
      console.error('数据库初始化失败:', error);
      db = null; // 重置数据库实例
      throw error;
    } finally {
      isInitializing = false;
      initializationPromise = null;
    }
  })();

  return initializationPromise;
};

const ensureDb = () => {
  if (!db) {
    throw new Error('数据库未初始化。请先调用 initDatabase()');
  }
  return db;
};

export const messageDb = {
  async addMessage(chatId: string, message: Message) {
    const database = ensureDb();
    try {
      if (!['user', 'assistant', 'system'].includes(message.role)) {
        throw new Error(`无效的消息角色: ${message.role}`);
      }

      console.log(`添加消息: ${message.id}, 角色: ${message.role}, 聊天ID: ${chatId}`);
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
      return { success: true };
    } catch (error) {
      console.error('添加消息失败:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  },

  async getMessages(chatId: string, limit = 50, offset = 0): Promise<Message[]> {
    const database = ensureDb();
    try {
      console.log(`获取消息: chatId=${chatId}, limit=${limit}, offset=${offset}`);
      
      // 修正查询顺序，直接按时间戳升序排列（旧消息在前，新消息在后）
      const messages = await database.getAllAsync<Message>(
        `SELECT * FROM messages 
         WHERE chatId = ? 
         ORDER BY timestamp ASC 
         LIMIT ? OFFSET ?`,
        [chatId, limit, offset]
      );
      
      console.log(`获取到 ${messages?.length || 0} 条消息`);
      
      // 确保返回的消息必须包含所有必要字段且角色正确
      const validMessages = messages
        ?.filter(msg => 
          msg?.id && 
          msg?.content && 
          msg?.timestamp && 
          msg?.role && 
          ['user', 'assistant', 'system'].includes(msg.role)
        )
        .map(msg => ({
          ...msg,
          role: msg.role as 'user' | 'assistant' | 'system'
        }))
        ?? [];
      
      // 无需反转，因为已经是按正确顺序排列的
      return validMessages;
    } catch (error) {
      console.error('获取消息失败:', error);
      return [];
    }
  },

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
  
  async updateMessageContent(messageId: string, content: string, status: string = 'sent', contentType?: string) {
    const database = ensureDb();
    try {
      console.log(`更新消息内容: ${messageId}, 内容长度: ${content.length}, 状态: ${status}, 类型: ${contentType || '默认'}`);
      
      // 如果提供了内容类型，则更新它
      if (contentType) {
        await database.runAsync(
          `UPDATE messages 
           SET content = ?, status = ?, contentType = ? 
           WHERE id = ?`,
          [content, status, contentType, messageId]
        );
      } else {
        await database.runAsync(
          `UPDATE messages 
           SET content = ?, status = ? 
           WHERE id = ?`,
          [content, status, messageId]
        );
      }
      
      return { success: true };
    } catch (error) {
      console.error('更新消息内容失败:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  },

  async deleteMessages(chatId: string) {
    const database = ensureDb();
    try {
      console.log(`删除聊天的全部消息: ${chatId}`);
      await database.runAsync(
        'DELETE FROM messages WHERE chatId = ?',
        [chatId]
      );
      return { success: true };
    } catch (error) {
      console.error('删除消息失败:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  },

  async deleteMessage(messageId: string) {
    const database = ensureDb();
    try {
      console.log(`删除单条消息: ${messageId}`);
      await database.runAsync(
        'DELETE FROM messages WHERE id = ?',
        [messageId]
      );
      return { success: true };
    } catch (error) {
      console.error('删除消息失败:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  },

  async getMessageCount(chatId: string): Promise<number> {
    const database = ensureDb();
    try {
      const result = await database.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM messages WHERE chatId = ?',
        [chatId]
      );
      return result?.count || 0;
    } catch (error) {
      console.error('获取消息数量失败:', error);
      return 0;
    }
  }
};
