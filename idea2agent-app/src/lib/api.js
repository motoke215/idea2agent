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

在核心功能完成后，构建用户界面：[写出完整的 UI 实现指令，包含页面布局、关键组件列表、交互细节、样式风格要求，以及异常状态（加载中、错误、空状态）的处理方式。]

---

**Step 4 — 集成联调与容错**

将所有模块集成并处理边界情况：[写出集成阶段的完整指令，包含模块间接口对接、数据流验证、错误处理策略、关键边界条件的测试用例。]

---

**Step 5 — 部署与上线准备**

完成产品的部署配置：[写出部署阶段的完整指令，包含环境变量配置、构建优化、部署平台选择与配置步骤、README 文档要点。]

---
*由灵感炼金炉 Idea2Agent 生成 · 请根据实际情况调整上述指令*`;

function buildEndpoint(provider, baseUrl) {
  if (provider === 'deepseek') return 'https://api.deepseek.com/v1/chat/completions';
  if (provider === 'openai') return 'https://api.openai.com/v1/chat/completions';
  if (provider === 'custom' && baseUrl) return baseUrl.replace(/\/$/, '') + '/v1/chat/completions';
  return 'https://api.deepseek.com/v1/chat/completions';
}

export async function generateIdea({ idea, apiKey, provider, baseUrl, model }) {
  const endpoint = buildEndpoint(provider, baseUrl);
  const modelName = model || (provider === 'openai' ? 'gpt-4o' : 'deepseek-chat');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);

  try {
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `我的产品想法是：\n\n${idea}` },
        ],
        max_tokens: 3000,
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}));
      const msg = errData?.error?.message || `HTTP ${resp.status}`;
      if (resp.status === 401) throw new Error('API Key 无效或已过期，请检查配置');
      if (resp.status === 429) throw new Error('请求过于频繁，请稍后再试');
      if (resp.status === 402) throw new Error('账户余额不足，请充值后继续');
      throw new Error(`请求失败：${msg}`);
    }

    const data = await resp.json();
    return data.choices?.[0]?.message?.content ?? '';
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') throw new Error('请求超时，请检查网络连接后重试');
    throw err;
  }
}

export function extractInstructions(content) {
  const markers = ['# ⟳ 分步开发指令', '⟳ 分步开发指令', '分步开发指令'];
  for (const m of markers) {
    const idx = content.indexOf(m);
    if (idx !== -1) return content.slice(idx);
  }
  return content;
}
