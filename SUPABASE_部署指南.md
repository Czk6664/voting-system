# Supabase + Railway/Vercel 部署指南

## 🎯 方案优势

- ✅ **数据持久化** - PostgreSQL 数据库，数据永不丢失
- ✅ **免费额度充足** - Supabase 500MB + Railway $5/月
- ✅ **国内可访问** - 选择亚洲节点
- ✅ **WebSocket 支持** - 实时更新正常工作
- ✅ **代码改动小** - 只需配置环境变量

---

## 📋 完整部署步骤

### 第一步：创建 Supabase 项目

1. **访问** https://supabase.com
2. **注册/登录**（用 GitHub 账号）
3. **创建新项目**
   - Project name: `voting-system`
   - Database Password: 设置密码（记住它！）
   - Region: 选择 **`Southeast Asia (Singapore)`** 或 **`Northeast Asia (Tokyo)`**
4. **等待创建**（约 2 分钟）

### 第二步：创建数据库表

1. 在 Supabase 控制台，进入 **SQL Editor**
2. 点击 **"New query"**
3. 复制 `supabase-schema.sql` 的内容
4. 粘贴并点击 **"Run"**
5. 确认创建成功（应该看到 3 个表）

### 第三步：获取 Supabase 配置

1. 在 Supabase 控制台，进入 **Settings → API**
2. 复制以下信息：
   - **Project URL**: `https://xxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 第四步：部署到 Railway

#### 4.1 访问 Railway

打开 https://railway.app/new

#### 4.2 导入项目

- 点击 **"Deploy from GitHub repo"**
- 选择 **`Czk6664/voting-system`**
- 点击 **"Deploy Now"**

#### 4.3 配置环境变量

在 Railway 项目中，进入 **Variables** 标签，添加：

```
SUPABASE_URL=https://你的项目.supabase.co
SUPABASE_ANON_KEY=你的anon-key
ADMIN_PASSWORD=你的管理员密码
PORT=3000
NODE_ENV=production
```

#### 4.4 生成域名

- 进入 **Settings** 标签
- 找到 **Networking** 部分
- 点击 **"Generate Domain"**
- 复制生成的域名

#### 4.5 等待部署完成

- 查看 **Deployments** 标签
- 等待状态变为 **"Success"**
- 访问生成的域名测试

---

## 🧪 本地测试

### 1. 创建 .env 文件

复制 `.env.example` 为 `.env`，填入你的配置：

```bash
PORT=3000
ADMIN_PASSWORD=你的密码
NODE_ENV=development

SUPABASE_URL=https://你的项目.supabase.co
SUPABASE_ANON_KEY=你的anon-key
```

### 2. 安装依赖

```bash
npm install
```

### 3. 启动服务

```bash
npm start
```

### 4. 访问测试

打开 http://localhost:3000

---

## 📊 数据库表结构

### polls 表（投票）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| title | TEXT | 标题 |
| description | TEXT | 描述 |
| options | JSONB | 候选人列表 |
| type | TEXT | 类型 |
| should_elect | INTEGER | 应选人数 |
| attendee_count | INTEGER | 到会人数 |
| allow_alternative | BOOLEAN | 允许另选 |
| status | TEXT | 状态 (draft/active/ended) |
| created_at | TIMESTAMP | 创建时间 |
| started_at | TIMESTAMP | 开始时间 |
| ended_at | TIMESTAMP | 结束时间 |

### votes 表（投票记录）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| poll_id | UUID | 投票ID |
| device_id | TEXT | 设备ID |
| vote_data | JSONB | 投票数据 |
| created_at | TIMESTAMP | 创建时间 |

### access_codes 表（访问码）

| 字段 | 类型 | 说明 |
|------|------|------|
| code | TEXT | 访问码（主键） |
| used | BOOLEAN | 是否已使用 |
| device_id | TEXT | 使用者设备ID |
| used_at | TIMESTAMP | 使用时间 |
| created_at | TIMESTAMP | 创建时间 |

---

## 🔧 常见问题

### 1. 连接数据库失败

**检查**：
- Supabase URL 是否正确
- anon key 是否正确
- 网络是否正常

**解决**：
```bash
# 测试连接
node -e "require('./lib/supabase')"
```

### 2. 表不存在

**原因**：未运行 SQL 脚本

**解决**：
1. 进入 Supabase SQL Editor
2. 运行 `supabase-schema.sql`

### 3. 投票失败

**检查**：
- 是否已投过票（唯一约束）
- 投票是否已开始
- 数据格式是否正确

### 4. Railway 部署失败

**常见原因**：
- 环境变量未配置
- 端口配置错误
- 依赖安装失败

**解决**：
- 检查 Variables 配置
- 查看 Deployment Logs

---

## 💰 费用说明

### Supabase 免费额度
- ✅ 500MB 数据库存储
- ✅ 2GB 文件存储
- ✅ 50,000 月活用户
- ✅ 500MB 出站流量/月

### Railway 免费额度
- ✅ $5 免费额度/月
- ✅ 约 500 小时运行时间

**对于投票系统，免费额度完全够用！**

---

## 🚀 更新部署

### 修改代码后

1. **提交到 GitHub**
   ```bash
   git add .
   git commit -m "更新说明"
   git push
   ```

2. **Railway 自动重新部署**
   - 无需手动操作
   - 等待部署完成

### 修改数据库

1. 在 Supabase SQL Editor 运行 SQL
2. 无需重启应用

---

## 📝 管理数据库

### 查看数据

在 Supabase 控制台：
- **Table Editor** - 可视化查看/编辑数据
- **SQL Editor** - 运行 SQL 查询

### 备份数据

```sql
-- 导出所有投票
SELECT * FROM polls;

-- 导出所有投票记录
SELECT * FROM votes;
```

### 清空数据

```sql
-- 清空所有投票记录（保留表结构）
TRUNCATE TABLE votes CASCADE;
TRUNCATE TABLE polls CASCADE;
TRUNCATE TABLE access_codes CASCADE;
```

---

## 🎉 完成！

现在你的投票系统：
- ✅ 数据永久保存
- ✅ 国内可访问
- ✅ 实时更新正常
- ✅ 免费运行

访问你的 Railway 域名开始使用吧！

---

## 📞 获取帮助

- [Supabase 文档](https://supabase.com/docs)
- [Railway 文档](https://docs.railway.app/)
- [项目 GitHub](https://github.com/Czk6664/voting-system)
