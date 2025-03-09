import { Message } from '@/constants/chat';
import { messageDb } from '@/database';

/**
 * 验证消息状态，检测UI显示与数据库存储是否一致
 * @param botId 机器人ID
 * @param uiMessages UI中显示的消息
 */
export async function verifyMessageSync(botId: string, uiMessages: Message[]): Promise<void> {
  try {
    // 从数据库获取最近的消息
    const dbMessages = await messageDb.getMessages(botId, 10, 0);
    
    console.log('=== 消息同步状态 ===');
    console.log(`UI显示消息数量: ${uiMessages.length}`);
    console.log(`数据库最新消息数量: ${dbMessages.length}`);
    
    // 检查UI消息是否都在数据库中
    const missingInDb = uiMessages.filter(uiMsg => 
      !dbMessages.find(dbMsg => dbMsg.id === uiMsg.id)
    );
    
    if (missingInDb.length > 0) {
      console.warn('UI中存在但数据库中缺失的消息:', 
        missingInDb.map(m => `${m.role}:${m.id.substring(0, 8)}`));
      
      // 尝试自动修复缺失的消息
      for (const msg of missingInDb) {
        try {
          console.log(`自动修复: 保存消息 ${msg.id.substring(0, 8)} 到数据库`);
          await messageDb.addMessage(botId, msg);
        } catch (error) {
          console.error(`无法修复消息 ${msg.id}:`, error);
        }
      }
    } else {
      console.log('所有UI消息均已存储在数据库中');
    }
    
    // 检查数据库消息是否都在UI中
    const missingInUI = dbMessages.filter(dbMsg => 
      !uiMessages.find(uiMsg => uiMsg.id === dbMsg.id)
    );
    
    if (missingInUI.length > 0) {
      console.warn('数据库中存在但UI未显示的消息:', 
        missingInUI.map(m => `${m.role}:${m.id.substring(0, 8)}`));
    } else {
      console.log('所有数据库消息均已显示在UI中');
    }
    
    console.log('=====================');
  } catch (error) {
    console.error('消息同步验证失败:', error);
  }
}

/**
 * 强制同步数据库和UI的消息
 * @param botId 机器人ID 
 * @param currentMessages 当前UI上的消息
 * @param setMessages 设置消息的函数
 */
export async function forceSyncMessages(
  botId: string, 
  currentMessages: Message[],
  setMessages: (messages: Message[]) => void
): Promise<boolean> {
  try {
    // 从数据库获取所有消息
    const dbMessages = await messageDb.getMessages(botId, 50, 0);
    
    // 如果数据库中有消息但UI中没有显示，则更新UI
    if (dbMessages.length > 0 && 
        (currentMessages.length === 0 || 
         dbMessages.length > currentMessages.length)) {
      
      console.log(`强制同步: 数据库有${dbMessages.length}条消息，UI显示${currentMessages.length}条`);
      
      // 设置消息到UI
      setMessages(dbMessages);
      return true;
    } 
    
    // 如果UI消息不在数据库中，尝试保存
    if (currentMessages.length > 0 && dbMessages.length < currentMessages.length) {
      console.log('UI消息数量多于数据库，尝试保存未存储消息');
      
      for (const uiMsg of currentMessages) {
        const msgExists = dbMessages.some(dbMsg => dbMsg.id === uiMsg.id);
        
        if (!msgExists) {
          try {
            await messageDb.addMessage(botId, uiMsg);
            console.log(`已保存消息 ${uiMsg.id.substring(0, 8)} 到数据库`);
          } catch (err) {
            console.error(`保存消息 ${uiMsg.id} 失败:`, err);
          }
        }
      }
      
      return true;
    }
    
    console.log('消息已同步，无需更新');
    return false;
  } catch (error) {
    console.error('强制同步消息失败:', error);
    return false;
  }
}

/**
 * 获取最新的用户和助手消息对
 * @param botId 机器人ID
 */
export async function getLatestMessagePair(botId: string): Promise<[Message | null, Message | null]> {
  try {
    // 获取最近的消息
    const messages = await messageDb.getMessages(botId, 5, 0);
    
    // 找到最新的助手消息
    const assistantMsg = messages.find(m => m.role === 'assistant');
    
    // 找到与之匹配的用户消息（通常是紧邻之前的消息）
    let userMsg: Message | null = null;
    if (assistantMsg) {
      const assistantIndex = messages.findIndex(m => m.id === assistantMsg.id);
      
      if (assistantIndex > 0) {
        userMsg = messages[assistantIndex - 1].role === 'user' ? 
          messages[assistantIndex - 1] : null;
      }
    }
    
    return [userMsg, assistantMsg as Message];
  } catch (error) {
    console.error('获取最新消息对失败:', error);
    return [null, null];
  }
}

/**
 * 更新 hooks/chat/index.ts 导出新工具
 */
// filepath: d:\reactNative\expo-AIChat\hooks\chat\index.ts
export * from './MessageSync';
