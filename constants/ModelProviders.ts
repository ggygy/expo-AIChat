import { OpenAIModels } from '@/provider/OpenAIProvider';
import { ModelType } from './ModelTypes';

export enum ModelProviderId {
  OpenAI = 'openai',
  DeepSeek = 'deepseek',
  SiliconFlow = 'siliconflow',
  BaiduQianfan = 'baiduqianfan',
  AlibabaTongyi = 'alibabatongyi',
  Groq = 'groq',
  MiniMax = 'minimax',
  TencentHunyuan = 'tencenthunyuan',
  ZhipuAI = 'zhipuai',
  WebLLM = 'webllm',
  TogetherAI = 'togetherai',
  PremAI = 'premai',
  Ollama = 'ollama'
}

export interface ModelInfo {
  id: string;
  name: string;
  types: ModelType[];
}

export interface ModelProvider {
  id: ModelProviderId;
  name: string;
  icon: string;
  baseUrl: string;
  apiKeyUrl?: string;
  availableModels: ModelInfo[];
}

export const MODEL_PROVIDERS: ModelProvider[] = [
  {
    id: ModelProviderId.OpenAI,
    name: 'OpenAI',
    icon: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    apiKeyUrl: 'https://platform.openai.com/api-keys',
    availableModels: OpenAIModels,
  },
  {
    id: ModelProviderId.DeepSeek,
    name: 'DeepSeek',
    icon: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    apiKeyUrl: 'https://platform.deepseek.com/api_keys',
    availableModels: [
      { id: 'deepseek-chat', name: 'deepseek V3', types: ['chat'] },
      { id: 'deepseek-reasoner', name: 'deepseek R1', types: ['chat', 'inference'] },
    ],
  },
  {
    id: ModelProviderId.SiliconFlow,
    name: 'SiliconFlow',
    icon: 'SiliconFlow',
    baseUrl: 'https://api.siliconflow.cn/v1',
    apiKeyUrl: 'https://cloud.siliconflow.cn/account/ak',
    availableModels: [
      { id: 'deepseek-ai/DeepSeek-V3', name: 'deepseek V3', types: ['chat'] },
      { id: 'deepseek-ai/DeepSeek-R1', name: 'deepseek R1', types: ['chat', 'inference'] },
      { id: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B', name: 'DeepSeek R1 Distill 32B', types: ['chat', 'inference'] },
      { id: 'Qwen/QwQ-32B', name: 'QwQ-32B', types: ['chat', 'inference'] },
      { id: 'Qwen/QwQ-32B-Preview', name: 'QwQ-32B-Preview', types: ['chat', 'inference'] },
      { id: 'Qwen/QVQ-72B-Preview', name: 'QVQ-72B', types: ['chat'] },
      { id: 'Qwen/Qwen2.5-72B-Instruct-128K', name: 'Qwen2.5 72B 128K', types: ['chat'] },
      { id: 'Qwen/Qwen2.5-72B-Instruct', name: 'Qwen2.5 72B', types: ['chat'] },
      { id: 'Qwen/Qwen2.5-Coder-32B-Instruct', name: 'Qwen2.5 Coder 32B', types: ['chat'] },
      { id: 'Kwai-Kolors/Kolors', name: 'Qwen2.5 Coder 32B 128K', types: ['image'] },
    ],
  },
  {
    id: ModelProviderId.AlibabaTongyi,
    name: '阿里通义',
    icon: 'AlibabaTongyi',
    baseUrl: 'https://dashscope.aliyuncs.com',
    apiKeyUrl: 'https://dashscope.console.aliyun.com/apiKey',
    availableModels: [
      { id: 'qwen-max', name: 'qwen Max', types: ['chat'] },
      { id: 'qwen-plus', name: 'qwen Plus', types: ['chat'] },
      { id: 'qwen-turbo', name: 'qwen Turbo', types: ['chat'] },
      { id: 'qwen-longcontext', name: 'qwen longcontext', types: ['chat'] },
    ],
  },
  {
    id: ModelProviderId.Groq,
    name: 'Groq',
    icon: 'Groq',
    baseUrl: 'https://api.groq.com/openai',
    apiKeyUrl: 'https://console.groq.com/keys',
    availableModels: [
      { id: 'llama3-8b-8192', name: 'Llama3 8B', types: ['chat'] },
      { id: 'llama3-70b-8192', name: 'Llama3 70B', types: ['chat'] },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', types: ['chat'] },
      { id: 'gemma-7b-it', name: 'Gemma 7B', types: ['chat'] },
    ],
  },
  {
    id: ModelProviderId.MiniMax,
    name: 'MiniMax',
    icon: 'MiniMax',
    baseUrl: 'https://api.minimax.chat',
    apiKeyUrl: 'https://platform.minimax.chat/user-center/basic-information/api-key-management',
    availableModels: [
      { id: 'abab6-chat', name: 'ABAB 6.5', types: ['chat'] },
      { id: 'abab5.5-chat', name: 'ABAB 5.5', types: ['chat'] },
    ],
  },
  {
    id: ModelProviderId.ZhipuAI,
    name: '智谱AI',
    icon: 'ZhipuAI',
    baseUrl: 'https://open.bigmodel.cn/api/paas',
    apiKeyUrl: 'https://open.bigmodel.cn/usercenter/apikeys',
    availableModels: [
      { id: 'glm-4', name: 'GLM-4', types: ['chat'] },
      { id: 'glm-4v', name: 'GLM-4V', types: ['chat'] },
      { id: 'glm-3-turbo', name: 'GLM-3-Turbo', types: ['chat'] },
      { id: 'cogview-3', name: 'CogView-3', types: ['image'] },
    ],
  },
  {
    id: ModelProviderId.TogetherAI,
    name: 'Together AI',
    icon: 'TogetherAI',
    baseUrl: 'https://api.together.xyz',
    apiKeyUrl: 'https://api.together.xyz/settings/api-keys',
    availableModels: [
      { id: 'mistralai/Mixtral-8x7B-Instruct-v0.1', name: 'Mixtral-8x7B', types: ['chat'] },
      { id: 'meta-llama/Llama-3-8b-chat', name: 'Llama-3-8B', types: ['chat'] },
      { id: 'meta-llama/Llama-3-70b-chat', name: 'Llama-3-70B', types: ['chat'] },
      { id: 'mistralai/Mistral-7B-Instruct-v0.2', name: 'Mistral-7B', types: ['chat'] },
    ],
  },
  {
    id: ModelProviderId.PremAI,
    name: 'Prem AI',
    icon: 'PremAI',
    baseUrl: 'https://api.premai.io',
    apiKeyUrl: 'https://premai.io/account',
    availableModels: [
      { id: 'meta-llama/Llama-3-70b-chat', name: 'Llama-3-70B', types: ['chat'] },
      { id: 'meta-llama/Llama-3-8b-chat', name: 'Llama-3-8B', types: ['chat'] },
      { id: 'mistralai/Mixtral-8x7B-Instruct-v0.1', name: 'Mixtral-8x7B', types: ['chat'] },
    ],
  },
  {
    id: ModelProviderId.Ollama,
    name: 'Ollama',
    icon: 'Ollama',
    baseUrl: 'http://localhost:11434',
    apiKeyUrl: '',
    availableModels: [
      { id: 'llama3', name: 'Llama 3', types: ['chat'] },
      { id: 'llama2', name: 'Llama 2', types: ['chat'] },
      { id: 'mistral', name: 'Mistral', types: ['chat'] },
      { id: 'mixtral', name: 'Mixtral', types: ['chat'] },
    ],
  },
];
