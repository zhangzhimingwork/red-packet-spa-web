# Code Review Agent - Mastra Implementation

## 🎯 概述

本项目实现了基于 **Mastra AI Agent 框架**的自动化代码审查功能，使用 Claude AI 进行智能代码分析。

## 📦 核心组件

### 1. **标准 Code Review Agent** (`agent.ts`)
- 使用 Mastra 的基础 Agent 功能
- 直接与 Claude AI 对话进行代码审查
- 适合快速、通用的代码检查

### 2. **增强版 Code Review Agent** (`enhanced-agent.ts`) ⭐
- 使用 Mastra 的 **Tools System**
- 提供专业的代码分析工具：
  - `readFileTool`: 文件读取
  - `analyzeComplexityTool`: 复杂度分析
  - `securityCheckTool`: 安全检查
  - `typeCheckTool`: TypeScript 类型检查
  - `reactHooksCheckTool`: React Hooks 规则检查

### 3. **Mastra Tools** (`tools.ts`)
使用 `createTool` API 创建的专业分析工具，展示了 Mastra 框架的真正能力：

```typescript
export const securityCheckTool = createTool({
  id: 'security-check',
  description: 'Check for common security issues in code',
  inputSchema: z.object({
    code: z.string(),
    fileType: z.string(),
  }),
  execute: async ({ context }) => {
    // 安全检查逻辑
  },
});
```

## 🚀 使用方法

### 安装依赖

```bash
yarn install
```

### 设置环境变量

```bash
export ANTHROPIC_API_KEY=your_api_key_here
```

或创建 `.env` 文件（参考 `.env.example`）

### 运行 Code Review

#### 标准模式
```bash
yarn code-review
```

#### 增强模式（使用 Mastra Tools）
```bash
yarn code-review:enhanced
```

#### 自定义配置
```bash
yarn code-review:custom path/to/config.json
```

## 🔧 配置文件

编辑 `scripts/code-review/config.json`:

```json
{
  "scanPatterns": [
    "src/**/*.{ts,tsx,js,jsx}",
    "!src/**/*.test.{ts,tsx,js,jsx}"
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
  "outputPath": "docs/code-review"
}
```

## 📊 Mastra 框架核心概念

### 1. Agent 初始化
```typescript
this.mastra = new Mastra({
  agents: {
    codeReviewer: new Agent({
      name: 'code-reviewer',
      instructions: '...',
      model: {
        provider: 'ANTHROPIC',
        name: 'claude-sonnet-4-5-20250929',
        toolChoice: 'auto',
      },
      tools: allTools, // 注册工具
    }),
  },
});
```

### 2. Tools 系统
```typescript
// 创建工具
const analyzeComplexityTool = createTool({
  id: 'analyze-complexity',
  description: 'Analyze code complexity metrics',
  inputSchema: z.object({
    code: z.string(),
  }),
  execute: async ({ context }) => {
    // 实现分析逻辑
    return complexityMetrics;
  },
});

// 注册到 Agent
tools: {
  analyzeComplexity: analyzeComplexityTool,
}
```

### 3. Agent 调用
```typescript
const agent = this.mastra.getAgent('codeReviewer');
const response = await agent.generate(prompt);
```

## 🛠️ 实现的工具详解

### 1. analyzeComplexityTool
计算代码复杂度指标：
- 代码行数（总行数、代码行、注释行）
- 嵌套深度
- 函数数量
- 条件语句数量
- 循环语句数量

### 2. securityCheckTool
检查常见安全问题：
- eval() 使用
- innerHTML XSS 风险
- 硬编码的密钥/密码
- dangerouslySetInnerHTML (React)

### 3. typeCheckTool
TypeScript 类型安全检查：
- any 类型使用
- @ts-ignore 注释
- 类型断言滥用

### 4. reactHooksCheckTool
React Hooks 规则验证：
- Hooks 调用位置检查
- useEffect 依赖项检查
- 条件/循环中使用 Hooks

## 📝 输出报告

### 报告位置
- 最新报告: `docs/code-review/latest.md`
- 增强报告: `docs/code-review/latest-enhanced.md`
- 历史报告: `docs/code-review/code-review-{timestamp}.md`

### 报告格式
```markdown
# Code Review Report

Generated: 2025-10-04 15:30:00

## Summary
- Files reviewed: 25
- Total issues found: 12
  - 🔴 High: 2
  - 🟡 Medium: 5
  - 🟢 Low: 5

## 🔴 High Severity Issues
### src/components/App.tsx
**security** (Line 45)
- Problem: Use of dangerouslySetInnerHTML can lead to XSS
- Suggestion: Use DOMPurify to sanitize HTML content

...
```

## 🔄 GitHub Actions 集成

工作流会在以下情况自动运行：
- Push 到 `main` 或 `develop` 分支
- 创建 Pull Request
- 手动触发

### 设置 GitHub Secret
在仓库设置中添加：
- `ANTHROPIC_API_KEY`: 你的 Anthropic API 密钥

## 🎯 关键特性

### ✅ 真正的 Mastra 实现
- 使用 `new Mastra()` 初始化框架
- 使用 `createTool()` 创建专业工具
- 使用 Agent 的 tools 参数注册工具
- Agent 自动调用工具完成任务

### ✅ 两种模式对比

| 特性 | 标准模式 | 增强模式 |
|------|---------|---------|
| 实现方式 | 基础 Agent | Agent + Tools |
| 分析深度 | 通用审查 | 专业工具深度分析 |
| 性能 | 快速 | 较慢但更准确 |
| 适用场景 | 日常检查 | 深度审查 |

## 🔍 工作流程

### 标准模式流程
1. 扫描匹配的文件
2. 读取文件内容
3. 发送给 Claude Agent
4. 解析 JSON 响应
5. 生成 Markdown 报告

### 增强模式流程
1. 扫描匹配的文件
2. Agent 接收任务
3. **Agent 自动调用工具**：
   - 调用 analyzeComplexity 分析复杂度
   - 调用 securityCheck 检查安全
   - 调用 typeCheck 检查类型
   - 调用 reactHooksCheck 检查 Hooks
4. Agent 综合工具结果给出建议
5. 解析响应并生成报告

## 🚨 注意事项

### 环境要求
- Node.js >= 18
- Yarn 经典版
- Anthropic API Key

### API 限制
- 注意 API 调用频率限制
- 大型项目建议分批审查
- 增强模式会使用更多 token

### 最佳实践
1. 先用标准模式快速检查
2. 对关键文件使用增强模式
3. 定期更新配置文件中的规则
4. 将报告纳入 PR 审查流程

## 📚 扩展开发

### 添加新工具
```typescript
// 在 tools.ts 中
export const myCustomTool = createTool({
  id: 'my-custom-tool',
  description: 'My custom analysis tool',
  inputSchema: z.object({
    // 定义输入
  }),
  execute: async ({ context }) => {
    // 实现逻辑
  },
});

// 在 enhanced-agent.ts 中注册
tools: {
  ...allTools,
  myCustom: myCustomTool,
}
```

### 自定义 Agent 指令
编辑 `getReviewInstructions()` 方法来调整 Agent 行为。

## 📖 相关资源

- [Mastra 官方文档](https://mastra.ai/docs)
- [Anthropic Claude API](https://docs.anthropic.com/)
- [项目仓库](https://github.com/zhangzhimingwork/red-packet-spa-web)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

ISC
