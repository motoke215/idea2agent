export const SYSTEM_PROMPT = `你是一位顶级的AI产品架构师与全栈工程师。用户会给你一个模糊的产品想法，你需要将其转化为清晰、可执行的文档。

请严格按照以下结构输出，使用 Markdown 格式，语言为中文：

# ✦ 第一性原理剖析

> 用1-3句话，穿透表象，直击这个想法解决的本质问题和核心价值假设。

---

# ⬡ MVP 功能矩阵

列出 **最小可行产品** 的核心功能（3-5个），每个功能包含：
- **功能名称**：一句话说明
- **用户价值**：解决什么痛点
- **优先级**：🔴 核心 / 🟡 重要 / 🟢 增强

---

# ◈ 极简 PRD

## 产品概述
（2-3句话）

## 目标用户
（具体描述，非泛指）

## 核心用户故事
用 "作为[用户]，我希望[行为]，以便[价值]" 格式写 3 条

## 技术架构建议
（前端/后端/数据库/部署，简洁列出）

## 成功指标
（2-3个可量化的 KPI）

---

# ⟳ 分步开发指令

以下是可直接交给 AI 编程工具执行的分步提示词，每一步均为独立的完整指令，复制后即可使用。

**Step 1 — 项目初始化**

根据以下要求初始化项目：[根据产品特性，写出完整的项目初始化指令，包含技术栈选择理由、目录结构、依赖安装命令、基础配置文件内容。指令要足够详细，让 AI 工具可以直接执行，无需额外说明。]

---

**Step 2 — 核心功能开发**

在已初始化的项目基础上，实现核心业务逻辑：[根据 MVP 功能，写出核心功能的完整实现指令，包含数据结构定义、核心算法或业务逻辑、关键函数和模块的具体实现要求。]

---

**Step 3 — UI 与交互层**

在核心功能完成后，构建用户界面：[写出完整的 UI 实现指令，包含页面布局、关键组件列表、交互细节、样式风格要求，以及异常状态（加载中、错误，空状态）的处理方式。]

---

**Step 4 — 集成联调与容错**

将所有模块集成并处理边界情况：[写出集成阶段的完整指令，包含模块间接口对接、数据流验证、错误处理策略、关键边界条件的测试用例。]

---

**Step 5 — 部署与上线准备**

完成产品的部署配置：[写出部署阶段的完整指令，包含环境变量配置、构建优化、部署平台选择与配置步骤、README 文档要点。]

---
*由灵感炼金炉 Idea2Agent 生成 · 请根据实际情况调整上述指令*`;

/** 超时时间（毫秒） */
const DEFAULT_TIMEOUT = 90000;

