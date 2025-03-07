import { ensureDb, columnExists, addColumn } from './connection';

/**
 * 数据库架构管理
 */
export const schemaDb = {
  /**
   * 确保数据库架构是最新的，添加任何缺少的列
   */
  async ensureSchema(): Promise<boolean> {
    const database = ensureDb();
    try {
      console.log('检查并更新数据库架构...');
      
      // 检查并添加思考内容列
      const hasThinkingColumn = await columnExists(database, 'messages', 'thinking_content');
      if (!hasThinkingColumn) {
        console.log('添加 thinking_content 列到 messages 表...');
        await addColumn(database, 'messages', 'thinking_content', 'TEXT');
      }
      
      // 检查并添加令牌使用列
      const hasTokenUsage = await columnExists(database, 'messages', 'token_usage');
      if (!hasTokenUsage) {
        console.log('添加 token_usage 列到 messages 表...');
        await addColumn(database, 'messages', 'token_usage', 'TEXT');
      }
      
      // 检查并添加消息类型列
      const hasMessageType = await columnExists(database, 'messages', 'messageType');
      if (!hasMessageType) {
        console.log('添加 messageType 列到 messages 表...');
        await addColumn(database, 'messages', 'messageType', 'TEXT', 'normal');
      }
      
      console.log('数据库架构更新完成');
      return true;
    } catch (error) {
      console.error('更新数据库架构失败:', error);
      return false;
    }
  },

  /**
   * 创建新表，如果不存在
   */
  async createTableIfNotExists(tableName: string, schema: string) {
    const database = ensureDb();
    try {
      await database.execAsync(`CREATE TABLE IF NOT EXISTS ${tableName} (${schema});`);
      return true;
    } catch (error) {
      console.error(`创建表 ${tableName} 失败:`, error);
      return false;
    }
  }
}
