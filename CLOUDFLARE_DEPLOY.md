# Red Packet SPA Web - Cloudflare Pages 部署指南

Web3 红包应用前端，现已支持部署到 Cloudflare Pages！

## 🚀 快速开始

### 本地开发

```bash
# 克隆项目
git clone https://github.com/zhangzhimingwork/red-packet-spa-web.git
cd red-packet-spa-web

# 安装依赖（使用 npm）
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:8080
```

### 构建生产版本

```bash
# 构建
npm run build

# 预览生产构建
npm run preview
```

## 📦 部署到 Cloudflare Pages

### 方法 1: 通过 Cloudflare Dashboard（推荐）

1. **登录 Cloudflare**
   - 访问 https://dash.cloudflare.com
   - 选择 **Workers & Pages**

2. **创建新项目**
   - 点击 **Create application**
   - 选择 **Pages** 标签
   - 点击 **Connect to Git**

3. **连接 GitHub 仓库**
   - 授权 Cloudflare 访问你的 GitHub
   - 选择 `red-packet-spa-web` 仓库

4. **配置构建设置**
   ```
   框架预设: None
   构建命令: npm run build
   构建输出目录: dist
   根目录: /
   Node 版本: 18 或更高
   ```

5. **环境变量（可选）**
   在 **Environment variables** 部分添加：
   - `NODE_VERSION`: `18`
   - 其他必要的环境变量

6. **开始部署**
   - 点击 **Save and Deploy**
   - 等待构建完成（约 2-5 分钟）

7. **访问你的应用**
   - 部署成功后会得到一个 URL: `https://your-project.pages.dev`

### 方法 2: 使用 Wrangler CLI

```bash
# 安装 Wrangler
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 构建项目
npm run build

# 部署到 Cloudflare Pages
wrangler pages deploy dist --project-name=red-packet-spa-web
```

### 方法 3: 使用 GitHub Actions 自动部署

创建 `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: red-packet-spa-web
          directory: dist
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

## 🔧 配置自定义域名

1. 在 Cloudflare Pages 项目中
2. 选择 **Custom domains** 标签
3. 点击 **Set up a custom domain**
4. 输入你的域名（例如：app.yourdomain.com）
5. Cloudflare 会自动配置 DNS

## 🔐 环境变量配置

在 Cloudflare Pages Dashboard 中设置环境变量：

1. 选择你的项目
2. 进入 **Settings** → **Environment variables**
3. 添加需要的变量：
   - `VITE_API_URL`: 后端 API 地址
   - `VITE_CHAIN_ID`: 区块链网络 ID
   - 其他必要的配置

## 📝 可用脚本

```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run preview      # 预览生产构建
npm run test         # 运行单元测试
npm run test:e2e     # 运行 E2E 测试
npm run lint         # 代码检查
npm run lint:fix     # 自动修复代码问题
```

## 🔄 从 Yarn 迁移到 npm

如果你之前使用 Yarn，现在已完全迁移到 npm：

1. **删除旧文件**
   ```bash
   rm yarn.lock
   rm -rf node_modules
   ```

2. **使用 npm 安装**
   ```bash
   npm install
   ```

3. **运行项目**
   ```bash
   npm run dev
   ```

## 📊 构建优化

项目已配置以下优化：

- ✅ Webpack 5 代码分割
- ✅ CSS 压缩和优化
- ✅ Tree shaking
- ✅ 资源压缩（Terser）
- ✅ 缓存优化

## 🌐 浏览器支持

- Chrome (最新)
- Firefox (最新)
- Safari (最新)
- Edge (最新)

## 🐛 故障排除

### 构建失败

1. 确保 Node.js 版本 >= 18
2. 删除 `node_modules` 和 `package-lock.json`
3. 重新安装依赖：`npm install`
4. 重新构建：`npm run build`

### 部署失败

1. 检查构建输出目录是否为 `dist`
2. 确认 `npm run build` 本地能成功运行
3. 查看 Cloudflare Pages 部署日志

### 环境变量不生效

1. 确保在 Cloudflare Dashboard 中正确设置
2. 变量名必须以 `VITE_` 开头（如果使用 Vite）
3. 重新部署项目

## 📚 相关文档

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Webpack 文档](https://webpack.js.org/)
- [React 文档](https://react.dev/)

## 📄 License

ISC

---

**享受使用 Cloudflare Pages 的极速部署体验！** 🎉
