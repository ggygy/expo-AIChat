export const en = {
  common: {
    cancel: 'Cancel',
    confirm: 'Confirm',
    loading: 'Loading...',
    error: 'Error',
    retry: 'Retry',
    select: 'Select',
    close: 'Close',
    delete: 'Delete',
    success: 'Success',
    copy: 'Copy',
    copySuccess: 'Copied to clipboard',
    copyError: 'Copy failed',
    unknownError: 'Unknown error',
    share: 'Share',
    scrollCode: 'Scroll to view code',
    save: "Save",
    system: "System",
    done: "Done",
    new: "New",
    edit: "Edit",
  },
  tabs: {
    home: 'Home',
    explore: 'Explore',
    settings: 'Settings',
  },
  settings: {
    title: 'Settings',
    language: {
      title: 'Language',
      en: 'English',
      zh: '中文',
    },
    theme: {
      title: 'Theme',
      light: 'Light',
      dark: 'Dark',
      system: 'System',
    },
    aiConfig: {
      title: 'Models',
      description: 'Configure models',
    },
    about: {
      title: 'About',
      version: 'Version',
    },
  },
  chat: {
    inputPlaceholder: 'Type a message...',
    send: 'Send',
    retry: 'Retry',
    error: 'Failed to send',
    holdToSpeak: 'Hold to speak',
    deleteSuccess: "Deleted {{count}} messages",
    deleteFailed: "Failed to delete messages",
    deleteConfirmTitle: "Delete Messages",
    deleteConfirmMessage: "Are you sure you want to delete {{count}} selected messages?",
    selectedCount: "messages selected",
    generateError: "Error generating response, please retry",
    errorResponse: "Sorry, an error occurred while generating a response.",
    thinking: 'Thinking Process',
    answer: 'Answer',
    selectMode: 'MultiSelect',
    selectText: 'Select Text',
    exitSelectText: 'Exit Selection',
    selectTextHint: 'You can now long press to select text',
    copyAll: 'Copy All',
    copySelected: 'Copy Selected',
    shareSelected: 'Share Selected',
    readAloud: 'Read Aloud',
    stopReading: 'Stop Reading',
    readError: 'Reading failed',
    dislike: 'Dislike',
    feedbackSent: 'Feedback sent',
    shareFailed: 'Share failed',
    useShareOrCopy: 'Please use share menu or content copied to clipboard',
    selectPromptTemplate: "Select Prompt Template",
    selectTools: "Select AI Tools",
    noPromptSet: "No prompt set",
    customPrompt: "Custom prompt",
    unknownPrompt: "Unknown template",
    orUseCustomPrompt: "Or use custom prompt",
    customPromptPlaceholder: "Enter custom system prompt",
    noToolsEnabled: "No tools enabled",
    typeMessage: "Type a message..."
  },
  config: {
    title: 'Provider Configuration',
    apiKey: 'API Key',
    apiKeyPlaceholder: 'Enter API Key',
    model: 'Select Model',
    saveSuccess: 'Configuration saved successfully',
    saveError: 'Failed to save configuration',
    modelList: 'Model List',
    addNewModel: 'Add New Model',
    modelName: 'Model Name',
    active: 'Active',
    activate: 'Activate',
    delete: 'Delete',
    add: 'Add Model',
    providers: 'Configured Providers',
    configureModels: 'Configure Models',
    enabled: 'Enabled',
    disabled: 'Disabled',
    modelConfig: 'Model Configuration',
    addProvider: 'Add New Provider',
    providerConfig: 'Model Configuration',
    close: 'Close',
    save: 'Save',
    baseUrl: 'API Base URL',
    baseUrlPlaceholder: 'Enter API Base URL',
    addModel: 'Add Model',
    deleteModel: 'Delete',
    modelNamePlaceholder: 'Enter model name',
    modelIdPlaceholder: 'Enter model ID',
    confirm: 'Confirm',
    cancel: 'Cancel',
    useCurrent: 'Use Current',
    getApiKey: 'Get API Key',
    currentInUse: 'Current',
    selectModelTypes: 'Select Model Types',
    modelId: 'Model ID',
    modelTypes: 'Model Types',
    modelType: 'Model Type',
    testApi: 'Test Connection',
    testing: 'Testing connection...',
    testSuccess: 'Connection successful! Model responded normally',
    testFailed: 'Connection test failed',
    invalidApiKey: 'Invalid API key',
    noPermission: 'No permission',
    invalidApiUrl: 'Invalid API URL',
    connectionError: 'Cannot connect to server',
    testModel: 'Test Model',
    selectModelForTest: 'Select model to test',
    selectModelFirst: 'Please select a model first',
    quotaExceeded: 'API quota exceeded',
    rateLimit: 'Rate limit exceeded',
    unsupportedModel: 'Unsupported model or type',
    providerNotFound: 'Provider not found',
    modelNotFound: 'Model not found',
    serviceUnavailable: 'Service unavailable',
    unknownResponse: 'Unknown response format',
    networkError: 'Network error',
    unauthorized: 'Unauthorized access',
    serverError: 'Server error',
    timeout: 'Request timeout',
    contextLengthExceeded: 'Context length exceeded',
    tokenLimitExceeded: 'Token limit exceeded',
    contentFiltered: 'Content filtered',
    providerError: 'Provider error',
    modelOverloaded: 'Model is overloaded, please try again later',
    invalidRequest: 'Invalid request',
    emptyPrompt: 'Prompt cannot be empty',
    testingConnection: 'Testing connection...',
    deleteProvider: 'Delete Provider',
    deleteProviderConfirm: 'Are you sure you want to delete {{name}}? This action cannot be undone.',
  },
  home: {
    title: 'AI Assistants',
    subtitle: 'Select an assistant to start chatting',
    noAssistants: 'No active AI assistants found.',
    configurePrompt: 'Please configure your providers in the settings tab.',
    noBots: 'No assistants created yet',
    createBotPrompt: 'Create a new AI assistant to start chatting',
  },
  modelTypes: {
    chat: 'Chat',
    image: 'Image',
    embedding: 'Embedding',
    inference: 'Inference'
  },
  version: {
    description: 'AI Chat is a conversational application powered by artificial intelligence, supporting multiple AI models and conversation modes.',
    copyright: 'All Rights Reserved',
  },
  confirmDialog: {
    title: 'Confirm',
    deleteModelMsg: 'Are you sure you want to delete this model?',
  },
  bot: {
    create: 'Create Assistant',
    name: 'Assistant Name',
    temperature: 'Temperature',
    maxContext: 'Context Length',
    createSuccess: 'Created Successfully',
    delete: 'Delete',
    edit: 'Edit',
    namePlaceholder: 'Give your assistant a name',
    validateError: 'Please fill in required information',
    temperatureHint: 'Set AI response randomness (0.1-1.0)',
    maxContextHint: 'Number of contexts to keep (1-20)',
    systemPromptHint: 'Set AI role and behavior guidelines',
    provider: 'Select Provider',
    model: 'Select Model',
    settings: 'Basic Settings',
    selectProvider: 'Please select a provider',
    selectModel: 'Please select a model',
    providerRequired: 'Please select a provider first',
    modelRequired: 'Please select a model',
    nameRequired: 'Please enter assistant name',
    noActiveProviders: 'No active providers. Please configure and activate providers in settings',
    noEnabledModels: 'No enabled models for current provider. Please enable models first',
    topP: 'Top P',
    topPHint: 'Probability threshold for vocabulary sampling (0-1)',
    enableMaxTokens: 'Limit Max Tokens',
    maxTokens: 'Max Tokens',
    maxTokensHint: 'Maximum tokens used per interaction',
    streamOutput: 'Stream Output',
    streamOutputHint: 'Output response content word by word',
    chainOfThought: 'Chain of Thought',
    chainOfThoughtHint: 'Number of reasoning steps (0-5)',
    update: 'Update Assistant',
    deleteConfirmTitle: 'Delete Assistant',
    deleteConfirmMessage: 'Are you sure you want to delete this assistant? This action cannot be undone.',
    deleteSuccess: 'Deleted successfully',
    deleteFailed: 'Failed to delete assistant',
    messages: 'messages',
    noMessages: 'No messages yet',
    startChat: 'Start chatting',
    notFound: 'Assistant not found',
    updateSuccess: 'Assistant updated successfully',
    systemPrompt: 'System Prompt',
  },
  explore: {
    title: "Explore",
    promptTemplates: "Prompt Templates",
    promptTemplatesDescription: "Manage prompt templates for AI conversations, guiding the AI to respond in specific ways",
    aiTools: "AI Tools",
    aiToolsDescription: "Manage special functionality tools that AI can use, enhancing its capabilities",
    addNewTemplate: "Add New Template",
    addNewTool: "Add New Tool",
    editTemplate: "Edit Template",
    createTemplate: "Create Template",
    editTool: "Edit Tool",
    createTool: "Create Tool",
    name: "Name",
    namePlaceholder: "Enter template name",
    toolNamePlaceholder: "Enter tool name",
    description: "Description",
    descriptionPlaceholder: "Briefly describe the purpose of this template",
    toolDescriptionPlaceholder: "Briefly describe what this tool does",
    template: "Template Content",
    templatePlaceholder: "Enter prompt template, use {variable_name} to define variables",
    detectedVariables: "Detected Variables",
    nameRequired: "Please enter a name",
    templateRequired: "Please enter template content",
    descriptionRequired: "Please enter a description",
    functionRequired: "Please enter function implementation",
    saveError: "Save failed, please try again",
    deleteTemplateConfirm: "Are you sure you want to delete this template? This action cannot be undone.",
    deleteToolConfirm: "Are you sure you want to delete this tool? This action cannot be undone.",
    systemTemplateWarning: "This is a system template and cannot be edited",
    systemToolWarning: "This is a system tool and cannot be edited",
    functionImplementation: "Function Implementation",
    functionImplementationTip: "Write your function code here. The function will receive 'args' parameter and should return a result",
    parameters: "Parameter Definition",
    parametersTip: "Define tool parameters using JSON Schema format",
    parametersInvalidJson: "Invalid JSON format",
    parametersNotObject: "Parameter definition must be an object",
    parametersTypeNotObject: "Type must be 'object'",
    parametersNoProperties: "Properties field must be defined",
    parametersInvalid: "Parameter definition is invalid",
  },
};
