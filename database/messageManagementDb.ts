import { ensureDb } from './connection';

/**
 * 消息管理数据库操作
 */
export const messageManagementDb = {
  /**
   * 删除特定聊天的所有消息
   */
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

  /**
   * 删除单条消息
   */
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

  /**
   * 获取聊天中消息总数
   */
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
  },
}
