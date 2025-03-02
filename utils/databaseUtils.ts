import * as SQLite from 'expo-sqlite';
import Toast from 'react-native-toast-message';
import i18n from '@/i18n/i18n';

/**
 * 检查表中是否存在特定列
 */
export async function columnExists(database: SQLite.SQLiteDatabase, table: string, column: string): Promise<boolean> {
  try {
    const result = await database.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM pragma_table_info('${table}') WHERE name='${column}'`
    );
    return result ? result.count > 0 : false;
  } catch (error) {
    console.error(`检查列 ${column} 是否存在失败:`, error);
    return false;
  }
}

/**
 * 添加列到表中
 */
export async function addColumn(
  database: SQLite.SQLiteDatabase, 
  table: string, 
  column: string, 
  type: string, 
  defaultValue?: string
): Promise<boolean> {
  try {
    let sql = `ALTER TABLE ${table} ADD COLUMN ${column} ${type}`;
    if (defaultValue !== undefined) {
      sql += ` DEFAULT '${defaultValue}'`;
    }
    await database.execAsync(sql);
    console.log(`已添加列 ${column} 到表 ${table}`);
    return true;
  } catch (error) {
    console.error(`添加列 ${column} 失败:`, error);
    return false;
  }
}

/**
 * 尝试修复数据库结构
 */
export async function fixDatabaseStructure(database: SQLite.SQLiteDatabase): Promise<boolean> {
  try {
    // 检查并添加 messageType 列
    const hasMessageType = await columnExists(database, 'messages', 'messageType');
    if (!hasMessageType) {
      console.log('正在添加 messageType 列...');
      const success = await addColumn(database, 'messages', 'messageType', 'TEXT', 'normal');
      if (!success) {
        Toast.show({
          type: 'error',
          text1: i18n.t('common.error'),
          text2: i18n.t('common.databaseUpdateError')
        });
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('修复数据库结构失败:', error);
    Toast.show({
      type: 'error',
      text1: i18n.t('common.error'),
      text2: i18n.t('common.databaseUpdateError')
    });
    return false;
  }
}

/**
 * 打印表结构
 */
export async function logTableSchema(database: SQLite.SQLiteDatabase, table: string): Promise<void> {
  try {
    const schema = await database.getAllAsync(`PRAGMA table_info(${table})`);
    console.log(`表 ${table} 的结构:`, JSON.stringify(schema, null, 2));
  } catch (error) {
    console.error(`获取表 ${table} 结构失败:`, error);
  }
}

/**
 * 检查并创建缺失的表
 */
export async function ensureTables(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
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
    
    CREATE TABLE IF NOT EXISTS app_info (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_messages_chatId ON messages(chatId);
    CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
  `);
}
