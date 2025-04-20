import { type ToolCall } from '@langchain/core/dist/messages/tool';
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
   * 更新消息内容和元数据
   * @param messageId 消息ID
   * @param content 消息内容
   * @param status 消息状态
   * @param contentType 内容类型
   * @param metadata 元数据对象，可包含tokenUsage、toolCalls等
   */
  async updateMessageContentWithMeta(
    messageId: string, 
    content: string, 
    status: string = 'sent', 
    contentType: string = 'text', 
    metadata?: {
      tokenUsage?: any,
      toolCalls?: any[],
      invalidToolCalls?: any[],
      thinkingContent?: string,
      additionalMetadata?: any
    }
  ) {
    const database = ensureDb();
    try {
      console.log(`更新带元数据的消息: ${messageId}, 内容长度: ${content.length}`);
      
      // 检查各列是否存在
      const hasTokenUsage = await columnExists(database, 'messages', 'token_usage');
      const hasToolCalls = await columnExists(database, 'messages', 'tool_calls');
      const hasInvalidToolCalls = await columnExists(database, 'messages', 'invalid_tool_calls');
      const hasThinkingContent = await columnExists(database, 'messages', 'thinking_content');
      const hasMetadata = await columnExists(database, 'messages', 'metadata');
      
      // 尝试添加缺少的列
      if (metadata?.toolCalls && !hasToolCalls) {
        try {
          await addColumn(database, 'messages', 'tool_calls', 'TEXT');
          console.log('成功添加tool_calls列');
        } catch (e) {
          console.warn('无法添加tool_calls列', e);
        }
      }
      
      if (metadata?.invalidToolCalls && !hasInvalidToolCalls) {
        try {
          await addColumn(database, 'messages', 'invalid_tool_calls', 'TEXT');
          console.log('成功添加invalid_tool_calls列');
        } catch (e) {
          console.warn('无法添加invalid_tool_calls列', e);
        }
      }
      
      if (metadata?.additionalMetadata && !hasMetadata) {
        try {
          await addColumn(database, 'messages', 'metadata', 'TEXT');
          console.log('成功添加metadata列');
        } catch (e) {
          console.warn('无法添加metadata列', e);
        }
      }
      
      // 构建SQL查询和参数
      let sql = `UPDATE messages SET content = ?, status = ?, contentType = ?`;
      const params: any[] = [content, status, contentType];
      
      // 添加token使用信息
      if (hasTokenUsage && metadata?.tokenUsage) {
        sql += `, token_usage = ?`;
        params.push(JSON.stringify(metadata.tokenUsage));
      }
      
      // 添加工具调用信息
      if ((hasToolCalls || await columnExists(database, 'messages', 'tool_calls')) && metadata?.toolCalls) {
        sql += `, tool_calls = ?`;
        params.push(JSON.stringify(metadata.toolCalls));
      }
      
      // 添加无效工具调用信息
      if ((hasInvalidToolCalls || await columnExists(database, 'messages', 'invalid_tool_calls')) && metadata?.invalidToolCalls) {
        sql += `, invalid_tool_calls = ?`;
        params.push(JSON.stringify(metadata.invalidToolCalls));
      }
      
      // 添加思考内容
      if ((hasThinkingContent || await columnExists(database, 'messages', 'thinking_content')) && metadata?.thinkingContent) {
        sql += `, thinking_content = ?`;
        params.push(metadata.thinkingContent);
      }
      
      // 添加其他元数据
      if ((hasMetadata || await columnExists(database, 'messages', 'metadata')) && metadata?.additionalMetadata) {
        sql += `, metadata = ?`;
        params.push(JSON.stringify(metadata.additionalMetadata));
      }
      
      // 完成SQL语句
      sql += ` WHERE id = ?`;
      params.push(messageId);
      
      // 执行更新
      await database.runAsync(sql, params);
      
      console.log(`消息 ${messageId} 更新成功，包含元数据字段`);
      return { success: true };
    } catch (error) {
      console.error('更新带元数据的消息内容失败:', error);
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
    tokenUsage?: any,
    metadata?: {
      toolCalls?: ToolCall[],
      invalidToolCalls?: any[],
      additionalMetadata?: any
    }
  ) {
    // 将思考内容和其他元数据合并，调用通用的元数据更新方法
    return await this.updateMessageContentWithMeta(
      messageId,
      content,
      status,
      contentType,
      {
        tokenUsage,
        thinkingContent,
        toolCalls: metadata?.toolCalls,
        invalidToolCalls: metadata?.invalidToolCalls,
        additionalMetadata: metadata?.additionalMetadata
      }
    );
  }
};
