import { ensureDb } from './connection';

/**
 * 消息管理数据库操作
 */
export const messageManagementDb = {
  /**
   * 删除指定的多条消息
   */
  async deleteMessages(messageIds: string[]): Promise<boolean> {
    if (!messageIds.length) return true;
    
    const database = ensureDb();
    try {
      // 使用参数化查询安全删除消息
      const placeholders = messageIds.map(() => '?').join(',');
      await database.runAsync(
        `DELETE FROM messages WHERE id IN (${placeholders})`,
        messageIds
      );
      console.log(`已删除 ${messageIds.length} 条消息`);
      return true;
    } catch (error) {
      console.error('删除消息失败:', error);
      return false;
    }
  },

  /**
   * 删除单条消息
   */
  async deleteMessage(messageId: string): Promise<boolean> {
    const database = ensureDb();
    try {
      await database.runAsync(
        'DELETE FROM messages WHERE id = ?',
        [messageId]
      );
      console.log(`已删除消息 ${messageId}`);
      return true;
    } catch (error) {
      console.error(`删除消息 ${messageId} 失败:`, error);
      return false;
    }
  },

  /**
   * 获取指定聊天的消息数量
   */
  async getMessageCount(chatId: string): Promise<number> {
    const database = ensureDb();
    try {
      const result = await database.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM messages WHERE chatId = ?',
        [chatId]
      );
      return result ? result.count : 0;
    } catch (error) {
      console.error('获取消息数量失败:', error);
      return 0;
    }
  }
};
