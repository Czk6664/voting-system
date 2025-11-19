# Vercel 命令行部署 - 详细步骤

## 📋 部署步骤

### 第一步：安装 Vercel CLI

打开命令行（PowerShell 或 CMD），运行：

```bash
npm install -g vercel
```

**预计时间**: 1-2 分钟

**可能遇到的问题**:
- 如果提示权限错误，以管理员身份运行命令行
- 如果下载慢，可以使用淘宝镜像：
  ```bash
  npm config set registry https://registry.npmmirror.com
  npm install -g vercel
  ```

---

### 第二步：登录 Vercel

```bash
vercel login
```

这会：
1. 打开浏览器
2. 要求你登录 Vercel 账号（可以用 GitHub/GitLab/Email）
3. 授权后自动返回命令行

**如果没有账号**:
- 访问 https://vercel.com/signup
- 使用 GitHub 账号注册（推荐）

---

### 第三步：进入项目目录

```bash
cd d:\CascadeProjects\anonymous-voting-system
```

---

### 第四步：部署项目

```bash
vercel
```

**首次部署会询问**:

1. **Set up and deploy "..."?** 
   → 输入 `Y` (Yes)

2. **Which scope do you want to deploy to?**
   → 选择你的账号（通常是默认选项，直接回车）

3. **Link to existing project?**
   → 输入 `N` (No，创建新项目)

4. **What's your project's name?**
   → 输入项目名称，如 `voting-system`（或直接回车使用默认名称）

5. **In which directory is your code located?**
   → 直接回车（使用当前目录 `./`）

**部署过程**:
- 上传文件
- 构建项目
- 部署到 Vercel

**预计时间**: 1-3 分钟

---

### 第五步：查看部署结果

部署成功后会显示：

```
✅  Production: https://voting-system-xxx.vercel.app [copied to clipboard]
```

这是你的**预览地址**，可以立即访问测试。

---

### 第六步：设置环境变量（重要！）

```bash
vercel env add ADMIN_PASSWORD
```

**操作步骤**:
1. 运行上述命令
2. 选择环境: `Production` (生产环境)
3. 输入你的安全密码（不要使用 admin123）
4. 确认

**示例**:
```
? What's the value of ADMIN_PASSWORD? MySecurePassword2025!
? Add ADMIN_PASSWORD to which Environments? Production
✅ Added Environment Variable ADMIN_PASSWORD to Project voting-system
```

---

### 第七步：生产部署

```bash
vercel --prod
```

这会将项目部署到生产环境，使用刚才设置的环境变量。

**预计时间**: 1-2 分钟

---

### 第八步：访问你的网站

部署完成后，访问显示的网址：

```
https://voting-system-xxx.vercel.app
```

**测试功能**:
1. 点击"管理员"
2. 使用你设置的密码登录
3. 创建一个测试投票
4. 测试投票功能

---

## 🔄 更新网站

修改代码后，重新部署：

```bash
# 预览部署（测试用）
vercel

# 生产部署（正式上线）
vercel --prod
```

---

## 📝 完整命令清单

```bash
# 1. 安装 CLI
npm install -g vercel

# 2. 登录
vercel login

# 3. 进入项目
cd d:\CascadeProjects\anonymous-voting-system

# 4. 首次部署
vercel

# 5. 设置密码
vercel env add ADMIN_PASSWORD

# 6. 生产部署
vercel --prod

# 7. 查看项目列表
vercel ls

# 8. 查看日志
vercel logs

# 9. 查看当前登录用户
vercel whoami
```

---

## 🎯 快速部署（一键复制）

如果你已经安装并登录，只需运行：

```bash
cd d:\CascadeProjects\anonymous-voting-system && vercel
```

---

## ⚙️ 高级配置

### 查看所有环境变量
```bash
vercel env ls
```

### 删除环境变量
```bash
vercel env rm ADMIN_PASSWORD
```

### 查看项目信息
```bash
vercel inspect
```

### 查看域名
```bash
vercel domains ls
```

### 绑定自定义域名
```bash
vercel domains add yourdomain.com
```

---

## 🆘 常见问题

### Q1: 提示 "vercel: command not found"
**解决方案**:
```bash
# 重新安装
npm install -g vercel

# 或检查 npm 全局路径
npm config get prefix

# Windows 添加到环境变量
# 路径通常是: C:\Users\你的用户名\AppData\Roaming\npm
```

### Q2: 登录失败
**解决方案**:
```bash
# 清除缓存重新登录
vercel logout
vercel login
```

### Q3: 部署失败
**解决方案**:
```bash
# 查看详细错误
vercel --debug

# 检查 vercel.json 配置
# 确保文件格式正确
```

### Q4: 网站打不开
**解决方案**:
1. 等待 1-2 分钟（DNS 传播）
2. 清除浏览器缓存
3. 使用无痕模式访问
4. 检查 Vercel 控制台是否有错误

### Q5: 环境变量不生效
**解决方案**:
```bash
# 重新部署
vercel --prod

# 或在 Vercel 控制台手动添加
# https://vercel.com/dashboard
```

---

## 📊 部署状态检查

### 检查部署是否成功
```bash
vercel ls
```

输出示例：
```
voting-system
  Production: https://voting-system.vercel.app
  Latest Deployment: https://voting-system-abc123.vercel.app
```

### 查看实时日志
```bash
vercel logs --follow
```

---

## 🎓 提示和技巧

### 1. 使用别名
```bash
# 设置别名，方便使用
vercel alias set voting-system-abc123.vercel.app my-voting.vercel.app
```

### 2. 自动部署
将项目推送到 GitHub，Vercel 会自动部署：
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/你的用户名/voting-system.git
git push -u origin main
```

然后在 Vercel 控制台连接 GitHub 仓库。

### 3. 团队协作
```bash
# 邀请团队成员
vercel teams add member@email.com
```

---

## 🔗 相关链接

- **Vercel 官网**: https://vercel.com
- **Vercel 文档**: https://vercel.com/docs
- **Vercel CLI 文档**: https://vercel.com/docs/cli
- **Vercel 控制台**: https://vercel.com/dashboard

---

## ✅ 部署检查清单

- [ ] 安装 Vercel CLI
- [ ] 登录 Vercel 账号
- [ ] 进入项目目录
- [ ] 运行 `vercel` 首次部署
- [ ] 设置 `ADMIN_PASSWORD` 环境变量
- [ ] 运行 `vercel --prod` 生产部署
- [ ] 访问网站测试功能
- [ ] 修改默认管理员密码
- [ ] （可选）绑定自定义域名
- [ ] （可选）连接 GitHub 自动部署

---

**创建时间**: 2025-11-19  
**预计总时间**: 10-15 分钟  
**难度**: ⭐ (非常简单)

---

## 🚀 立即开始

打开命令行，复制粘贴以下命令：

```bash
npm install -g vercel && vercel login
```

然后按照提示操作即可！
