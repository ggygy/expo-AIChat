import { ensureDb, addColumn } from './connection';

/**
 * 数据库架构管理
 */
export const schemaDb = {
  /**
   * 确保数据库架构是最新的
   */
  async ensureSchema() {
    const database = ensureDb();
    try {
      console.log('确保数据库架构完整...');
      
      // 检查并创建所需的列
      const columns = [
        { name: 'token_usage', type: 'TEXT' },
        { name: 'thinking_content', type: 'TEXT' },
        { name: 'messageType', type: 'TEXT', defaultValue: 'normal' }
      ];
      
      for (const column of columns) {
        const added = await addColumn(
          database, 
          'messages', 
          column.name, 
          column.type, 
          column.defaultValue
        );
        
        if (added) {
          console.log(`已添加或确认 ${column.name} 列存在于 messages 表`);
        } else {
          console.warn(`未能确保 ${column.name} 列存在，但将继续执行`);
        }
      }
      
      return true;
    } catch (error) {
      console.error('确保数据库架构失败:', error);
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