/** 模型注册表：每个模型包含 label、provider、endpoint、默认 model 名 */
export const MODEL_REGISTRY = {
  // ── DeepSeek ──
  'deepseek-chat': {
    label: 'DeepSeek Chat',
    provider: 'deepseek',
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    defaultModel: 'deepseek-chat',
  },
  'deepseek-coder': {
    label: 'DeepSeek Coder',
    provider: 'deepseek',
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    defaultModel: 'deepseek-coder',
  },
  'deepseek-reasoner': {
    label: 'DeepSeek Reasoner',
    provider: 'deepseek',
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    defaultModel: 'deepseek-reasoner',
  },

  // ── OpenAI ──
  'gpt-4o': {
    label: 'GPT-4o',
    provider: 'openai',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-4o',
  },
  'gpt-4o-mini': {
    label: 'GPT-4o Mini',
    provider: 'openai',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-4o-mini',
  },
  'gpt-4-turbo': {
    label: 'GPT-4 Turbo',
    provider: 'openai',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-4-turbo',
  },
  'gpt-3.5-turbo': {
    label: 'GPT-3.5 Turbo',
    provider: 'openai',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-3.5-turbo',
  },

  // ── Anthropic ──
  'claude-opus-4': {
    label: 'Claude Opus 4',
    provider: 'anthropic',
    endpoint: 'https://api.anthropic.com/v1/messages',
    defaultModel: 'claude-opus-4-5',
  },
  'claude-sonnet-4': {
    label: 'Claude Sonnet 4',
    provider: 'anthropic',
    endpoint: 'https://api.anthropic.com/v1/messages',
    defaultModel: 'claude-sonnet-4-5',
  },
  'claude-3-5-sonnet': {
    label: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    endpoint: 'https://api.anthropic.com/v1/messages',
    defaultModel: 'claude-3-5-sonnet-20241022',
  },
  'claude-3-5-haiku': {
    label: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    endpoint: 'https://api.anthropic.com/v1/messages',
    defaultModel: 'claude-3-5-haiku-20241022',
  },
  'claude-3-opus': {
    label: 'Claude 3 Opus',
    provider: 'anthropic',
    endpoint: 'https://api.anthropic.com/v1/messages',
    defaultModel: 'claude-3-opus-20240229',
  },
  'claude-3-sonnet': {
    label: 'Claude 3 Sonnet',
    provider: 'anthropic',
    endpoint: 'https://api.anthropic.com/v1/messages',
    defaultModel: 'claude-3-sonnet-20240229',
  },
  'claude-3-haiku': {
    label: 'Claude 3 Haiku',
    provider: 'anthropic',
    endpoint: 'https://api.anthropic.com/v1/messages',
    defaultModel: 'claude-3-haiku-20240307',
  },

  // ── Google Gemini ──
  'gemini-2.5-flash': {
    label: 'Gemini 2.5 Flash',
    provider: 'google',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    defaultModel: 'gemini-2.0-flash',
  },
  'gemini-2.0-flash': {
    label: 'Gemini 2.0 Flash',
    provider: 'google',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    defaultModel: 'gemini-2.0-flash',
  },
  'gemini-2.0-flash-thinking': {
    label: 'Gemini 2.0 Flash Thinking',
    provider: 'google',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-thinking:generateContent',
    defaultModel: 'gemini-2.0-flash-thinking-exp',
  },
  'gemini-1.5-flash': {
    label: 'Gemini 1.5 Flash',
    provider: 'google',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    defaultModel: 'gemini-1.5-flash',
  },
  'gemini-1.5-pro': {
    label: 'Gemini 1.5 Pro',
    provider: 'google',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent',
    defaultModel: 'gemini-1.5-pro',
  },
  'gemini-pro': {
    label: 'Gemini Pro',
    provider: 'google',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    defaultModel: 'gemini-pro',
  },

  // ── Groq ──
  'groq-llama-3.3-70b': {
    label: 'Groq Llama 3.3 70B',
    provider: 'groq',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    defaultModel: 'llama-3.3-70b-versatile',
  },
  'groq-mixtral': {
    label: 'Groq Mixtral 8x7B',
    provider: 'groq',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    defaultModel: 'mixtral-8x7b-32768',
  },
  'groq-llama-3.1-8b': {
    label: 'Groq Llama 3.1 8B',
    provider: 'groq',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    defaultModel: 'llama-3.1-8b-instant',
  },

  // ── OpenRouter ──
  'openrouter-anthropic': {
    label: 'OpenRouter Anthropic',
    provider: 'openrouter',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    defaultModel: 'anthropic/claude-3.5-sonnet',
  },
  'openrouter-openai': {
    label: 'OpenRouter OpenAI',
    provider: 'openrouter',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    defaultModel: 'openai/gpt-4o',
  },
  'openrouter-google': {
    label: 'OpenRouter Google',
    provider: 'openrouter',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    defaultModel: 'google/gemini-pro-1.5',
  },
  'openrouter-deepseek': {
    label: 'OpenRouter DeepSeek',
    provider: 'openrouter',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    defaultModel: 'deepseek/deepseek-chat',
  },

  // ── Ollama (本地) ──
  'ollama-llama3': {
    label: 'Ollama Llama 3',
    provider: 'ollama',
    endpoint: 'http://localhost:11434/api/chat',
    defaultModel: 'llama3',
    isLocal: true,
  },
  'ollama-qwen': {
    label: 'Ollama Qwen',
    provider: 'ollama',
    endpoint: 'http://localhost:11434/api/chat',
    defaultModel: 'qwen2.5',
    isLocal: true,
  },
  'ollama-codellama': {
    label: 'Ollama CodeLlama',
    provider: 'ollama',
    endpoint: 'http://localhost:11434/api/chat',
    defaultModel: 'codellama',
    isLocal: true,
  },
  'ollama-deepseek': {
    label: 'Ollama DeepSeek',
    provider: 'ollama',
    endpoint: 'http://localhost:11434/api/chat',
    defaultModel: 'deepseek-coder',
    isLocal: true,
  },

  // ── MiniMax ──
  'minimax-chat': {
    label: 'MiniMax Chat',
    provider: 'minimax',
    endpoint: 'https://api.minimax.chat/v1/text/chatcompletion_v2',
    defaultModel: 'minimax-m2.7',
  },

  // ── 硅基流动 (SiliconFlow) ──
  'siliconflow': {
    label: '硅基流动',
    provider: 'siliconflow',
    endpoint: 'https://api.siliconflow.cn/v1/chat/completions',
    defaultModel: 'Qwen/Qwen2.5-72B-Instruct',
    isCustom: false,
  },

  // ── 硅基流动子模型（仅供选择，实际使用统一入口） ──
  'siliconflow-qwen': {
    label: 'SiliconFlow Qwen',
    provider: 'siliconflow',
    endpoint: 'https://api.siliconflow.cn/v1/chat/completions',
    defaultModel: 'Qwen/Qwen2.5-72B-Instruct',
    parentModel: 'siliconflow',
  },
  'siliconflow-glm': {
    label: 'SiliconFlow GLM',
    provider: 'siliconflow',
    endpoint: 'https://api.siliconflow.cn/v1/chat/completions',
    defaultModel: 'THUDM/glm-4-9b-chat',
    parentModel: 'siliconflow',
  },
  'siliconflow-yi': {
    label: 'SiliconFlow Yi',
    provider: 'siliconflow',
    endpoint: 'https://api.siliconflow.cn/v1/chat/completions',
    defaultModel: '01-ai/Yi-1.5-34B-Chat',
    parentModel: 'siliconflow',
  },
  'siliconflow-deepseek': {
    label: 'SiliconFlow DeepSeek',
    provider: 'siliconflow',
    endpoint: 'https://api.siliconflow.cn/v1/chat/completions',
    defaultModel: 'deepseek-ai/DeepSeek-V2.5',
    parentModel: 'siliconflow',
  },
  'siliconflow-llama': {
    label: 'SiliconFlow Llama',
    provider: 'siliconflow',
    endpoint: 'https://api.siliconflow.cn/v1/chat/completions',
    defaultModel: 'meta-llama/Llama-3.3-70B-Instruct',
    parentModel: 'siliconflow',
  },

  // ── 自定义 API ──
  'custom': {
    label: '自定义 API',
    provider: 'custom',
    endpoint: '',
    defaultModel: '',
    isCustom: true,
  },
};

