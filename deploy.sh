#!/bin/bash

# 投票系统快速部署脚本

set -e

echo "=========================================="
echo "  实时投票系统 - 自动部署脚本"
echo "=========================================="
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未检测到 Node.js"
    echo "请先安装 Node.js: https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js 版本: $(node --version)"
echo "✓ npm 版本: $(npm --version)"
echo ""

# 安装依赖
echo "📦 安装依赖..."
npm install
echo "✓ 依赖安装完成"
echo ""

# 检查是否安装了 PM2
if ! command -v pm2 &> /dev/null; then
    echo "📦 安装 PM2..."
    sudo npm install -g pm2
    echo "✓ PM2 安装完成"
else
    echo "✓ PM2 已安装: $(pm2 --version)"
fi
echo ""

# 停止旧进程
echo "🔄 停止旧进程..."
pm2 stop voting-system 2>/dev/null || echo "  (没有运行中的进程)"
pm2 delete voting-system 2>/dev/null || echo "  (没有需要删除的进程)"
echo ""

# 启动应用
echo "🚀 启动应用..."
pm2 start ecosystem.config.js
echo "✓ 应用启动成功"
echo ""

# 保存 PM2 配置
echo "💾 保存 PM2 配置..."
pm2 save
echo "✓ 配置已保存"
echo ""

# 设置开机自启
echo "⚙️  设置开机自启..."
pm2 startup | tail -n 1 | bash || echo "  (可能需要手动执行 pm2 startup 命令)"
echo ""

# 显示状态
echo "=========================================="
echo "  部署完成！"
echo "=========================================="
echo ""
pm2 status
echo ""
echo "📝 访问地址:"
echo "   主页: http://localhost:3000"
echo "   管理员: http://localhost:3000/admin.html"
echo "   投票页: http://localhost:3000/voter.html"
echo "   展示页: http://localhost:3000/display.html"
echo ""
echo "📋 常用命令:"
echo "   查看日志: pm2 logs voting-system"
echo "   重启应用: pm2 restart voting-system"
echo "   停止应用: pm2 stop voting-system"
echo "   查看状态: pm2 status"
echo ""
