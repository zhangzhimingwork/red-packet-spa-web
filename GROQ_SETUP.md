# 获取 Groq API Key（免费）

1. 访问 https://console.groq.com/
2. 注册账号（使用 Google/GitHub 登录）
3. 进入 API Keys 页面
4. 点击 "Create API Key"
5. 复制 key（格式: `gsk_...`）

# 配置

将 key 添加到 `.env` 文件：

```bash
GROQ_API_KEY=gsk_your_key_here
```

# 运行

```bash
git pull origin main
yarn install
yarn code-review
```

# Groq 优势

- ✅ **完全免费**
- ⚡ **超快速度**（比 OpenAI 快 10 倍）
- 🎯 **高质量**（使用 Llama 3.3 70B 模型）
- 🚀 **无需信用卡**

# 可用模型

在 `config.json` 中修改 `aiModel`:

- `llama-3.3-70b-versatile` (默认，推荐)
- `llama-3.1-70b-versatile`
- `mixtral-8x7b-32768`
