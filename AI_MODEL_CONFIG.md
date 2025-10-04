# 🤖 AI 模型配置指南

Code Review 支持多个 AI 提供商，可以灵活切换。

## 🔄 支持的 AI 提供商

### 1. OpenAI (GPT 系列)
- ✅ GPT-4o (推荐，最新最强)
- ✅ GPT-4 Turbo
- ✅ GPT-4
- ✅ GPT-3.5 Turbo (经济实惠)

### 2. Anthropic (Claude 系列)
- ✅ Claude Sonnet 4.5 (最新)
- ✅ Claude Opus
- ✅ Claude Sonnet

## 🚀 快速使用

### 方法 1: 使用环境变量（推荐）

#### OpenAI
```bash
export OPENAI_API_KEY=sk-...your-openai-key
yarn code-review
```

#### Anthropic
```bash
export ANTHROPIC_API_KEY=sk-ant-...your-anthropic-key
yarn code-review
```

> 💡 代码会自动检测环境变量：
> - 如果有 `OPENAI_API_KEY` → 使用 OpenAI (gpt-4o)
> - 如果有 `ANTHROPIC_API_KEY` → 使用 Anthropic (claude-sonnet-4-5)

### 方法 2: 在 config.json 中配置

编辑 `scripts/code-review/config.json`:

```json
{
  "scanPatterns": [...],
  "excludePatterns": [...],
  "reviewRules": {...},
  "outputFormat": "markdown",
  "outputPath": "docs/code-review",
  
  "aiProvider": "OPENAI",    // 或 "ANTHROPIC"
  "aiModel": "gpt-4o"        // 指定具体模型
}
```

## 📝 可用模型列表

### OpenAI 模型
```json
"aiProvider": "OPENAI",
"aiModel": "gpt-4o"           // 最新，最智能
// 或
"aiModel": "gpt-4-turbo"      // 快速，性价比高
// 或
"aiModel": "gpt-4"            // 稳定
// 或
"aiModel": "gpt-3.5-turbo"    // 经济实惠
```

### Anthropic 模型
```json
"aiProvider": "ANTHROPIC",
"aiModel": "claude-sonnet-4-5-20250929"  // 最新
// 或
"aiModel": "claude-opus-4-20250514"      // 最强
// 或
"aiModel": "claude-sonnet-3-5-20240620"  // 平衡
```

## 💰 成本对比

### OpenAI 定价
| 模型 | 输入 (每百万 tokens) | 输出 (每百万 tokens) |
|------|---------------------|---------------------|
| GPT-4o | $2.50 | $10.00 |
| GPT-4 Turbo | $10.00 | $30.00 |
| GPT-4 | $30.00 | $60.00 |
| GPT-3.5 Turbo | $0.50 | $1.50 |

### Anthropic 定价
| 模型 | 输入 (每百万 tokens) | 输出 (每百万 tokens) |
|------|---------------------|---------------------|
| Claude Sonnet 4.5 | $3.00 | $15.00 |
| Claude Opus 4 | $15.00 | $75.00 |
| Claude Sonnet 3.5 | $3.00 | $15.00 |

## 🔧 完整配置示例

### 示例 1: 使用 OpenAI GPT-4o (推荐)
```json
{
  "scanPatterns": [
    "src/components/**/*.{ts,tsx,js,jsx}",
    "src/pages/**/*.{ts,tsx,js,jsx}",
    "src/hooks/**/*.{ts,tsx,js,jsx}"
  ],
  "excludePatterns": [
    "node_modules/**",
    "dist/**"
  ],
  "reviewRules": {
    "checkCodeQuality": true,
    "checkSecurity": true,
    "checkPerformance": true,
    "checkBestPractices": true,
    "checkTypeScript": true,
    "checkReactPatterns": true
  },
  "outputFormat": "markdown",
  "outputPath": "docs/code-review",
  "aiProvider": "OPENAI",
  "aiModel": "gpt-4o"
}
```

### 示例 2: 使用 GPT-3.5 Turbo (经济实惠)
```json
{
  "scanPatterns": ["src/**/*.{ts,tsx}"],
  "excludePatterns": ["node_modules/**"],
  "reviewRules": {
    "checkCodeQuality": true,
    "checkSecurity": true,
    "checkPerformance": false,
    "checkBestPractices": false,
    "checkTypeScript": true,
    "checkReactPatterns": true
  },
  "outputFormat": "markdown",
  "outputPath": "docs/code-review",
  "aiProvider": "OPENAI",
  "aiModel": "gpt-3.5-turbo"
}
```

