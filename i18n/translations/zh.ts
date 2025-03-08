export const zh = {
  common: {
    cancel: '取消',
    confirm: '确认',
    loading: '加载中...',
    error: '错误',
    retry: '重试',
    select: '请选择',
    close: '关闭',
    delete: '删除',
    success: '成功',
    copy: '复制',
    copySuccess: '已复制到剪贴板',
    copyError: '复制失败',
    unknownError: '未知错误',
    share: '分享',
    scrollCode: '滑动查看代码',
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
    holdToSpeak: '按住说话',
    deleteSuccess: "已删除 {{count}} 条消息",
    deleteFailed: "删除消息失败",
    deleteConfirmTitle: "删除消息",
    deleteConfirmMessage: "确定要删除选中的 {{count}} 条消息吗？",
    selectedCount: "条消息已选择",
    generateError: '生成回复时出错，请重试',
    errorResponse: '很抱歉，生成回复时出现了错误。',
    thinking: '思考过程',
    answer: '回答',
    selectMode: '多选模式',
    selectText: '文本选择',
    exitSelectText: '退出选择',
    selectTextHint: '现在您可以长按选择文本',
    readAloud: '朗读',
    stopReading: '停止朗读',
    readError: '朗读失败',
    dislike: '点踩',
    feedbackSent: '反馈已发送',
    shareFailed: '分享失败',
    useShareOrCopy: '请使用分享菜单或已复制到剪贴板',
    copyAll: '复制全部',
    copySelected: '复制所选',
    shareSelected: '分享所选',
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
    providerNotFound: '未找到服务提供商',
    modelNotFound: '未找到模型',
    serviceUnavailable: '服务不可用',
    unknownResponse: '未知的响应格式',
    networkError: '网络错误',
    unauthorized: '未授权访问',
    serverError: '服务器错误',
    timeout: '请求超时',
    contextLengthExceeded: '上下文长度超限',
    tokenLimitExceeded: 'Token 数量超限',
    contentFiltered: '内容被过滤',
    providerError: '服务提供商错误',
    modelOverloaded: '模型负载过重，请稍后再试',
    invalidRequest: '无效的请求',
    emptyPrompt: '提示内容不能为空',
    testingConnection: '正在测试连接...',
    deleteProvider: '删除服务商',
    deleteProviderConfirm: '确定要删除 {{name}} 吗？此操作不可撤销。',
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
    temperature: '温度',
    temperatureHint: '控制回答的随机性 (0.1-1.0)',
    topP: 'Top P',
    topPHint: '控制词汇采样的概率阈值 (0-1)',
    maxContext: '上下文数量',
    maxContextHint: '保留的上下文数量 (1-20)',
    enableMaxTokens: '限制最大Token',
    maxTokens: '最大Token数',
    maxTokensHint: '单次交互最大使用的Token数',
    streamOutput: '流式输出',
    streamOutputHint: '逐字输出回答内容',
    chainOfThought: '思维链长度',
    chainOfThoughtHint: '思维推理的步骤数 (0-5)',
    createSuccess: '创建成功',
    delete: '删除助手',
    edit: '编辑助手',
    namePlaceholder: '为你的助手起个名字',
    validateError: '请填写必要的信息',
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
    update: '更新助手',
    deleteConfirmTitle: '删除助手',
    deleteConfirmMessage: '确定要删除这个助手吗？此操作不可恢复。',
    deleteSuccess: '删除成功',
    deleteFailed: '删除失败',
    messages: '条消息',
    noMessages: '还没有进行任何对话',
    startChat: '开始对话',
    notFound: '未找到助手信息',
    updateSuccess: '助手信息已更新',
    systemPrompt: '系统提示词',
  },
};
