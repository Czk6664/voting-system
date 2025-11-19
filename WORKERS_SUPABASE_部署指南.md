# Cloudflare Workers + Supabase 部署指南

## 🎯 方案优势

- ✅ **全球 CDN** - Cloudflare 全球分布，国内访问快
- ✅ **数据持久化** - Supabase PostgreSQL，数据永不丢失
- ✅ **免费额度充足** - Workers 100k请求/天 + Supabase 500MB
- ✅ **无服务器** - 自动扩展，无需维护
- ✅ **HTTPS 自动** - 免费 SSL 证书

---

## 📋 完整部署步骤

### 第一步：创建 Supabase 项目

1. **访问** https://supabase.com
2. **注册/登录**（用 GitHub 账号）
3. **创建新项目**
   - Project name: `voting-system`
   - Database Password: 设置密码（记住它！）
   - Region: 选择 **`Southeast Asia (Singapore)`**
4. **等待创建**（约 2 分钟）

### 第二步：创建数据库表

1. 在 Supabase 控制台，进入 **SQL Editor**
2. 点击 **"New query"**
3. 复制 `supabase-schema.sql` 的内容并运行
4. 确认创建成功（应该看到 3 个表：polls, votes, access_codes）

### 第三步：获取 Supabase 配置

1. 在 Supabase 控制台，进入 **Settings → API**
2. 复制以下信息：
   - **Project URL**: `https://xxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 第四步：部署到 Cloudflare Workers

#### 方法 1: 使用脚本（推荐）

```bash
deploy-workers-supabase.bat
```

按提示操作：
1. 安装 Wrangler CLI
2. 创建 KV 命名空间
3. 上传静态文件
4. 设置 Supabase 配置
5. 部署 Worker

#### 方法 2: 手动部署

##### 1. 安装 Wrangler CLI

```bash
npm install -g wrangler
```

##### 2. 登录 Cloudflare

```bash
wrangler login
```

##### 3. 安装项目依赖

```bash
# 复制 Workers 版本的 package.json
copy package-workers.json package.json
npm install
```

##### 4. 创建 KV 命名空间

```bash
wrangler kv:namespace create "STATIC_ASSETS" --config wrangler-supabase.toml
```

**重要**：复制返回的 `id`，更新 `wrangler-supabase.toml` 中的：
```toml
[[kv_namespaces]]
binding = "STATIC_ASSETS"
id = "你的命名空间ID"  # 替换这里
```

##### 5. 上传静态文件

```bash
wrangler kv:key put --binding=STATIC_ASSETS "index.html" --path=index.html --config wrangler-supabase.toml
wrangler kv:key put --binding=STATIC_ASSETS "admin.html" --path=admin.html --config wrangler-supabase.toml
wrangler kv:key put --binding=STATIC_ASSETS "voter.html" --path=voter.html --config wrangler-supabase.toml
wrangler kv:key put --binding=STATIC_ASSETS "display.html" --path=display.html --config wrangler-supabase.toml
wrangler kv:key put --binding=STATIC_ASSETS "style.css" --path=style.css --config wrangler-supabase.toml
```

##### 6. 设置 Secrets

```bash
# 设置 Supabase URL
wrangler secret put SUPABASE_URL --config wrangler-supabase.toml
# 输入: https://你的项目.supabase.co

# 设置 Supabase Anon Key
wrangler secret put SUPABASE_ANON_KEY --config wrangler-supabase.toml
# 输入: 你的anon-key

# 设置管理员密码（可选）
wrangler secret put ADMIN_PASSWORD --config wrangler-supabase.toml
# 输入: 你的密码
```

##### 7. 部署

```bash
wrangler deploy --config wrangler-supabase.toml
```

##### 8. 访问你的网站

```
https://voting-system.你的账号.workers.dev
```

---

## 🔧 本地开发

### 1. 创建 .dev.vars 文件

```bash
SUPABASE_URL=https://你的项目.supabase.co
SUPABASE_ANON_KEY=你的anon-key
ADMIN_PASSWORD=admin123
```

### 2. 启动开发服务器

```bash
wrangler dev --config wrangler-supabase.toml
```

### 3. 访问

```
http://localhost:8787
```

---

## 📊 架构说明

```
用户请求
    ↓
