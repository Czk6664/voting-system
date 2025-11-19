# Cloudflare 部署说明

## ⚠️ 重要提示

**anonymous-voting-system 是一个 Node.js 后端应用，不能直接部署到 Cloudflare Pages。**

Cloudflare Pages 只支持静态网站（HTML/CSS/JS），而本项目需要：
- Node.js 运行时
- Express 框架
- WebSocket 支持
- 文件系统访问

---

## 🔄 部署方案对比

### ❌ Cloudflare Pages
- **不支持**: Node.js 后端
- **不支持**: Express 框架
- **不支持**: WebSocket
- **不支持**: 文件系统

### ⚠️ Cloudflare Workers
- **支持**: 但需要大量代码改造
- **需要改造**:
  - Express → Workers API
  - WebSocket → Durable Objects
  - 文件存储 → KV/D1 数据库
  - 所有路由逻辑重写

### ✅ 推荐方案

#### 1. Vercel (最推荐)
- ✅ 完美支持 Node.js
- ✅ 自动 HTTPS
- ✅ 全球 CDN
- ✅ 零配置部署
- ✅ 免费额度充足

#### 2. Railway
- ✅ 支持 Node.js
- ✅ 支持 WebSocket
- ✅ 自动部署
- ✅ 免费额度

#### 3. Render
- ✅ 支持 Node.js
- ✅ 自动 HTTPS
- ✅ 免费层可用

---

## 🚀 快速部署到 Vercel（推荐）

### 方法 1: 命令行部署

```bash
# 1. 安装 Vercel CLI
npm install -g vercel

# 2. 登录 Vercel
vercel login

# 3. 部署项目
cd d:\CascadeProjects\anonymous-voting-system
vercel

# 4. 生产部署
vercel --prod
```

### 方法 2: GitHub + Vercel 自动部署

1. **将项目推送到 GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/你的用户名/voting-system.git
git push -u origin main
```

2. **连接 Vercel**
- 访问 https://vercel.com
- 点击 "Import Project"
- 选择你的 GitHub 仓库
- 点击 "Deploy"

3. **配置环境变量**
在 Vercel 项目设置中添加：
```
ADMIN_PASSWORD=你的安全密码
NODE_ENV=production
```

---

## 📝 Vercel 配置文件

已为你创建 `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "app.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "app.js"
    }
  ]
}
```

---

## 🔧 如果坚持使用 Cloudflare Workers

### 需要的改造工作

#### 1. 创建 Worker 入口文件
```javascript
// worker.js
export default {
  async fetch(request, env, ctx) {
    // 处理所有请求
    const url = new URL(request.url);
    
    // 路由处理
    if (url.pathname === '/api/admin/login') {
      return handleAdminLogin(request, env);
    }
    // ... 其他路由
    
    // 返回静态文件
    return env.ASSETS.fetch(request);
  }
}
```

#### 2. 使用 KV 存储数据
```javascript
// 保存数据
await env.VOTING_DATA.put('polls', JSON.stringify(polls));

// 读取数据
const polls = JSON.parse(await env.VOTING_DATA.get('polls'));
```

#### 3. 使用 Durable Objects 实现 WebSocket
```javascript
export class VotingRoom {
  constructor(state, env) {
    this.state = state;
    this.sessions = [];
  }

  async fetch(request) {
    // WebSocket 处理
    const pair = new WebSocketPair();
    this.handleSession(pair[1]);
    return new Response(null, {
      status: 101,
      webSocket: pair[0],
    });
  }
}
```

#### 4. 重写所有 Express 路由
每个 Express 路由都需要改为 Workers 格式：

```javascript
// Express (原代码)
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  // ...
});

// Workers (需要改造)
async function handleAdminLogin(request, env) {
  const { password } = await request.json();
  // ...
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

### 改造工作量估计
- 📝 重写代码: 约 80% 的代码需要重写
- ⏱️ 预计时间: 2-3 天
- 💰 成本: Workers 免费额度可能不够用

---

## 🎯 推荐部署流程

### 使用 Vercel（5分钟完成）

1. **准备工作**
```bash
# 确保项目可以本地运行
npm install
npm start
```

2. **部署到 Vercel**
```bash
# 安装 CLI
npm install -g vercel

# 登录
vercel login

# 部署
vercel
```

3. **设置环境变量**
```bash
vercel env add ADMIN_PASSWORD
# 输入你的安全密码

vercel env add NODE_ENV
# 输入: production
```

4. **生产部署**
```bash
vercel --prod
```

5. **完成！**
你的网站将在 `https://你的项目名.vercel.app` 上线

---

## 🌐 其他部署平台

### Railway

1. 访问 https://railway.app
2. 连接 GitHub 仓库
3. 选择项目
4. 添加环境变量
5. 自动部署

### Render

1. 访问 https://render.com
2. 创建新的 Web Service
3. 连接 GitHub 仓库
4. 配置：
   - Build Command: `npm install`
   - Start Command: `npm start`
5. 添加环境变量
6. 部署

---

## 📊 平台对比

| 平台 | Node.js | WebSocket | 免费额度 | 部署难度 | 推荐度 |
|------|---------|-----------|----------|----------|--------|
| Vercel | ✅ | ✅ | 充足 | ⭐ | ⭐⭐⭐⭐⭐ |
| Railway | ✅ | ✅ | 一般 | ⭐⭐ | ⭐⭐⭐⭐ |
| Render | ✅ | ✅ | 一般 | ⭐⭐ | ⭐⭐⭐⭐ |
| Cloudflare Workers | ⚠️ | ⚠️ | 有限 | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| Cloudflare Pages | ❌ | ❌ | - | - | ❌ |

---

## 💡 总结

1. **最简单**: 使用 Vercel，5分钟完成部署
2. **最灵活**: 使用 Railway 或 Render
3. **最复杂**: 改造代码适配 Cloudflare Workers

**强烈建议使用 Vercel！**

---

## 🆘 需要帮助？

如果你需要：
1. ✅ Vercel 部署帮助 - 运行 `vercel login` 后联系我
2. ✅ 环境变量配置 - 查看 `.env.example`
3. ⚠️ Cloudflare Workers 改造 - 需要 2-3 天开发时间

---

**更新时间**: 2025-11-19  
**作者**: Cascade AI
