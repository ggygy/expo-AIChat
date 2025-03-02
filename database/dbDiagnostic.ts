import * as SQLite from 'expo-sqlite';
import { initDatabase } from './index';

/**
 * 数据库诊断工具 - 用于检查和报告数据库结构
 */
export async function diagnoseDatabase(): Promise<{
  success: boolean;
  tables: string[];
  tableSchemas: Record<string, any[]>;
  error?: string;
}> {
  try {
    // 确保数据库已初始化
    await initDatabase();
    
    // 使用异步API代替同步API
    const db = await SQLite.openDatabaseAsync('chat.db');
    
    // 获取所有表
    const tablesResult = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';"
    );
    
    const tables = tablesResult ? tablesResult.map(row => row.name) : [];
    console.log('数据库中的表:', tables);
    
    // 获取每个表的结构
    const tableSchemas: Record<string, any[]> = {};
    for (const table of tables) {
      const schemaResult = await db.getAllAsync(`PRAGMA table_info('${table}');`);
      tableSchemas[table] = schemaResult || [];
      console.log(`表 ${table} 的结构:`, schemaResult);
    }
    
    return {
      success: true,
      tables,
      tableSchemas
    };
  } catch (error) {
    console.error('数据库诊断失败:', error);
    return {
      success: false,
      tables: [],
      tableSchemas: {},
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
}

/**
 * 尝试修复数据库中可能的问题
 */
export async function tryRepairDatabase(): Promise<{
  success: boolean;
  repairAttempted: boolean;
  message: string;
}> {
  try {
    // 先运行诊断
    const diagnosis = await diagnoseDatabase();
    if (!diagnosis.success) {
      return {
        success: false,
        repairAttempted: false,
        message: `诊断失败: ${diagnosis.error}`
      };
    }
    
    // 如果已有列，无需修复
    if (
      diagnosis.tables.includes('messages') && 
      diagnosis.tableSchemas['messages'] && 
      diagnosis.tableSchemas['messages'].some(col => col.name === 'thinking_content') &&
      diagnosis.tableSchemas['messages'].some(col => col.name === 'token_usage')
    ) {
      return {
        success: true,
        repairAttempted: false,
        message: '数据库结构正常，无需修复'
      };
    }
    
    // 使用异步API代替同步API
    const db = await SQLite.openDatabaseAsync('chat.db');
    
    // 尝试添加缺失的列
    let repairAttempted = false;
    let repairMessage = '';
    
    try {
      if (!diagnosis.tableSchemas['messages']?.some(col => col.name === 'thinking_content')) {
        await db.execAsync(`ALTER TABLE messages ADD COLUMN thinking_content TEXT;`);
        repairAttempted = true;
        repairMessage += '已添加thinking_content列; ';
      }
    } catch (e) {
      repairMessage += `添加thinking_content失败: ${e instanceof Error ? e.message : '未知错误'}; `;
    }
    
    try {
      if (!diagnosis.tableSchemas['messages']?.some(col => col.name === 'token_usage')) {
        await db.execAsync(`ALTER TABLE messages ADD COLUMN token_usage TEXT;`);
        repairAttempted = true;
        repairMessage += '已添加token_usage列; ';
      }
    } catch (e) {
      repairMessage += `添加token_usage失败: ${e instanceof Error ? e.message : '未知错误'}; `;
    }
    
    try {
      if (!diagnosis.tableSchemas['messages']?.some(col => col.name === 'messageType')) {
        await db.execAsync(`ALTER TABLE messages ADD COLUMN messageType TEXT DEFAULT 'normal';`);
        repairAttempted = true;
        repairMessage += '已添加messageType列; ';
      }
    } catch (e) {
      repairMessage += `添加messageType失败: ${e instanceof Error ? e.message : '未知错误'}; `;
    }
    
    return {
      success: true,
      repairAttempted,
      message: repairAttempted ? `修复尝试完成: ${repairMessage}` : '无需修复'
    };
  } catch (error) {
    console.error('修复数据库失败:', error);
    return {
      success: false,
      repairAttempted: true,
      message: `修复失败: ${error instanceof Error ? error.message : '未知错误'}`
    };
  }
}
