import { messageDb, initDatabase } from './index';
import { diagnoseDatabase, tryRepairDatabase } from './dbDiagnostic';

/**
 * 完整初始化数据库，包括诊断、修复和更新架构
 */
export async function setupDatabase() {
  try {
    console.log('开始完整数据库初始化...');
    
    // 1. 初始化数据库连接
    await initDatabase();
    
    // 2. 诊断数据库
    console.log('诊断数据库...');
    const diagnosis = await diagnoseDatabase();
    if (!diagnosis.success) {
      console.warn('数据库诊断失败，将尝试继续使用');
    } else {
      console.log('数据库诊断完成');
    }
    
    // 3. 尝试修复可能的问题
    console.log('尝试修复数据库...');
    const repair = await tryRepairDatabase();
    console.log('修复结果:', repair.message);
    
    // 4. 确保数据库架构最新
    console.log('确保数据库架构...');
    await messageDb.ensureSchema();
    
    // 5. 二次诊断确认
    const postDiagnosis = await diagnoseDatabase();
    if (postDiagnosis.success) {
      const hasThinkingColumn = postDiagnosis.tableSchemas['messages']?.some(col => col.name === 'thinking_content');
      const hasTokenUsage = postDiagnosis.tableSchemas['messages']?.some(col => col.name === 'token_usage');
      const hasMessageType = postDiagnosis.tableSchemas['messages']?.some(col => col.name === 'messageType');
      
      console.log(`数据库列状态: thinking_content=${hasThinkingColumn}, token_usage=${hasTokenUsage}, messageType=${hasMessageType}`);
      
      if (!hasThinkingColumn || !hasTokenUsage || !hasMessageType) {
        console.warn('警告：数据库中仍然缺少一些列，应用可能无法正常工作');
      }
    }
    
    console.log('数据库初始化完成');
    return true;
  } catch (error) {
    console.error('数据库初始化失败:', error);
    return false;
  }
}
