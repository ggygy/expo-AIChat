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
      console.log('Initializing database...');
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

      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
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
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
};

export const messageDb = {
  async addMessage(chatId: string, message: Message) {
    const database = ensureDb();
    try {
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
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  },

  async getMessages(chatId: string, limit = 20, offset = 0): Promise<Message[]> {
    const database = ensureDb();
    try {
      const messages = await database.getAllAsync<Message>(
        `SELECT * FROM messages 
         WHERE chatId = ? 
         ORDER BY timestamp ASC 
         LIMIT ? OFFSET ?`,
        [chatId, limit, offset]
      );
      
      // 确保返回的消息是有效的
      return messages?.filter(msg => 
        msg && msg.id && msg.content && msg.timestamp
      ) ?? [];
    } catch (error) {
      console.error('Get messages error:', error);
      return [];
    }
  },

  async updateMessageStatus(messageId: string, status: string, error?: string) {
    const database = ensureDb();
    try {
      await database.runAsync(
        `UPDATE messages 
         SET status = ?, error = ? 
         WHERE id = ?`,
        [status, error || null, messageId]
      );
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  },

  async deleteMessages(chatId: string) {
    const database = ensureDb();
    try {
      await database.runAsync(
        'DELETE FROM messages WHERE chatId = ?',
        [chatId]
      );
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  },

  async deleteMessage(messageId: string) {
    const database = ensureDb();
    try {
      await database.runAsync(
        'DELETE FROM messages WHERE id = ?',
        [messageId]
      );
      return { success: true };
    } catch (error) {
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
      console.error('Get message count error:', error);
      return 0;
    }
  }
};
