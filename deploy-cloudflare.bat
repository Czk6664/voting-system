@echo off
chcp 65001 >nul
cls
echo.
echo ========================================
echo   部署投票系统到 Cloudflare Pages
echo ========================================
echo.

set project_name=voting-system

echo [提示] 此项目是 Node.js 应用，不能直接部署到 Cloudflare Pages
echo [提示] Cloudflare Pages 只支持静态网站
echo.
echo 您有以下选择：
echo.
echo 1. 部署到 Cloudflare Workers（需要改造代码）
echo 2. 部署到其他支持 Node.js 的平台：
echo    - Vercel (推荐)
echo    - Railway
echo    - Render
echo    - Heroku
echo    - DigitalOcean App Platform
echo.
echo ========================================
echo   推荐方案：使用 Vercel 部署
echo ========================================
echo.
echo Vercel 完美支持 Node.js 应用，部署步骤：
echo.
echo 1. 安装 Vercel CLI:
echo    npm install -g vercel
echo.
echo 2. 登录 Vercel:
echo    vercel login
echo.
echo 3. 部署项目:
echo    vercel
echo.
echo 4. 生产部署:
echo    vercel --prod
echo.
echo ========================================
echo.
echo 按任意键查看详细说明...
pause >nul

echo.
echo ========================================
echo   Cloudflare Workers 改造说明
echo ========================================
echo.
echo 如果您坚持使用 Cloudflare，需要：
echo.
echo 1. 将 Express 改为 Cloudflare Workers API
echo 2. 将 WebSocket 改为 Durable Objects
echo 3. 将文件存储改为 KV 或 D1 数据库
echo 4. 重写所有路由处理逻辑
echo.
echo 这需要大量代码改造，建议使用 Vercel 等平台。
echo.
echo ========================================
echo.
echo 是否创建 Vercel 配置文件？(Y/N)
set /p choice=请选择: 

if /i "%choice%"=="Y" (
    echo.
    echo 正在创建 vercel.json...
    echo {> vercel.json
    echo   "version": 2,>> vercel.json
    echo   "builds": [>> vercel.json
    echo     {>> vercel.json
    echo       "src": "app.js",>> vercel.json
    echo       "use": "@vercel/node">> vercel.json
    echo     }>> vercel.json
    echo   ],>> vercel.json
    echo   "routes": [>> vercel.json
    echo     {>> vercel.json
    echo       "src": "/(.*)",>> vercel.json
    echo       "dest": "app.js">> vercel.json
    echo     }>> vercel.json
    echo   ]>> vercel.json
    echo }>> vercel.json
    echo.
    echo ✓ vercel.json 已创建
    echo.
    echo 下一步：
    echo 1. 运行: npm install -g vercel
    echo 2. 运行: vercel login
    echo 3. 运行: vercel
    echo.
) else (
    echo.
    echo 已取消
    echo.
)

echo 按任意键退出...
pause >nul
