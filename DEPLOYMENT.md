# 实时投票系统部署指南

本指南将帮助你将投票系统部署到服务器上。

## 部署方式选择

### 方式一：使用 PM2（推荐用于生产环境）
### 方式二：使用 systemd（Linux 系统服务）
### 方式三：使用 Docker（容器化部署）
### 方式四：使用云平台（如 Vercel、Railway、Render）

---

## 准备工作

### 1. 服务器要求
- 操作系统：Linux (Ubuntu/CentOS) 或 Windows Server
- Node.js 版本：14.x 或更高
- 内存：至少 512MB
- 端口：需要开放一个端口（默认 3000）

### 2. 安装 Node.js

**Ubuntu/Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**CentOS/RHEL:**
```bash
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

**验证安装:**
```bash
node --version
npm --version
```

---

## 方式一：使用 PM2 部署（推荐）

PM2 是一个生产级的 Node.js 进程管理器，支持自动重启、日志管理、负载均衡等功能。

### 1. 上传代码到服务器

```bash
# 在本地打包代码
tar -czf voting-system.tar.gz *.js *.html *.css *.json *.md

# 上传到服务器（替换为你的服务器地址）
scp voting-system.tar.gz user@your-server-ip:/home/user/

# 登录服务器
ssh user@your-server-ip

# 解压
cd /home/user/
tar -xzf voting-system.tar.gz
cd voting-system
```

### 2. 安装依赖

```bash
npm install
```

### 3. 安装 PM2

```bash
sudo npm install -g pm2
```

### 4. 配置环境变量（可选）

创建 `.env` 文件：
```bash
PORT=3000
ADMIN_PASSWORD=your_secure_password_here
NODE_ENV=production
```

修改 `app.js` 以支持环境变量：
```javascript
// 在 app.js 开头添加
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// 修改数据存储部分
const data = {
  adminPassword: ADMIN_PASSWORD,
  // ...
};
```

### 5. 启动应用

```bash
# 启动应用
pm2 start app.js --name voting-system

# 查看状态
pm2 status

# 查看日志
pm2 logs voting-system

# 设置开机自启
pm2 startup
pm2 save
```

### 6. PM2 常用命令

```bash
# 重启应用
pm2 restart voting-system

# 停止应用
pm2 stop voting-system

# 删除应用
pm2 delete voting-system

# 查看详细信息
pm2 show voting-system

# 监控
pm2 monit
```

---

## 方式二：使用 systemd（Linux 系统服务）

### 1. 创建服务文件

```bash
sudo nano /etc/systemd/system/voting-system.service
```

添加以下内容：
```ini
[Unit]
Description=Realtime Voting System
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/home/your-username/voting-system
ExecStart=/usr/bin/node app.js
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=voting-system
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

### 2. 启动服务

```bash
# 重载 systemd 配置
sudo systemctl daemon-reload

# 启动服务
sudo systemctl start voting-system

# 设置开机自启
sudo systemctl enable voting-system

# 查看状态
sudo systemctl status voting-system

# 查看日志
sudo journalctl -u voting-system -f
```

---

## 方式三：使用 Docker 部署

### 1. 创建 Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "app.js"]
```

### 2. 创建 .dockerignore

```
node_modules
npm-debug.log
.git
.gitignore
*.md
```

### 3. 创建 docker-compose.yml

```yaml
version: '3.8'

services:
  voting-system:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - ADMIN_PASSWORD=your_secure_password
    restart: unless-stopped
    volumes:
      - ./data:/app/data
```

### 4. 构建和运行

```bash
# 构建镜像
docker build -t voting-system .

# 运行容器
docker run -d -p 3000:3000 --name voting-system voting-system

# 或使用 docker-compose
docker-compose up -d

# 查看日志
docker logs -f voting-system

# 停止容器
docker stop voting-system

# 重启容器
docker restart voting-system
```

---

## 配置反向代理（Nginx）

如果你想使用域名访问，需要配置 Nginx 反向代理。

### 1. 安装 Nginx

```bash
# Ubuntu/Debian
sudo apt-get install nginx

