import { ModelProviderId } from '@/constants/ModelProviders';
import { IModelProvider } from './BaseProvider';
import { OpenAIProvider } from './OpenAIProvider';
import { DeepSeekProvider } from './DeepSeekProvider';
import { SiliconFlowProvider } from './SiliconFlowProvider';

export class ProviderFactory {
  static createProvider(vendor: ModelProviderId): IModelProvider {
    switch (vendor) {
      case ModelProviderId.OpenAI:
        return new OpenAIProvider();
      case ModelProviderId.DeepSeek:
        return new DeepSeekProvider();
      case ModelProviderId.SiliconFlow:
        return new SiliconFlowProvider();
      default:
        throw new Error(`Unsupported vendor: ${vendor}`);
    }
  }
}
