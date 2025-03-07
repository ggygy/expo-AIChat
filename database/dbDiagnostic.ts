import * as SQLite from 'expo-sqlite';
import { initDatabase } from './index';
import { ensureDb, columnExists, addColumn } from './connection';

/**
 * 数据库诊断结果接口
 */
interface DiagnosisResult {
  success: boolean;
  tables: string[];
  tableSchemas: Record<string, {name: string, type: string}[]>;
  integrityCheck: string;
  message: string;
}

/**
 * 数据库修复结果接口
 */
interface RepairResult {
  success: boolean;
  message: string;
  details: string[];
}

/**
 * 诊断数据库健康状况
 */
export async function diagnoseDatabase(): Promise<DiagnosisResult> {
  const database = ensureDb();
  const result: DiagnosisResult = {
    success: true,
    tables: [],
    tableSchemas: {},
    integrityCheck: '',
    message: '数据库诊断完成'
  };
  
  try {
    // 检查所有表
    const tablesResult = await database.getAllAsync<{name: string}>(
      `SELECT name FROM sqlite_master WHERE type='table'`
    );
    result.tables = tablesResult.map(table => table.name);
    
    // 对每个表进行架构检查
    for (const table of result.tables) {
      const schemaResult = await database.getAllAsync<{name: string, type: string}>(
        `PRAGMA table_info(${table})`
      );
      result.tableSchemas[table] = schemaResult;
    }
    
    // 运行完整性检查
    const integrityResult = await database.getFirstAsync<{integrity_check: string}>(
      `PRAGMA integrity_check`
    );
    result.integrityCheck = integrityResult?.integrity_check || '';
    
    if (result.integrityCheck !== 'ok') {
      result.success = false;
      result.message = '数据库完整性检查失败';
    }
    
    return result;
  } catch (error) {
    result.success = false;
    result.message = `数据库诊断失败: ${error instanceof Error ? error.message : '未知错误'}`;
    return result;
  }
}

/**
 * 尝试修复数据库问题
 */
export async function tryRepairDatabase(): Promise<RepairResult> {
  const database = ensureDb();
  const result: RepairResult = {
    success: true,
    message: '数据库修复完成',
    details: []
  };
  
  try {
    // 1. 尝试添加缺少的列
    const requiredColumns = [
      { table: 'messages', column: 'thinking_content', type: 'TEXT' },
      { table: 'messages', column: 'token_usage', type: 'TEXT' },
      { table: 'messages', column: 'messageType', type: 'TEXT', defaultValue: 'normal' }
    ];
    
    for (const { table, column, type, defaultValue } of requiredColumns) {
      const exists = await columnExists(database, table, column);
      if (!exists) {
        result.details.push(`添加列 ${table}.${column}`);
        await addColumn(database, table, column, type, defaultValue);
      } else {
        result.details.push(`列 ${table}.${column} 已存在`);
      }
    }
    
    // 2. 尝试VACUUM数据库以优化存储
    result.details.push('执行数据库VACUUM操作');
    await database.execAsync('VACUUM');
    
    // 3. 重建索引
    result.details.push('重建消息索引');
    await database.execAsync(`
      DROP INDEX IF EXISTS idx_messages_chatId;
      DROP INDEX IF EXISTS idx_messages_timestamp;
      CREATE INDEX idx_messages_chatId ON messages(chatId);
      CREATE INDEX idx_messages_timestamp ON messages(timestamp);
    `);
    
    return result;
  } catch (error) {
    result.success = false;
    result.message = `数据库修复失败: ${error instanceof Error ? error.message : '未知错误'}`;
    return result;
  }
}