### 示例 3: 使用 Anthropic Claude
```json
{
  "scanPatterns": ["src/**/*.{ts,tsx}"],
  "excludePatterns": ["node_modules/**"],
  "reviewRules": {
    "checkCodeQuality": true,
    "checkSecurity": true,
    "checkPerformance": true,
    "checkBestPractices": true,
    "checkTypeScript": true,
    "checkReactPatterns": true
  },
  "outputFormat": "markdown",
  "outputPath": "docs/code-review",
  "aiProvider": "ANTHROPIC",
  "aiModel": "claude-sonnet-4-5-20250929"
}
```

## 🔑 获取 API Key

### OpenAI API Key
1. 访问 https://platform.openai.com/api-keys
2. 登录/注册账号
3. 点击 "Create new secret key"
4. 复制 API Key (格式: `sk-...`)

### Anthropic API Key
1. 访问 https://console.anthropic.com/
2. 登录/注册账号
3. 进入 API Keys 页面
4. 点击 "Create Key"
5. 复制 API Key (格式: `sk-ant-...`)

## 🚀 使用步骤

### 步骤 1: 设置 API Key
```bash
# OpenAI
export OPENAI_API_KEY=sk-...

# 或 Anthropic
export ANTHROPIC_API_KEY=sk-ant-...
```

### 步骤 2: 拉取最新代码
```bash
git pull origin main
```

### 步骤 3: 运行 Code Review
```bash
# 标准模式
yarn code-review

# 增强模式
yarn code-review:enhanced
```

## ⚙️ 优先级说明

配置优先级（从高到低）：
1. `config.json` 中的 `aiProvider` 和 `aiModel`
2. 环境变量 `OPENAI_API_KEY` 或 `ANTHROPIC_API_KEY`
3. 默认值（如果检测到 OPENAI_API_KEY 则用 OpenAI，否则用 Anthropic）

## 💡 使用建议

### 日常开发
```bash
# 使用 GPT-3.5 Turbo 快速检查
export OPENAI_API_KEY=sk-...
# config.json 设置: "aiModel": "gpt-3.5-turbo"
yarn code-review
```

### 重要代码审查
```bash
# 使用 GPT-4o 深度分析
export OPENAI_API_KEY=sk-...
# config.json 设置: "aiModel": "gpt-4o"
yarn code-review:enhanced
```

### PR 合并前
```bash
# 使用 Claude Sonnet 4.5 全面审查
export ANTHROPIC_API_KEY=sk-ant-...
# config.json 设置: "aiModel": "claude-sonnet-4-5-20250929"
yarn code-review:enhanced
```

## 🐛 故障排查

### 错误: "No model provided"
**原因**: 没有设置 API Key 或配置错误

**解决**:
```bash
# 确保设置了 API Key
export OPENAI_API_KEY=sk-...

# 或在 config.json 中明确指定
{
  "aiProvider": "OPENAI",
  "aiModel": "gpt-4o"
}
```

### 错误: "API key is invalid"
**原因**: API Key 无效或过期

**解决**:
1. 检查 API Key 是否正确
2. 访问对应平台重新生成

### 错误: "Rate limit exceeded"
**原因**: 超过 API 调用频率限制

**解决**:
1. 等待一段时间后重试
2. 减少扫描文件数量
3. 升级 API 套餐

## 📊 性能对比

| 模型 | 速度 | 质量 | 成本 | 推荐场景 |
|------|------|------|------|----------|
| GPT-4o | ⚡⚡⚡ | ⭐⭐⭐⭐⭐ | 💰💰 | 日常 + 重要 |
| GPT-4 Turbo | ⚡⚡ | ⭐⭐⭐⭐ | 💰💰💰 | 重要代码 |
| GPT-3.5 Turbo | ⚡⚡⚡⚡ | ⭐⭐⭐ | 💰 | 快速检查 |
| Claude Sonnet 4.5 | ⚡⚡ | ⭐⭐⭐⭐⭐ | 💰💰 | 深度分析 |

## ✅ 总结

现在你可以：
1. ✅ 使用环境变量自动选择 AI 提供商
2. ✅ 在 config.json 中明确指定模型
3. ✅ 根据需求选择不同的模型
4. ✅ 控制审查成本

立即开始使用：
```bash
export OPENAI_API_KEY=your_key_here
git pull origin main
yarn code-review
```