Cloudflare Workers (全球 CDN)
    ↓
Supabase PostgreSQL (数据存储)
    ↓
返回结果
```

**优势**：
- Workers 处理请求，全球分布，延迟低
- Supabase 存储数据，持久化，不丢失
- 两者结合，性能最优

---

## 💰 费用说明

### Cloudflare Workers 免费额度
- ✅ 100,000 请求/天
- ✅ 10ms CPU 时间/请求
- ✅ 1GB KV 存储
- ✅ 1000 次 KV 写入/天

### Supabase 免费额度
- ✅ 500MB 数据库存储
- ✅ 2GB 文件存储
- ✅ 50,000 月活用户
- ✅ 500MB 出站流量/月

**对于投票系统，免费额度完全够用！**

---

## 🚀 更新部署

### 修改代码后

```bash
wrangler deploy --config wrangler-supabase.toml
```

### 更新静态文件

```bash
wrangler kv:key put --binding=STATIC_ASSETS "index.html" --path=index.html --config wrangler-supabase.toml
```

### 更新 Secrets

```bash
wrangler secret put ADMIN_PASSWORD --config wrangler-supabase.toml
```

---

## 📝 常用命令

```bash
# 查看日志
wrangler tail --config wrangler-supabase.toml

# 查看 KV 数据
wrangler kv:key list --binding=STATIC_ASSETS --config wrangler-supabase.toml

# 删除 Worker
wrangler delete --config wrangler-supabase.toml

# 查看部署信息
wrangler deployments list --config wrangler-supabase.toml
```

---

## 🐛 常见问题

### 1. 部署失败：KV namespace not found

**原因**：未创建 KV 命名空间或 ID 不正确

**解决**：
```bash
wrangler kv:namespace create "STATIC_ASSETS" --config wrangler-supabase.toml
# 复制返回的 id，更新 wrangler-supabase.toml
```

### 2. 静态文件 404

**原因**：未上传静态文件到 KV

**解决**：
```bash
wrangler kv:key put --binding=STATIC_ASSETS "index.html" --path=index.html --config wrangler-supabase.toml
```

### 3. 数据库连接失败

**原因**：Supabase URL 或 Key 不正确

**解决**：
```bash
# 重新设置
wrangler secret put SUPABASE_URL --config wrangler-supabase.toml
wrangler secret put SUPABASE_ANON_KEY --config wrangler-supabase.toml
```

### 4. 投票失败

**检查**：
1. 数据库表是否创建
2. Supabase 配置是否正确
3. 查看 Worker 日志：`wrangler tail --config wrangler-supabase.toml`

---

## 🌐 绑定自定义域名

### 1. 在 Cloudflare 添加域名

1. 登录 Cloudflare Dashboard
2. 添加你的域名
3. 更新 DNS 记录

### 2. 绑定到 Worker

```bash
wrangler deploy --config wrangler-supabase.toml --route "voting.你的域名.com/*"
```

或在 `wrangler-supabase.toml` 中添加：
```toml
routes = [
  { pattern = "voting.你的域名.com/*", zone_name = "你的域名.com" }
]
```

---

## 📈 性能优化

### 1. 启用缓存

在 `src/worker.js` 中添加：
```javascript
return new Response(content, {
  headers: {
    'Cache-Control': 'public, max-age=3600',
  },
});
```

### 2. 压缩响应

Workers 自动启用 Gzip/Brotli 压缩

### 3. 数据库索引

已在 `supabase-schema.sql` 中创建索引

---

## 🎉 完成！

现在你的投票系统：
- ✅ 全球 CDN 加速
- ✅ 数据永久保存
- ✅ 国内访问快
- ✅ 免费运行

访问你的 Workers 域名开始使用吧！

---

## 📞 获取帮助

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Supabase 文档](https://supabase.com/docs)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
