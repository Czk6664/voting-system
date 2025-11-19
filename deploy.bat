@echo off
REM 投票系统 Windows 部署脚本

echo ==========================================
echo   实时投票系统 - Windows 自动部署脚本
echo ==========================================
echo.

REM 检查 Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [错误] 未检测到 Node.js
    echo 请先安装 Node.js: https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js 版本:
node --version
echo [OK] npm 版本:
npm --version
echo.

REM 安装依赖
echo [步骤 1/4] 安装依赖...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [错误] 依赖安装失败
    pause
    exit /b 1
)
echo [OK] 依赖安装完成
echo.

REM 检查 PM2
where pm2 >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [步骤 2/4] 安装 PM2...
    call npm install -g pm2
    if %ERRORLEVEL% NEQ 0 (
        echo [错误] PM2 安装失败
        pause
        exit /b 1
    )
    echo [OK] PM2 安装完成
) else (
    echo [步骤 2/4] PM2 已安装
)
echo.

REM 停止旧进程
echo [步骤 3/4] 停止旧进程...
call pm2 stop voting-system 2>nul
call pm2 delete voting-system 2>nul
echo [OK] 旧进程已清理
echo.

REM 启动应用
echo [步骤 4/4] 启动应用...
call pm2 start ecosystem.config.js
if %ERRORLEVEL% NEQ 0 (
    echo [错误] 应用启动失败
    pause
    exit /b 1
)
echo [OK] 应用启动成功
echo.

REM 保存配置
echo 保存 PM2 配置...
call pm2 save
echo [OK] 配置已保存
echo.

REM 显示状态
echo ==========================================
echo   部署完成！
echo ==========================================
echo.
call pm2 status
echo.
echo 访问地址:
echo   主页: http://localhost:3000
echo   管理员: http://localhost:3000/admin.html
echo   投票页: http://localhost:3000/voter.html
echo   展示页: http://localhost:3000/display.html
echo.
echo 常用命令:
echo   查看日志: pm2 logs voting-system
echo   重启应用: pm2 restart voting-system
echo   停止应用: pm2 stop voting-system
echo   查看状态: pm2 status
echo.
pause
