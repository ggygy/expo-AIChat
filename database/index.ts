import { initDatabase as initDb, ensureDb, getDb, columnExists, addColumn } from './connection';
import { messageDb as rawMessageDb } from './messageDb';
import { messageContentDb } from './messageContentDb';
import { messageManagementDb } from './messageManagementDb';
import { schemaDb } from './schemaDb';

// 保持原有的 initDatabase 接口不变
export const initDatabase = initDb;

// 构建完全合并的 messageDb，确保与原先结构完全一致
export const messageDb = {
  // 基础消息操作
  messageExists: rawMessageDb.messageExists,
  addMessage: rawMessageDb.addMessage,
  getMessages: rawMessageDb.getMessages,
  updateMessageStatus: rawMessageDb.updateMessageStatus,
  
  // 消息内容操作
  updateMessageContent: messageContentDb.updateMessageContent,
  updateMessageContentWithMeta: messageContentDb.updateMessageContentWithMeta,
  updateMessageWithThinking: messageContentDb.updateMessageWithThinking,
  
  // 消息管理操作
  deleteMessages: messageManagementDb.deleteMessages,
  deleteMessage: messageManagementDb.deleteMessage,
  getMessageCount: messageManagementDb.getMessageCount,
  
  // 架构操作
  ensureSchema: schemaDb.ensureSchema
};

// 导出供内部使用的工具方法
export {
  ensureDb,
  getDb,
  columnExists,
  addColumn
};

// 不导出其他内部模块，保持原有API签名不变
