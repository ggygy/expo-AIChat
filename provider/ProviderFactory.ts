import { ModelProviderId } from '@/constants/ModelProviders';
import { IModelProvider } from './BaseProvider';
import { OpenAIProvider } from './OpenAIProvider';
import { DeepseekProvider } from './DeepSeekProvider';
import { SiliconFlowProvider } from './SiliconFlowProvider';

export class ProviderFactory {
  static createProvider(providerId: ModelProviderId): IModelProvider | null {
    switch (providerId) {
      case 'openai':
        return new OpenAIProvider();
      case 'deepseek':
        return new DeepseekProvider();
      case 'siliconflow':
        return new SiliconFlowProvider();
      default:
        console.error(`Unsupported provider: ${providerId}`);
        return null;
    }
  }
}
