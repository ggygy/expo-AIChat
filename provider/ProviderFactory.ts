import { ModelProviderId } from '@/constants/ModelProviders';
import { IModelProvider } from './BaseProvider';
import { OpenAIProvider } from './OpenAIProvider';
import { DeepseekProvider } from './DeepSeekProvider';
import { SiliconFlowProvider } from './SiliconFlowProvider';
import { AlibabaTongyiProvider } from './AlibabaTongyiProvider';
import { AnthropicProvider } from './AnthropicProvider';

export class ProviderFactory {
  static createProvider(providerId: ModelProviderId): IModelProvider | null {
    switch (providerId) {
      case 'openai':
        return new OpenAIProvider();
      case 'deepseek':
        return new DeepseekProvider();
      case 'siliconflow':
        return new SiliconFlowProvider();
      case 'alibabatongyi':
        return new AlibabaTongyiProvider();
      case 'anthropic':
        return new AnthropicProvider();
      // case 'zhipuai':
      //   return new ZhipuAIProvider();
      default:
        console.error(`Unsupported provider: ${providerId}`);
        return null;
    }
  }
}
