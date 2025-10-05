# MetaMask 签名警告 - 前端配置说明

## 问题说明

MetaMask 显示警告："提出请求的网站不是您正在登录的网站"，这是因为签名消息中的 domain 与实际网站不匹配。

## 已修复 ✅

后端已更新，会自动从请求头中获取正确的 `origin` 作为 domain，无需前端修改代码。

## 工作原理

1. **前端发起请求：**
   ```typescript
   // src/hooks/useAuth.ts
   const nonceResponse = await axios.post(`${API_BASE_URL}/api/auth/nonce`, {
     address
   });
   ```

2. **axios 自动添加 Origin 头：**
   ```
   Origin: http://localhost:3000
   ```

3. **后端提取 Origin：**
   ```javascript
   const origin = ctx.request.headers.origin; // "http://localhost:3000"
   const domain = origin.replace(/^https?:\/\//, ''); // "localhost:3000"
   ```

4. **生成匹配的签名消息：**
   ```
   localhost:3000 wants you to sign in with your Ethereum account:
   0x...
   ```

5. **MetaMask 验证通过：**
   - 请求来自：`http://localhost:3000`
   - 消息中的 domain：`localhost:3000`
   - ✅ 匹配，不显示警告

## 测试步骤

### 1. 更新后端代码
```bash
cd red-packet-spa-backend
git pull origin main
npm install
npm run dev
```

### 2. 启动前端
```bash
cd red-packet-spa-web
npm run dev
```

### 3. 测试签名
1. 打开浏览器访问 `http://localhost:3000`
2. 连接 MetaMask
3. 点击登录按钮
4. **预期结果：**
   - ✅ MetaMask 不再显示警告
   - ✅ 签名消息中显示 `localhost:3000`
   - ✅ 签名成功，获得 token

## 不同环境配置

### 开发环境 (localhost)
```typescript
// .env.development
VITE_API_BASE_URL=http://localhost:3001
```

浏览器自动发送：`Origin: http://localhost:3000`

### 测试环境
```typescript
// .env.staging
VITE_API_BASE_URL=https://api-staging.yourdomain.com
```

浏览器自动发送：`Origin: https://staging.yourdomain.com`

### 生产环境
```typescript
// .env.production
VITE_API_BASE_URL=https://api.yourdomain.com
```

浏览器自动发送：`Origin: https://yourdomain.com`

## 代码说明

### useAuth.ts 无需修改
当前代码已经正确工作，axios 会自动添加正确的 Origin 头：

```typescript
// 步骤1: 获取签名消息（自动包含 Origin）
const nonceResponse = await axios.post<NonceResponse>(
  `${API_BASE_URL}/api/auth/nonce`, 
  { address }
);

// 步骤2: 签名消息
const signature = await signMessageAsync({ 
  message: nonceResponse.data.message 
});

// 步骤3: 验证签名
const verifyResponse = await axios.post<VerifyResponse>(
  `${API_BASE_URL}/api/auth/verify`,
  { address, signature, message: nonceResponse.data.message }
);
```

## CORS 配置

确保后端 CORS 配置允许你的前端域名：

```javascript
// api/index.js
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```

**多个域名：**
```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://staging.yourdomain.com',
    'https://yourdomain.com'
  ],
  credentials: true
}));
```

## 故障排查

### 问题 1: 仍然显示警告
**原因：** 后端未正确获取 Origin

**解决：**
1. 检查网络请求，确认 Origin 头存在
2. 检查后端日志，查看获取的 domain
3. 清除浏览器缓存重试

### 问题 2: 跨域错误
**原因：** CORS 配置不正确

**解决：**
```javascript
// 后端添加 CORS 中间件
app.use(cors({
  origin: ctx => {
    const origin = ctx.request.headers.origin;
    // 验证是否为允许的域名
    return origin;
  },
  credentials: true
}));
```

### 问题 3: Origin 为空
**原因：** 某些情况下浏览器不发送 Origin

**解决：**
后端已有回退机制：
```javascript
const origin = ctx.request.headers.origin || 
               process.env.FRONTEND_URL || 
               'http://localhost:3000';
```

## 调试方法

### 1. 查看网络请求
打开浏览器开发者工具：
```
Network -> 选择 nonce 请求 -> Headers
```

检查：
- ✅ Request Headers 中有 `Origin: http://localhost:3000`
- ✅ Response 中的 message 包含正确的 domain

### 2. 查看 MetaMask 签名消息
点击签名时，MetaMask 会显示完整消息：
```
localhost:3000 wants you to sign in with your Ethereum account:
0xYourAddress...

Welcome to our DApp! Please sign this message to verify your identity.

URI: https://localhost:3000
Version: 1
Chain ID: 1
Nonce: abc123...
Issued At: 2025-10-05T13:00:00.000Z
Expiration Time: 2025-10-05T13:05:00.000Z
```

确认第一行的 domain 与浏览器地址栏匹配。

### 3. 控制台调试
在 `useAuth.ts` 中添加日志：
```typescript
const nonceResponse = await axios.post<NonceResponse>(...);
console.log('签名消息:', nonceResponse.data.message);
console.log('当前网站:', window.location.origin);
```

## 安全说明

### 为什么需要 domain 验证？
1. **防止钓鱼攻击：** 恶意网站无法冒充合法网站
2. **用户知情权：** 用户清楚知道自己在为哪个网站签名
3. **标准合规：** 符合 EIP-4361 安全标准

### Origin 头的安全性
- ✅ 由浏览器自动设置，前端无法伪造
- ✅ CORS 保护，只有白名单域名可以访问
- ✅ 后端验证 Origin 与消息 domain 一致

## 备选方案：简化消息格式

如果你不需要严格的 EIP-4361 标准，可以使用简化格式（已在后端 `message.js` 中准备）：

```javascript
// 简化格式，不包含 domain 信息
return `Welcome to our DApp!

Please sign this message to verify your identity.

Address: ${address}
Nonce: ${nonce}
Issued At: ${issuedAt}
Expiration Time: ${expirationTime}

This request will not trigger a blockchain transaction or cost any gas fees.`;
```

**切换方法：**
在 `src/utils/message.js` 中注释/取消注释对应代码块。

## 相关资源

- [EIP-4361 标准](https://eips.ethereum.org/EIPS/eip-4361)
- [MetaMask 文档](https://docs.metamask.io/)
- [后端修复说明](https://github.com/zhangzhimingwork/red-packet-spa-backend/blob/main/METAMASK_SIGNING_FIX.md)

## 更新日志

- **2025-10-05**: 问题已修复
  - 后端自动获取正确的 Origin
  - 前端无需修改
  - MetaMask 不再显示警告
