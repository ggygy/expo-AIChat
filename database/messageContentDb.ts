import { ensureDb, columnExists, addColumn } from './connection';

/**
 * 消息内容数据库操作
 */
export const messageContentDb = {
  /**
   * 更新消息内容
   */
  async updateMessageContent(
    messageId: string, 
    content: string, 
    status: string = 'sent', 
    contentType: string = 'text',
    error: string | null = null
  ) {
    const database = ensureDb();
    try {
      console.log(`更新消息内容: ${messageId}, 内容长度: ${content.length}`);
      await database.runAsync(
        `UPDATE messages 
         SET content = ?, status = ?, contentType = ?, error = ? 
         WHERE id = ?`,
        [content, status, contentType, error, messageId]
      );
      console.log(`消息 ${messageId} 更新成功`);
      return { success: true };
    } catch (error) {
      console.error('更新消息内容失败:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  },

  /**
   * 更新消息内容和令牌使用情况
   */
  async updateMessageContentWithTokens(
    messageId: string, 
    content: string, 
    status: string = 'sent', 
    contentType: string = 'text', 
    tokenUsage?: any
  ) {
    const database = ensureDb();
    try {
      // 检查token_usage列是否存在
      const hasTokenUsage = await columnExists(database, 'messages', 'token_usage');
      
      console.log(`更新带令牌的消息: ${messageId}, 内容长度: ${content.length}, 有token使用: ${!!tokenUsage}`);
      
      if (hasTokenUsage && tokenUsage) {
        // 如果列存在且有token数据，则一并更新
        const tokenUsageJson = JSON.stringify(tokenUsage);
        await database.runAsync(
          `UPDATE messages 
           SET content = ?, status = ?, contentType = ?, token_usage = ?
           WHERE id = ?`,
          [content, status, contentType, tokenUsageJson, messageId]
        );
      } else {
        // 否则只更新内容
        await database.runAsync(
          `UPDATE messages 
           SET content = ?, status = ?, contentType = ?
           WHERE id = ?`,
          [content, status, contentType, messageId]
        );
      }
      
      console.log(`消息 ${messageId} 更新成功`);
      return { success: true };
    } catch (error) {
      console.error('更新带令牌的消息内容失败:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  },

  /**
   * 更新消息内容和思考内容
   */
  async updateMessageWithThinking(
    messageId: string, 
    content: string, 
    thinkingContent: string,
    status: string = 'sent', 
    contentType: string = 'text',
    tokenUsage?: any
  ) {
    const database = ensureDb();
    try {
      console.log(`更新带思考的消息: ${messageId}, 内容长度: ${content.length}, 思考长度: ${thinkingContent.length}`);
      
      // 检查思考内容列是否存在
      const hasThinkingColumn = await columnExists(database, 'messages', 'thinking_content');
      
      // 检查token使用列是否存在
      const hasTokenUsage = await columnExists(database, 'messages', 'token_usage');
      
      if (!hasThinkingColumn) {
        console.warn('缺少thinking_content列，无法保存思考内容');
        
        // 尝试添加列
        try {
          await addColumn(database, 'messages', 'thinking_content', 'TEXT');
          console.log('成功添加thinking_content列');
        } catch (addColumnError) {
          console.warn('无法添加thinking_content列，跳过思考内容更新');
          console.warn('跳过思考内容更新，因为列不存在');
          
          // 即使无法添加列，仍然尝试更新普通内容
          return await this.updateMessageContentWithTokens(
            messageId, content, status, contentType, tokenUsage
          );
        }
      }
      
      let tokenUsageJson = null;
      if (tokenUsage) {
        tokenUsageJson = JSON.stringify(tokenUsage);
      }
      
      // 构建SQL查询
      let sql = `UPDATE messages SET content = ?, status = ?, contentType = ?`;
      const params: any[] = [content, status, contentType];
      
      // 如果思考列存在，添加思考内容
      if (hasThinkingColumn || await columnExists(database, 'messages', 'thinking_content')) {
        sql += `, thinking_content = ?`;
        params.push(thinkingContent);
      }
      
      // 如果token列存在且有token数据，添加token使用情况
      if (hasTokenUsage && tokenUsage) {
        sql += `, token_usage = ?`;
        params.push(tokenUsageJson);
      }
      
      // 添加WHERE子句
      sql += ` WHERE id = ?`;
      params.push(messageId);
      
      // 执行更新
      await database.runAsync(sql, params);
      
      console.log(`消息 ${messageId} 更新成功`);
      return { success: true };
    } catch (error) {
      console.error('更新带思考的消息内容失败:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
};
