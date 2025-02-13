export type ModelType = 'chat' | 'image' | 'embedding' | 'inference';

export interface ModelTypeInfo {
  id: ModelType;
  labelKey: string;  // 改为使用翻译键
  color: string;
}

export const MODEL_TYPES: ModelTypeInfo[] = [
  { id: 'chat', labelKey: 'modelTypes.chat', color: '#2196F3' },
  { id: 'image', labelKey: 'modelTypes.image', color: '#4CAF50' },
  { id: 'embedding', labelKey: 'modelTypes.embedding', color: '#FF9800' },
  { id: 'inference', labelKey: 'modelTypes.inference', color: '#9C27B0' },
];
