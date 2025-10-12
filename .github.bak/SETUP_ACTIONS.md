# GitHub Actions 配置指南

由于 GitHub API 限制，工作流文件无法通过 API 直接创建。请按以下步骤手动创建：

## 创建工作流文件

### 1. 创建文件
在你的项目根目录创建文件：`.github/workflows/code-review.yml`

### 2. 复制以下内容到文件中

```yaml
name: Code Review

on:
  push:
    branches:
      - main
      - develop
  pull_request:
    branches:
      - main
      - develop
  workflow_dispatch:

jobs:
  code-review:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'yarn'
          
      - name: Install dependencies
        run: yarn install --frozen-lockfile
        
      - name: Run Code Review
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: yarn code-review:enhanced
        continue-on-error: true
        
      - name: Upload Code Review Report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: code-review-report
          path: docs/code-review/latest-enhanced.md
          retention-days: 30
          
      - name: Comment PR with Review Results
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const reportPath = 'docs/code-review/latest-enhanced.md';
            
            if (fs.existsSync(reportPath)) {
              const report = fs.readFileSync(reportPath, 'utf8');
              
              github.rest.issues.createComment({
                issue_number: context.issue.number,
                owner: context.repo.owner,
                repo: context.repo.repo,
                body: `## 🔍 Code Review Report\n\n${report}`
              });
            }
```

### 3. 提交文件
```bash
git add .github/workflows/code-review.yml
git commit -m "feat: 添加 Code Review GitHub Actions 工作流"
git push origin main
```

## 配置 GitHub Secret

### 1. 获取 Anthropic API Key
- 访问 [Anthropic Console](https://console.anthropic.com/)
- 创建或复制你的 API Key

### 2. 添加到 GitHub Secrets
1. 打开你的 GitHub 仓库
2. 进入 Settings → Secrets and variables → Actions
3. 点击 "New repository secret"
4. Name: `ANTHROPIC_API_KEY`
5. Value: 粘贴你的 API Key
6. 点击 "Add secret"

## 工作流说明

### 触发条件
- **Push**: 推送到 main 或 develop 分支时运行
- **Pull Request**: 创建 PR 到 main 或 develop 时运行
- **Manual**: 可以在 Actions 页面手动触发

### 主要步骤
1. **Checkout code**: 检出代码
2. **Setup Node.js**: 设置 Node.js 环境
3. **Install dependencies**: 安装依赖
4. **Run Code Review**: 运行增强版 Code Review
5. **Upload Report**: 上传报告为 Artifact（保留 30 天）
6. **Comment PR**: 如果是 PR，自动评论审查结果

### 注意事项
- `continue-on-error: true` 确保即使发现问题，工作流也能继续
- 报告会自动上传为 Artifact，可在 Actions 页面下载
- PR 会自动收到评论，包含完整的审查报告

## 使用标准模式（可选）

如果想使用标准模式而不是增强模式，修改这一行：
```yaml
run: yarn code-review  # 改为标准模式
```

## 测试工作流

### 方法 1: 推送代码
```bash
git push origin main
```

### 方法 2: 手动触发
1. 进入 GitHub 仓库
2. 点击 Actions 标签
3. 选择 "Code Review" 工作流
4. 点击 "Run workflow"

### 方法 3: 创建 PR
创建一个 Pull Request 到 main 分支

## 查看结果

### 查看工作流执行
1. 进入 Actions 标签
2. 点击最近的工作流运行
3. 查看各步骤的日志

### 下载报告
1. 在工作流运行详情页
2. 滚动到底部的 "Artifacts" 部分
3. 点击 "code-review-report" 下载

### PR 评论
- 如果是 PR 触发，检查 PR 页面的评论
- 会看到完整的 Code Review 报告

## 故障排查

### 问题: API Key 错误
- 检查 Secret 名称是否为 `ANTHROPIC_API_KEY`
- 确认 API Key 有效且有足够配额

### 问题: 依赖安装失败
- 检查 package.json 是否包含所有必需依赖
- 尝试本地运行 `yarn install` 确认

### 问题: 工作流未触发
- 检查分支名称是否匹配（main/develop）
- 确认 Actions 权限已启用

## 高级配置

### 只在特定文件变更时运行
```yaml
on:
  push:
    branches:
      - main
    paths:
      - 'src/**'
      - '!src/**/*.test.*'
```

### 添加代码质量门禁
```yaml
- name: Check for high severity issues
  run: |
    if grep -q "🔴 High:" docs/code-review/latest-enhanced.md; then
      echo "High severity issues found!"
      exit 1
    fi
```

### 定时运行
```yaml
on:
  schedule:
    - cron: '0 0 * * 1'  # 每周一运行
```

## 完成！

现在你的 Code Review 功能已经完全集成到 GitHub Actions 中了！🎉
