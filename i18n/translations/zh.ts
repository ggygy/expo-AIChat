export const zh = {
  common: {
    cancel: '取消',
    confirm: '确认',
    loading: '加载中...',
    error: '错误',
    retry: '重试',
    select: '请选择',
    close: '关闭',
  },
  tabs: {
    home: '首页',
    explore: '发现',
    settings: '设置',
  },
  settings: {
    title: '设置',
    language: {
      title: '语言',
      en: 'English',
      zh: '中文',
    },
    theme: {
      title: '主题',
      light: '浅色',
      dark: '深色',
      system: '跟随系统',
    },
    aiConfig: {
      title: '模型',
      description: '配置模型',
    },
    about: {
      title: '关于',
      version: '版本',
    },
  },
  chat: {
    inputPlaceholder: '输入消息...',
    send: '发送',
    retry: '重试',
    error: '发送失败',
  },
  config: {
    title: '服务商配置',
    apiKey: 'API 密钥',
    apiKeyPlaceholder: '请输入 API 密钥',
    model: '选择模型',
    saveSuccess: '配置保存成功',
    saveError: '配置保存失败',
    modelList: '模型列表',
    addNewModel: '添加新模型',
    modelName: '模型名称',
    active: '已激活',
    activate: '激活',
    delete: '删除',
    add: '添加模型',
    providers: '已配置的服务商',
    configureModels: '配置模型',
    enabled: '已启用',
    disabled: '已禁用',
    modelConfig: '模型配置',
    addProvider: '添加新服务商',
    providerConfig: '模型配置',
    close: '关闭',
    save: '保存',
    baseUrl: 'API 基础地址',
    baseUrlPlaceholder: '输入 API 基础地址',
    addModel: '添加模型',
    deleteModel: '删除',
    modelNamePlaceholder: '输入模型名称',
    modelIdPlaceholder: '输入模型 ID',
    confirm: '确认',
    cancel: '取消',
    useCurrent: '设为当前',
    getApiKey: '获取API密钥',
    currentInUse: '当前使用',
    selectModelTypes: '选择模型类型',
    modelId: '模型 ID',
    modelTypes: '模型类型',
    modelType: '模型类型',
    testApi: '测试 API',
    testing: '测试中...',
    testSuccess: 'API 连接成功',
    testFailed: 'API 连接失败',
    invalidApiKey: 'API密钥无效',
    noPermission: '没有访问权限',
    invalidApiUrl: 'API地址无效',
    connectionError: '无法连接到服务器',
    testModel: '测试模型',
    selectModelForTest: '选择要测试的模型',
    selectModelFirst: '请先选择要测试的模型',
    quotaExceeded: 'API配额超限',
    rateLimit: '请求频率超限',
    unsupportedModel: '不支持的模型或类型',
  },
  home: {
    title: 'AI 助手',
    subtitle: '选择或创建一个助手开始聊天',
    noAssistants: '未找到已激活的 AI 助手',
    configurePrompt: '请在设置页面配置您的服务商',
    noBots: '还没有创建任何助手',
    createBotPrompt: '创建一个新的AI助手开始对话',
  },
  modelTypes: {
    chat: '对话',
    image: '图像',
    embedding: '嵌入',
    inference: '推理'
  },
  version: {
    description: 'AI Chat 是一款基于人工智能的聊天应用，支持多种AI模型和对话方式。',
    copyright: '保留所有权利',
  },
  confirmDialog: {
    title: '确认',
    deleteModelMsg: '确定删除模型吗？',
  },
  bot: {
    create: '创建助手',
    name: '助手名称',
    temperature: '回答随机度',
    maxContext: '上下文数量',
    systemPrompt: '系统提示语',
    createSuccess: '创建成功',
    delete: '删除助手',
    edit: '编辑助手',
    namePlaceholder: '为你的助手起个名字',
    validateError: '请填写必要的信息',
    temperatureHint: '设置AI回答的随机程度 (0.1-1.0)',
    maxContextHint: '保留的上下文数量 (1-10)',
    systemPromptHint: '设置AI的角色和行为准则',
    provider: '选择服务商',
    model: '选择模型',
    settings: '基础设置',
    selectProvider: '请选择服务商',
    selectModel: '请选择模型',
    providerRequired: '请先选择服务商',
    modelRequired: '请选择模型',
    nameRequired: '请输入助手名称',
    noActiveProviders: '没有已激活的服务商，请先在设置中配置并激活服务商',
    noEnabledModels: '当前服务商没有已启用的模型，请先启用模型',
  },
};
