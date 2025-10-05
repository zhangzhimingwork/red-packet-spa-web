# Cloudflare Pages 构建配置

## 构建设置

- **框架预设**: None
- **构建命令**: `npm run build`
- **构建输出目录**: `dist`
- **根目录**: `/` (留空)
- **Node.js 版本**: 18 或更高

## 环境变量

在 Cloudflare Pages Dashboard 设置以下环境变量（如果需要）：

```
NODE_VERSION=18
# 其他环境变量...
```

## 部署步骤

### 方法 1: 通过 Cloudflare Dashboard

1. 访问 https://dash.cloudflare.com
2. 选择 **Workers & Pages**
3. 选择你的项目 `red-packet-spa-web`
4. 进入 **Settings** → **Builds & deployments**
5. 配置构建命令：
   - 构建命令: `npm run build`
   - 构建输出目录: `dist`
6. 保存并重新部署

### 方法 2: 使用 Wrangler CLI

```bash
# 安装 Wrangler
npm install -g wrangler

# 登录
wrangler login

# 构建项目
npm run build

# 部署
wrangler pages deploy dist --project-name=red-packet-spa-web
```

## 故障排除

### 构建失败

如果看到 `EUNSUPPORTEDPROTOCOL` 错误，说明构建命令配置错误。

**错误示例**:
```
npm install -g yarn@1.22.22 yarn install --frozen-lockfile yarn client:server
```

**正确配置**:
```
npm run build
```

### 依赖安装问题

Cloudflare Pages 会自动运行 `npm ci` 安装依赖，无需在构建命令中指定。

## 自动部署

每次推送到 `main` 分支都会自动触发部署。
