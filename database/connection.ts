import * as SQLite from 'expo-sqlite';

// 数据库连接实例
let db: SQLite.SQLiteDatabase | null = null;
let isInitializing = false;
let initializationPromise: Promise<void> | null = null;

// 数据库版本信息
export const DB_VERSION = 2;
export const DB_VERSION_KEY = 'db_version';

/**
 * 检查表中是否存在特定列
 */
export const columnExists = async (database: SQLite.SQLiteDatabase, table: string, column: string): Promise<boolean> => {
  try {
    const result = await database.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM pragma_table_info('${table}') WHERE name='${column}'`
    );
    return result ? result.count > 0 : false;
  } catch (error) {
    console.error(`检查列 ${column} 是否存在失败:`, error);
    return false;
  }
};

/**
 * 添加列到表中，如果列已存在则不做任何操作
 * 修改为更健壮的实现，忽略"列已存在"错误
 */
export const addColumn = async (database: SQLite.SQLiteDatabase, table: string, column: string, type: string, defaultValue?: string): Promise<boolean> => {
  try {
    // 首先确认列是否已存在
    const exists = await columnExists(database, table, column);
    if (exists) {
      console.log(`列 ${column} 已存在于表 ${table} 中，无需添加`);
      return true;
    }
    
    // 执行添加列的操作
    let sql = `ALTER TABLE ${table} ADD COLUMN ${column} ${type}`;
    if (defaultValue !== undefined) {
      sql += ` DEFAULT '${defaultValue}'`;
    }
    await database.execAsync(sql);
    console.log(`已添加列 ${column} 到表 ${table}`);
    return true;
  } catch (error: any) {
    // 如果错误是因为列已存在，我们认为这不是问题
    if (error.message && (
        error.message.includes('duplicate column name') || 
        error.message.includes('already exists')
    )) {
      console.log(`列 ${column} 已存在于表 ${table} 中（从错误中检测到）`);
      return true;
    }
    
    console.error(`添加列 ${column} 失败:`, error);
    return false;
  }
};

/**
 * 初始化数据库
 */
export const initDatabase = async () => {
  // 如果数据库已经初始化，直接返回
  if (db) {
    return db;
  }

  // 如果正在初始化，等待初始化完成
  if (isInitializing && initializationPromise) {
    await initializationPromise;
    return db;
  }

  isInitializing = true;
  initializationPromise = (async () => {
    try {
      console.log('正在初始化数据库...');
      db = await SQLite.openDatabaseAsync('chat.db');
      
      // 创建基本的表结构
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        
        CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY NOT NULL,
          chatId TEXT NOT NULL,
          role TEXT NOT NULL,
          content TEXT NOT NULL,
          thinking_content TEXT,
          token_usage TEXT,
          timestamp INTEGER NOT NULL,
          contentType TEXT DEFAULT 'text',
          status TEXT DEFAULT 'sent' CHECK(status IN ('sending', 'streaming', 'sent', 'error')),
          error TEXT
        );
        
        CREATE TABLE IF NOT EXISTS app_info (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_messages_chatId ON messages(chatId);
        CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
      `);

      // 检查并添加 messageType 列
      const hasMessageType = await columnExists(db, 'messages', 'messageType');
      if (!hasMessageType) {
        console.log('messages 表缺少 messageType 列，正在添加...');
        await addColumn(db, 'messages', 'messageType', 'TEXT', 'normal');
      }
      
      console.log('数据库初始化成功');
      
      // 记录数据库版本
      const versionExists = await columnExists(db, 'app_info', 'key');
      if (versionExists) {
        const versionResult = await db.getFirstAsync<{count: number}>(
          `SELECT count(*) as count FROM app_info WHERE key = ?`,
          [DB_VERSION_KEY]
        );
        
        if (versionResult && versionResult.count > 0) {
          await db.runAsync(
            `UPDATE app_info SET value = ? WHERE key = ?`,
            [String(DB_VERSION), DB_VERSION_KEY]
          );
        } else {
          await db.runAsync(
            `INSERT INTO app_info (key, value) VALUES (?, ?)`,
            [DB_VERSION_KEY, String(DB_VERSION)]
          );
        }
      }
      
    } catch (error) {
      console.error('数据库初始化失败:', error);
      db = null; // 重置数据库实例
      throw error;
    } finally {
      isInitializing = false;
      initializationPromise = null;
    }
  })();

  await initializationPromise;
  return db;
};

/**
 * 确保数据库已初始化
 */
export const ensureDb = () => {
  if (!db) {
    throw new Error('数据库未初始化。请先调用 initDatabase()');
  }
  return db;
};

/**
 * 获取数据库实例 (如果已初始化)
 */
export const getDb = () => db;
