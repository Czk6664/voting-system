# 部署检查清单

在部署到生产环境之前，请确保完成以下检查项。

## 部署前检查

### 1. 环境准备
- [ ] 服务器已安装 Node.js (v14+)
- [ ] 服务器已安装 npm
- [ ] 服务器有足够的内存（至少 512MB）
- [ ] 服务器端口 3000 可用（或已修改为其他端口）
- [ ] 防火墙已配置，允许必要端口访问

### 2. 代码准备
- [ ] 已修改默认管理员密码
- [ ] 已创建 `.env` 文件（从 `.env.example` 复制）
- [ ] 已配置环境变量（PORT, ADMIN_PASSWORD）
- [ ] 已测试本地运行正常

### 3. 安全配置
- [ ] 管理员密码使用强密码（至少12位，包含大小写字母、数字、特殊字符）
- [ ] `.env` 文件已添加到 `.gitignore`
- [ ] 敏感信息不在代码中硬编码

## 部署步骤

### 方式一：使用部署脚本
- [ ] 上传代码到服务器
- [ ] 运行 `chmod +x deploy.sh`
- [ ] 运行 `./deploy.sh`
- [ ] 检查应用是否正常启动：`pm2 status`

### 方式二：使用 Docker
- [ ] 上传代码到服务器
- [ ] 运行 `docker-compose up -d`
- [ ] 检查容器状态：`docker-compose ps`
- [ ] 查看日志：`docker-compose logs -f`

### 方式三：手动部署
- [ ] 运行 `npm install`
- [ ] 安装 PM2：`sudo npm install -g pm2`
- [ ] 启动应用：`pm2 start ecosystem.config.js`
- [ ] 保存配置：`pm2 save`
- [ ] 设置开机自启：`pm2 startup`

## 部署后检查

### 1. 应用状态
- [ ] 应用正常运行（PM2: `pm2 status` / Docker: `docker-compose ps`）
- [ ] 无错误日志（PM2: `pm2 logs` / Docker: `docker-compose logs`）
- [ ] 进程自动重启功能正常

### 2. 功能测试
- [ ] 可以访问主页：`http://your-server:3000`
- [ ] 管理员登录正常
- [ ] 可以创建投票
- [ ] 可以开始投票
- [ ] 投票码验证正常
- [ ] 可以提交投票
- [ ] 实时统计正常（WebSocket 连接成功）
- [ ] 可以结束投票
- [ ] 可以导出 PDF
- [ ] 可以导出 JSON
- [ ] 图表显示正常
- [ ] 公开展示页面正常

### 3. 性能测试
- [ ] 页面加载速度正常（< 3秒）
- [ ] WebSocket 连接稳定
- [ ] 多人同时投票正常
- [ ] 内存使用正常（< 200MB）
- [ ] CPU 使用正常（< 50%）

### 4. 安全检查
- [ ] 管理员密码已修改
- [ ] 无法通过默认密码登录
- [ ] 防火墙规则正确
- [ ] 只开放必要端口（80, 443, 3000）
- [ ] 敏感文件权限正确（.env 文件 600）

## 可选配置

### 1. 域名和 HTTPS
- [ ] 域名 DNS 已解析到服务器 IP
- [ ] Nginx 已安装
- [ ] Nginx 配置文件已创建
- [ ] Nginx 配置已测试：`sudo nginx -t`
- [ ] Nginx 已重启：`sudo systemctl restart nginx`
- [ ] Let's Encrypt 证书已获取
- [ ] HTTPS 访问正常
- [ ] HTTP 自动重定向到 HTTPS

### 2. 监控和日志
- [ ] 日志目录已创建：`mkdir -p logs`
- [ ] 日志轮转已配置
- [ ] 监控工具已安装（可选：Grafana, Prometheus）
- [ ] 告警规则已配置（可选）

### 3. 备份
- [ ] 备份脚本已创建
- [ ] 备份定时任务已配置（cron）
- [ ] 备份存储位置已确定
- [ ] 备份恢复流程已测试

### 4. 性能优化
- [ ] Nginx Gzip 压缩已启用
- [ ] 静态文件缓存已配置
- [ ] PM2 集群模式已启用（多核 CPU）
- [ ] 数据库连接池已优化（如使用数据库）

## 维护计划

### 日常维护
- [ ] 每天检查应用状态
- [ ] 每天检查日志文件
- [ ] 每周检查磁盘空间
- [ ] 每周清理旧日志

### 定期维护
- [ ] 每月更新依赖：`npm update`
- [ ] 每月检查安全漏洞：`npm audit`
- [ ] 每季度更新 Node.js 版本
- [ ] 每季度审查安全配置

### 应急预案
- [ ] 已准备回滚方案
- [ ] 已准备备份恢复流程
- [ ] 已准备故障排查文档
- [ ] 已准备联系人列表

## 常见问题排查

### 应用无法启动
1. 检查端口是否被占用：`sudo netstat -tulpn | grep 3000`
2. 检查 Node.js 版本：`node --version`
3. 检查依赖是否安装：`npm list`
4. 查看错误日志：`pm2 logs voting-system --err`

### WebSocket 连接失败
1. 检查防火墙设置
2. 检查 Nginx 配置中的 WebSocket 支持
3. 查看浏览器控制台错误
4. 检查服务器日志

### 性能问题
1. 检查内存使用：`free -h`
2. 检查 CPU 使用：`top`
3. 检查进程状态：`pm2 monit`
4. 考虑启用集群模式

### 无法访问
1. 检查防火墙：`sudo ufw status`
2. 检查端口开放：`sudo ufw allow 3000`
3. 检查应用运行：`pm2 status`
4. 检查 Nginx 状态：`sudo systemctl status nginx`

## 部署完成

恭喜！如果所有检查项都已完成，你的投票系统已成功部署。

**访问地址：**
- 主页：http://your-domain.com
- 管理员：http://your-domain.com/admin.html
- 投票页：http://your-domain.com/voter.html
- 展示页：http://your-domain.com/display.html

**下一步：**
1. 通知用户访问地址
2. 提供管理员密码（安全方式）
3. 开始使用系统
4. 定期检查和维护

---

**需要帮助？**
- 查看 [QUICKSTART.md](./QUICKSTART.md)
- 查看 [DEPLOYMENT.md](./DEPLOYMENT.md)
- 查看应用日志
