export type ModelType = 'chat' | 'image' | 'audio' | 'embedding' | 'inference' | 'multimodal';

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
  { id: 'multimodal', labelKey: 'modelTypes.multimodal', color: '#FF5722' },
  { id: 'audio', labelKey: 'modelTypes.audio', color: '#FF5722' },
];
