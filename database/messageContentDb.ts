import { ensureDb, columnExists, addColumn } from './connection';

/**
 * 消息内容更新数据库操作
 */
export const messageContentDb = {
  /**
   * 更新消息内容
   */
  async updateMessageContent(messageId: string, content: string, status: string = 'sent', contentType?: string, messageType?: string) {
    const database = ensureDb();
    try {
      console.log(`更新消息内容: ${messageId}, 内容长度: ${content.length}, 状态: ${status}, 类型: ${contentType || '默认'}, 消息类型: ${messageType || '默认'}`);
      
      // 删除消息内容中可能导致类型警告的字段
      let safeContent = content;
      
      // 尝试解析内容中可能包含的 JSON 对象，处理包含特殊字段的情况
      try {
        // 检查内容是否看起来像 JSON
        if (content.trim().startsWith('{') && content.trim().endsWith('}')) {
          const contentObj = JSON.parse(content);
          // 移除可能导致类型兼容问题的字段
          if (contentObj && typeof contentObj === 'object') {
            delete contentObj.total_tokens;
            delete contentObj.completion_tokens;
            delete contentObj.prompt_tokens;
            safeContent = JSON.stringify(contentObj);
          }
        }
      } catch (parseErr) {
        // 如果解析失败，使用原始内容
        console.log('内容不是 JSON 格式，使用原始内容');
      }
      
      // 先检查 messageType 列是否存在
      const hasMessageType = await columnExists(database, 'messages', 'messageType');
      
      // 构建更新查询
      let query = `UPDATE messages SET content = ?, status = ?`;
      const params = [safeContent, status];
      
      if (contentType) {
        query += `, contentType = ?`;
        params.push(contentType);
      }
      
      if (messageType && hasMessageType) {
        query += `, messageType = ?`;
        params.push(messageType);
      }
      
      query += ` WHERE id = ?`;
      params.push(messageId);
      
      await database.runAsync(query, params);
      
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
   * 更新消息内容并包含 token 使用信息
   */
  async updateMessageContentWithTokens(
    messageId: string, 
    content: string, 
    status: string = 'sent', 
    contentType?: string, 
    messageType?: string,
    tokenUsage?: { 
      total_tokens?: number; 
      prompt_tokens?: number;
      completion_tokens?: number;
    }
  ) {
    const database = ensureDb();
    try {
      console.log(`更新消息内容与Token: ${messageId}, 内容长度: ${content.length}, 状态: ${status}, tokens: ${tokenUsage?.total_tokens || '未知'}`);
      
      // 处理内容安全性，与原先方法相同
      let safeContent = content;
      try {
        if (content.trim().startsWith('{') && content.trim().endsWith('}')) {
          const contentObj = JSON.parse(content);
          if (contentObj && typeof contentObj === 'object') {
            delete contentObj.total_tokens;
            delete contentObj.completion_tokens;
            delete contentObj.prompt_tokens;
            safeContent = JSON.stringify(contentObj);
          }
        }
      } catch (parseErr) {
        console.log('内容不是 JSON 格式，使用原始内容');
      }
      
      // 检查是否存在所需列
      const hasMessageType = await columnExists(database, 'messages', 'messageType');
      const hasTokensColumn = await columnExists(database, 'messages', 'token_usage');
      
      // 如果没有token_usage列，添加它
      if (!hasTokensColumn && tokenUsage) {
        try {
          await addColumn(database, 'messages', 'token_usage', 'TEXT');
          console.log('已添加token_usage列到messages表');
        } catch (err) {
          console.error('添加token_usage列失败，继续执行', err);
        }
      }
      
      // 准备token使用信息的JSON字符串
      let tokenUsageJson: string | null = null;
      if (tokenUsage) {
        tokenUsageJson = JSON.stringify(tokenUsage);
      }
      
      // 构建更新查询
      let query = `UPDATE messages SET content = ?, status = ?`;
      const params: any[] = [safeContent, status];
      
      if (contentType) {
        query += `, contentType = ?`;
        params.push(contentType);
      }
      
      if (messageType && hasMessageType) {
        query += `, messageType = ?`;
        params.push(messageType);
      }
      
      // 添加token使用信息
      if (tokenUsageJson && hasTokensColumn) {
        query += `, token_usage = ?`;
        params.push(tokenUsageJson);
      }
      
      query += ` WHERE id = ?`;
      params.push(messageId);
      
      await database.runAsync(query, params);
      
      return { success: true };
    } catch (error) {
      console.error('更新消息内容与Token失败:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  },

  /**
   * 更新带思考内容的消息
   */
  async updateMessageWithThinking(
    messageId: string, 
    content: string,
    thinkingContent: string,
    status: string = 'sent', 
    contentType?: string,
    tokenUsage?: { 
      total_tokens?: number; 
      prompt_tokens?: number;
      completion_tokens?: number;
    }
  ) {
    const database = ensureDb();
    try {
      console.log(`更新带思考的消息: ${messageId}, 内容长度: ${content.length}, 思考长度: ${thinkingContent.length}`);
      
      // 检查列是否存在，不使用addColumn直接在这里添加列
      // 而是依赖ensureSchema方法预先创建好架构
      const hasThinkingColumn = await columnExists(database, 'messages', 'thinking_content');
      const hasTokensColumn = await columnExists(database, 'messages', 'token_usage');
      
      // 如果缺少必要的列，尝试刷新架构
      if (!hasThinkingColumn) {
        console.warn('缺少thinking_content列，无法保存思考内容');
      }
      
      // 准备token使用信息的JSON字符串
      let tokenUsageJson: string | null = null;
      if (tokenUsage) {
        tokenUsageJson = JSON.stringify(tokenUsage);
      }
      
      // 开始构建查询
      let query = `UPDATE messages SET content = ?, status = ?`;
      const params: any[] = [content, status];
      
      if (contentType) {
        query += `, contentType = ?`;
        params.push(contentType);
      }
      
      // 只有当列存在时才添加thinking_content参数
      if (hasThinkingColumn) {
        query += `, thinking_content = ?`;
        params.push(thinkingContent);
      } else {
        console.warn('跳过思考内容更新，因为列不存在');
      }
      
      // 只有当列存在时才添加token_usage参数
      if (tokenUsageJson && hasTokensColumn) {
        query += `, token_usage = ?`;
        params.push(tokenUsageJson);
      } else if (tokenUsageJson) {
        console.warn('跳过token使用信息更新，因为列不存在');
      }
      
      // 添加WHERE子句
      query += ` WHERE id = ?`;
      params.push(messageId);
      
      // 执行更新
      await database.runAsync(query, params);
      console.log(`消息 ${messageId} 更新成功`);
      
      return { success: true };
    } catch (error) {
      console.error('更新带思考的消息失败:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  },
}
