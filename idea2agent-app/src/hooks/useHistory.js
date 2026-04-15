import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = 'history_v1';

/**
 * 生成唯一 ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * 历史记录 Hook
 * @param {Function} onHistoryUpdate - 历史更新时的回调
 */
export function useHistory(onHistoryUpdate) {
  /**
   * 从存储加载历史记录
   */
  const loadHistory = async () => {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (err) {
      console.error('loadHistory error:', err);
      return [];
    }
  };

  /**
   * 添加历史记录
   * @param {string} idea - 用户输入的想法
   * @param {string} modelId - 使用的模型 ID
   * @param {string} content - AI 生成的完整文档
   */
  const addHistory = async (idea, modelId, content) => {
    try {
      const history = await loadHistory();
      const newRecord = {
        id: generateId(),
        createdAt: new Date().toISOString(),
        idea: idea.trim(),
        modelId,
        content,
      };
      // 新记录插入到最前面
      const updated = [newRecord, ...history];
      // 最多保留 100 条
      const trimmed = updated.slice(0, 100);
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
      onHistoryUpdate?.(trimmed);
      return newRecord;
    } catch (err) {
      console.error('addHistory error:', err);
      return null;
    }
  };

  /**
   * 删除单条历史记录
   * @param {string} id - 记录 ID
   */
  const deleteHistory = async (id) => {
    try {
      const history = await loadHistory();
      const updated = history.filter(item => item.id !== id);
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      onHistoryUpdate?.(updated);
      return true;
    } catch (err) {
      console.error('deleteHistory error:', err);
      return false;
    }
  };

  /**
   * 清空所有历史记录
   */
  const clearHistory = async () => {
    try {
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify([]));
      onHistoryUpdate?.([]);
      return true;
    } catch (err) {
      console.error('clearHistory error:', err);
      return false;
    }
  };

  return {
    loadHistory,
    addHistory,
    deleteHistory,
    clearHistory,
  };
}