# CentOS/RHEL
sudo yum install nginx
```

### 2. 配置 Nginx

创建配置文件：
```bash
sudo nano /etc/nginx/sites-available/voting-system
```

添加以下内容：
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket 支持
    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

### 3. 启用配置

```bash
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/voting-system /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### 4. 配置 HTTPS（使用 Let's Encrypt）

```bash
# 安装 Certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

---

## 配置防火墙

### Ubuntu (UFW)
```bash
sudo ufw allow 3000/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### CentOS (firewalld)
```bash
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

---

## 安全建议

### 1. 修改默认管理员密码

在 `app.js` 中修改：
```javascript
const data = {
  adminPassword: process.env.ADMIN_PASSWORD || 'your_strong_password_here',
  // ...
};
```

### 2. 使用环境变量

安装 dotenv：
```bash
npm install dotenv
```

创建 `.env` 文件（不要提交到 Git）：
```
PORT=3000
ADMIN_PASSWORD=your_secure_password
NODE_ENV=production
```

### 3. 限制访问

可以在 Nginx 中添加 IP 白名单：
```nginx
location /admin.html {
    allow 192.168.1.0/24;  # 允许的 IP 段
    deny all;
    proxy_pass http://localhost:3000;
}
```

### 4. 启用 HTTPS

使用 Let's Encrypt 免费证书（见上文）。

### 5. 定期备份

创建备份脚本：
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf /backup/voting-system-$DATE.tar.gz /home/user/voting-system
# 保留最近 7 天的备份
find /backup -name "voting-system-*.tar.gz" -mtime +7 -delete
```

---

## 监控和维护

### 1. 查看日志

**PM2:**
```bash
pm2 logs voting-system
```

**systemd:**
```bash
sudo journalctl -u voting-system -f
```

**Docker:**
```bash
docker logs -f voting-system
```

### 2. 监控资源使用

```bash
# 使用 htop
sudo apt-get install htop
htop

# 使用 PM2
pm2 monit
```

### 3. 自动重启

PM2 和 systemd 都支持自动重启失败的进程。

---

## 性能优化

### 1. 使用 Nginx 缓存静态文件

在 Nginx 配置中添加：
```nginx
location ~* \.(css|js|jpg|jpeg|png|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    proxy_pass http://localhost:3000;
}
```

### 2. 启用 Gzip 压缩

在 Nginx 配置中添加：
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

### 3. 使用 PM2 集群模式

```bash
pm2 start app.js -i max --name voting-system
```

---

## 故障排查

### 1. 应用无法启动

```bash
# 检查端口是否被占用
sudo netstat -tulpn | grep 3000

# 检查 Node.js 版本
node --version

# 检查依赖是否安装
npm list
```

### 2. WebSocket 连接失败

- 检查防火墙设置
- 检查 Nginx 配置中的 WebSocket 支持
- 查看浏览器控制台错误信息

### 3. 内存不足

```bash
# 查看内存使用
free -h

# 增加 swap 空间（临时方案）
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

## 快速部署脚本

创建 `deploy.sh`：
```bash
#!/bin/bash

echo "开始部署投票系统..."

# 安装依赖
npm install

# 安装 PM2
sudo npm install -g pm2

# 停止旧进程
pm2 stop voting-system 2>/dev/null || true

# 启动新进程
pm2 start app.js --name voting-system

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup

echo "部署完成！"
echo "访问地址: http://your-server-ip:3000"
```

使用方法：
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 访问应用

部署完成后，通过以下地址访问：

- 主页：`http://your-server-ip:3000` 或 `http://your-domain.com`
- 管理员：`http://your-server-ip:3000/admin.html`
- 投票页面：`http://your-server-ip:3000/voter.html`
- 结果展示：`http://your-server-ip:3000/display.html`

---

## 需要帮助？

如果遇到问题，请检查：
1. 日志文件
2. 防火墙设置
3. 端口是否开放
4. Node.js 版本是否正确
