# 实时投票系统

一个功能完整的实时投票系统，支持匿名投票、实时统计、权限控制和防作弊机制。

## 功能特性

### 核心功能
- ✅ 投票管理（创建、开始、结束、复制投票）
- ✅ 单选/多选投票支持
  - 单选：每人只能选择一个选项
  - 多选：支持三种模式
    - 至少选择X个，至多选择Y个
    - 必须选择X个（精确数量）
- ✅ 匿名投票机制
- ✅ 实时投票统计（WebSocket）
- ✅ 访问控制（管理员/投票者角色）
- ✅ 防作弊（设备指纹 + 访问码）
- ✅ 投票结果展示（数字 + 饼图 + 柱状图）
- ✅ 结果导出（PDF + JSON格式）
- ✅ 投票历史记录（支持按状态筛选）
- ✅ 公开展示界面（可投屏，实时图表）

### 安全特性
- **投票码验证**：每个投票自动生成唯一的6位数字投票码
- **设备指纹识别**：基于IP + User-Agent防止重复投票
- **匿名投票**：无法追踪个人投票内容
- **一人一票限制**：每个设备只能对同一投票投一次票
- **访问控制**：只有输入正确投票码才能看到投票内容

## 快速开始

### 安装依赖
```bash
npm install
```

### 启动服务器
```bash
npm start
```

服务器将在 http://localhost:3000 启动

### 默认管理员密码
```
admin123
```

## 使用指南

### 1. 管理员操作流程

1. 访问首页，选择"管理员"
2. 使用密码登录（默认：admin123）
3. 创建投票：
   - 填写标题和描述
   - 选择单选/多选
   - 如果是多选，配置选择规则：
     - 至少选择几个
     - 至多选择几个
     - 或必须选择几个（精确数量）
   - 设置投票选项（每行一个）
   - 可选：设置通过/失败条件
4. 开始投票
5. 实时查看投票结果（带柱状图）
6. 结束投票后可：
   - 查看饼图和柱状图
   - 导出PDF报告
   - 导出JSON数据
   - 发起新一轮投票
7. 在"历史记录"标签查看所有投票记录

### 2. 投票者操作流程

1. 访问首页，选择"投票者"
2. 输入6位数字投票码（由管理员提供）
3. 验证成功后查看投票内容
4. 选择选项并提交投票
5. 提交后显示成功页面，可选择返回首页或查看结果

### 3. 公开展示

1. 访问首页，选择"公开展示"
2. 实时查看投票结果（适合投屏）
3. 自动刷新，同时显示：
   - 饼图（显示比例）
   - 柱状图（显示票数）
   - 详细数据列表

## 技术架构

### 后端
- Node.js + Express
- WebSocket (ws)
- 内存数据存储

### 前端
- 原生 HTML/CSS/JavaScript
- WebSocket 实时通信
- 响应式设计

## API 接口

### 管理员接口
- `POST /api/admin/login` - 管理员登录
- `POST /api/admin/poll` - 创建投票
- `POST /api/admin/poll/:id/start` - 开始投票
- `POST /api/admin/poll/:id/end` - 结束投票
- `POST /api/admin/poll/:id/duplicate` - 复制投票
- `GET /api/admin/polls` - 获取所有投票
- `POST /api/admin/generate-codes` - 生成访问码
- `GET /api/admin/poll/:id/export` - 导出结果

### 投票者接口
- `POST /api/poll/verify-code` - 验证投票码并获取投票
- `POST /api/vote` - 提交投票
- `GET /api/poll/:id/results` - 获取投票结果

### 公开展示接口
- `GET /api/poll/current` - 获取当前进行中的投票

## 配置说明

### 修改管理员密码
编辑 `app.js` 文件：
```javascript
const data = {
  adminPassword: 'your_password_here',
  // ...
};
```

### 修改端口
```javascript
const PORT = process.env.PORT || 3000;
```

或使用环境变量：
```bash
PORT=8080 npm start
```

## 部署指南

### 🚀 云平台部署（推荐）

#### Vercel 部署（最简单，5分钟完成）
```bash
# 1. 安装 CLI
npm install -g vercel

# 2. 部署
vercel

# 3. 生产部署
vercel --prod
```

或使用脚本：
```bash
deploy-vercel.bat
```

详细说明：📖 [快速部署指南](./快速部署指南.md)

#### 其他云平台
- **Railway**: https://railway.app
- **Render**: https://render.com
- **Heroku**: https://heroku.com

⚠️ **注意**: Cloudflare Pages 不支持 Node.js 应用，详见 [CLOUDFLARE_DEPLOY.md](./CLOUDFLARE_DEPLOY.md)

---

### 🖥️ 服务器部署

#### 快速部署脚本
```bash
chmod +x deploy.sh
./deploy.sh
```

#### Docker 部署
```bash
docker-compose up -d
```

详细部署指南：
- 📖 [快速开始指南](./QUICKSTART.md) - 5分钟快速部署
- 📖 [完整部署文档](./DEPLOYMENT.md) - 详细的部署选项和配置

### 部署方式对比

1. **Vercel**（推荐用于快速上线）
   - ✅ 零配置，5分钟部署
   - ✅ 免费 HTTPS
   - ✅ 全球 CDN
   - ✅ 自动扩展

2. **PM2 部署**（推荐用于自有服务器）
   - 自动重启
   - 日志管理
   - 开机自启
   - 集群模式

3. **Docker 部署**（推荐用于容器化环境）
   - 环境隔离
   - 快速部署
   - 易于迁移

4. **systemd 部署**（Linux 系统服务）
   - 系统级服务
   - 开机自启
   - 日志集成

### 配置域名和 HTTPS

使用 Nginx 反向代理 + Let's Encrypt 免费证书：
```bash
# 安装 Certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com
```

详见 [nginx.conf.example](./nginx.conf.example)

### 安全建议

1. ✅ 修改默认管理员密码（使用 `.env` 文件）
2. ✅ 启用 HTTPS
3. ✅ 配置防火墙
4. ✅ 定期备份数据
5. ✅ 使用强密码
6. ✅ 限制管理员页面访问（IP 白名单）

## 项目文件说明

- `app.js` - 后端服务器主文件
- `index.html` - 首页
- `admin.html` - 管理员控制台
- `voter.html` - 投票页面
- `display.html` - 公开展示页面
- `style.css` - 样式文件
- `deploy.sh` - 一键部署脚本
- `ecosystem.config.js` - PM2 配置文件
- `docker-compose.yml` - Docker Compose 配置
- `Dockerfile` - Docker 镜像配置
- `nginx.conf.example` - Nginx 配置示例
- `.env.example` - 环境变量模板

## 扩展功能建议

- [ ] 数据库持久化（MongoDB/PostgreSQL）
- [x] PDF格式结果导出
- [x] 差额选举支持
- [ ] 地理围栏（GPS定位）
- [ ] 更复杂的投票条件判断
- [ ] 投票时间限制
- [ ] 多管理员支持
- [ ] 投票模板
- [ ] 数据分析仪表板

## 更新日志

### v1.1.0
- ✅ 新增差额选举功能
- ✅ 修复 PDF 导出问题
- ✅ 优化图表显示
- ✅ 添加部署脚本和文档

### v1.0.0
- ✅ 基础投票功能
- ✅ 单选/多选支持
- ✅ 实时统计
- ✅ 结果导出

## 许可证

MIT License
