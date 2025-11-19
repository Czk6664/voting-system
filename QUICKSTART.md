# 快速开始指南

## 本地开发

### 1. 安装依赖
```bash
npm install
```

### 2. 启动应用
```bash
npm start
```

### 3. 访问应用
- 主页：http://localhost:3000
- 管理员：http://localhost:3000/admin.html（密码：admin123）
- 投票页：http://localhost:3000/voter.html
- 展示页：http://localhost:3000/display.html

---

## 服务器部署（三种方式）

### 方式一：一键部署（推荐）

```bash
# 1. 上传代码到服务器
scp -r ./* user@your-server:/path/to/app/

# 2. 登录服务器
ssh user@your-server

# 3. 进入目录
cd /path/to/app/

# 4. 运行部署脚本
chmod +x deploy.sh
./deploy.sh
```

完成！应用将自动启动并设置为开机自启。

---

### 方式二：Docker 部署

```bash
# 1. 构建并启动
docker-compose up -d

# 2. 查看日志
docker-compose logs -f

# 3. 停止
docker-compose down
```

---

### 方式三：手动部署

```bash
# 1. 安装依赖
npm install

# 2. 安装 PM2
sudo npm install -g pm2

# 3. 启动应用
pm2 start ecosystem.config.js

# 4. 保存配置
pm2 save

# 5. 设置开机自启
pm2 startup
```

---

## 配置域名（可选）

### 1. 安装 Nginx
```bash
sudo apt-get install nginx
```

### 2. 配置 Nginx
```bash
# 复制配置文件
sudo cp nginx.conf.example /etc/nginx/sites-available/voting-system

# 修改域名
sudo nano /etc/nginx/sites-available/voting-system
# 将 your-domain.com 改为你的域名

# 启用配置
sudo ln -s /etc/nginx/sites-available/voting-system /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### 3. 配置 HTTPS（免费证书）
```bash
# 安装 Certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

---

## 修改管理员密码

### 方法一：使用环境变量（推荐）

1. 复制环境变量模板：
```bash
cp .env.example .env
```

2. 编辑 `.env` 文件：
```bash
nano .env
```

3. 修改密码：
```
ADMIN_PASSWORD=your_strong_password_here
```

4. 重启应用：
```bash
pm2 restart voting-system
```

### 方法二：直接修改代码

编辑 `app.js`，找到：
```javascript
const data = {
  adminPassword: 'admin123',
  // ...
};
```

改为：
```javascript
const data = {
  adminPassword: 'your_strong_password_here',
  // ...
};
```

---

## 常用命令

### PM2 命令
```bash
pm2 status              # 查看状态
pm2 logs voting-system  # 查看日志
pm2 restart voting-system  # 重启
pm2 stop voting-system  # 停止
pm2 monit              # 监控
```

### Docker 命令
```bash
docker-compose ps       # 查看状态
docker-compose logs -f  # 查看日志
docker-compose restart  # 重启
docker-compose down     # 停止
```

### Nginx 命令
```bash
sudo nginx -t           # 测试配置
sudo systemctl restart nginx  # 重启
sudo systemctl status nginx   # 查看状态
```

---

## 故障排查

### 应用无法启动
```bash
# 检查端口占用
sudo netstat -tulpn | grep 3000

# 查看日志
pm2 logs voting-system
```

### 无法访问
1. 检查防火墙：`sudo ufw status`
2. 检查端口是否开放：`sudo ufw allow 3000`
3. 检查应用是否运行：`pm2 status`

### WebSocket 连接失败
1. 检查 Nginx 配置中的 WebSocket 支持
2. 查看浏览器控制台错误
3. 检查防火墙设置

---

## 性能优化建议

1. **使用 PM2 集群模式**（多核 CPU）：
```bash
pm2 start app.js -i max --name voting-system
```

2. **启用 Nginx 缓存**（见 nginx.conf.example）

3. **使用 CDN** 加速静态资源

4. **定期清理日志**：
```bash
pm2 flush  # 清空日志
```

---

## 安全建议

1. ✅ 修改默认管理员密码
2. ✅ 使用 HTTPS（Let's Encrypt 免费证书）
3. ✅ 配置防火墙，只开放必要端口
4. ✅ 定期更新依赖：`npm update`
5. ✅ 定期备份数据
6. ✅ 限制管理员页面访问（IP 白名单）

---

## 需要帮助？

详细部署指南请查看：[DEPLOYMENT.md](./DEPLOYMENT.md)

常见问题：
- 端口被占用：修改 `.env` 中的 `PORT`
- 内存不足：使用 Docker 限制内存或增加 swap
- 性能问题：启用 PM2 集群模式