/** 按 provider 分组模型，供 UI 下拉菜单使用 */
export const MODEL_GROUPS = [
  { group: 'DeepSeek', models: ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'] },
  { group: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
  { group: 'Anthropic', models: ['claude-opus-4', 'claude-sonnet-4', 'claude-3-5-sonnet', 'claude-3-5-haiku', 'claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'] },
  { group: 'Google', models: ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-thinking', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'] },
  { group: 'Groq', models: ['groq-llama-3.3-70b', 'groq-mixtral', 'groq-llama-3.1-8b'] },
  { group: 'OpenRouter', models: ['openrouter-anthropic', 'openrouter-openai', 'openrouter-google', 'openrouter-deepseek'] },
  { group: 'Ollama 本地', models: ['ollama-llama3', 'ollama-qwen', 'ollama-codellama', 'ollama-deepseek'] },
  { group: 'MiniMax', models: ['minimax-chat'] },
  { group: '硅基流动', models: ['siliconflow'] },
  { group: '其他', models: ['custom'] },
];

/** Provider 显示名称 */
export const PROVIDER_LABELS = {
  deepseek: 'DeepSeek',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google Gemini',
  groq: 'Groq',
  openrouter: 'OpenRouter',
  ollama: 'Ollama',
  minimax: 'MiniMax',
  siliconflow: '硅基流动',
  custom: '自定义',
};

/** 获取模型注册信息 */
export function getModelInfo(modelId) {
  return MODEL_REGISTRY[modelId] || null;
}

/** 校验 URL 格式 */
function isValidUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/** 为 Anthropic 构造请求体（与其他 provider 格式不同） */
function buildAnthropicBody(modelName, messages) {
  const systemMsg = messages.find(m => m.role === 'system');
  const userMsgs = messages.filter(m => m.role === 'user');
  const lastUserMsg = userMsgs[userMsgs.length - 1]?.content || '';

  return {
    model: modelName,
    max_tokens: 1024,
    system: systemMsg?.content || '',
    messages: [{ role: 'user', content: lastUserMsg }],
  };
}

/** Anthropic 请求头 */
function getAnthropicHeaders(apiKey) {
  return {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
  };
}

/** Google Gemini 请求体 */
function buildGeminiBody(modelName, messages) {
  const systemMsg = messages.find(m => m.role === 'system');
  const userMsgs = messages.filter(m => m.role === 'user');
  const lastUserMsg = userMsgs[userMsgs.length - 1]?.content || '';

  return {
    contents: [{
      parts: [{ text: (systemMsg?.content ? systemMsg.content + '\n\n' : '') + lastUserMsg }],
    }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
  };
}

/** Ollama 请求体 */
function buildOllamaBody(modelName, messages) {
  const allContent = messages.map(m => (m.role === 'system' ? '系统: ' : '') + m.content).join('\n');
  return {
    model: modelName,
    messages: [{ role: 'user', content: allContent }],
    stream: false,
  };
}

export async function generateIdea({ idea, modelId, providerApiKeys, customEndpoint, timeout = DEFAULT_TIMEOUT }) {
  const modelInfo = getModelInfo(modelId);
  if (!modelInfo) throw new Error('未知的模型: ' + modelId);

  const { provider, endpoint: defaultEndpoint, defaultModel } = modelInfo;
  const apiKey = providerApiKeys[provider];

  if (!apiKey && !modelInfo.isLocal) {
    throw new Error(`请先在「配置」页填写 ${PROVIDER_LABELS[provider] || provider} 的 API Key`);
  }

  // 解析 endpoint
  let endpoint = customEndpoint || defaultEndpoint;
  if (provider === 'google') {
    // Gemini URL 需要拼接 model 名
    endpoint = defaultEndpoint.includes('generateContent')
      ? `${defaultEndpoint}?key=${apiKey}`
      : endpoint;
  }
  if (!endpoint) throw new Error('请先填写 API 地址');

  // 自定义 provider 必须有合法 URL
  if (provider === 'custom' && !isValidUrl(endpoint)) {
    throw new Error('请输入有效的自定义 API 地址（http:// 或 https://）');
  }

  const modelName = defaultModel || modelId;
  const systemPrompt = SYSTEM_PROMPT;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    // 构造消息
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `我的产品想法是：\n\n${idea}` },
    ];

    let resp;

    if (provider === 'anthropic') {
      // Anthropic 使用不同的 API 格式
      resp = await fetch(endpoint, {
        method: 'POST',
        headers: getAnthropicHeaders(apiKey),
        body: JSON.stringify(buildAnthropicBody(modelName, messages)),
        signal: controller.signal,
      });
    } else if (provider === 'google') {
      // Google Gemini 格式
      resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildGeminiBody(modelName, messages)),
        signal: controller.signal,
      });
    } else if (provider === 'ollama') {
      // Ollama 本地格式
      resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildOllamaBody(modelName, messages)),
        signal: controller.signal,
      });
    } else {
      // OpenAI / DeepSeek / Groq / OpenRouter / Custom 兼容格式
      resp = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelName,
          messages,
          max_tokens: 3000,
          temperature: 0.7,
        }),
        signal: controller.signal,
      });
    }

    clearTimeout(timer);

    if (!resp.ok) {
      let msg = '';
      const contentType = resp.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const errData = await resp.json().catch(() => ({}));
        msg = errData?.error?.message || errData?.error?.type || '';
      }
      if (!msg) {
        msg = await resp.text().catch(() => '').then(t => t.slice(0, 200));
      }

      if (resp.status === 401) throw new Error(PROVIDER_LABELS[provider] + ' API Key 无效或已过期');
      if (resp.status === 429) throw new Error('请求过于频繁，请稍后再试');
      if (resp.status === 402) throw new Error('账户余额不足，请充值后继续');
      throw new Error('请求失败' + (msg ? '：' + msg : '') + '（HTTP ' + resp.status + '）');
    }

    // 解析响应
    const data = await resp.json();

    // Anthropic 响应格式
    if (provider === 'anthropic') {
      const content = data.content?.[0]?.text || '';
      return content;
    }

    // Google Gemini 响应格式
    if (provider === 'google') {
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return content;
    }

    // Ollama 响应格式
    if (provider === 'ollama') {
      const content = data.message?.content || '';
      return content;
    }

    // OpenAI / DeepSeek / Groq / OpenRouter / Custom
    return data.choices?.[0]?.message?.content ?? '';

  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') throw new Error('请求超时，请检查网络连接后重试');
    throw err;
  }
}

export function extractInstructions(content) {
  if (!content) return '';
  const markers = ['# ⟳ 分步开发指令', '⟳ 分步开发指令', '分步开发指令'];
  for (const m of markers) {
    const idx = content.indexOf(m);
    if (idx !== -1) {
      const extracted = content.slice(idx);
      return extracted.trim() || content;
    }
  }
  return content.trim();
}

export { DEFAULT_TIMEOUT };
