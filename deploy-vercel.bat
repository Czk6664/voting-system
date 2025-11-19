@echo off
chcp 65001 >nul
cls
echo.
echo ========================================
echo   部署投票系统到 Vercel
echo ========================================
echo.

set project_name=voting-system

echo [1/4] 检查 Vercel CLI...
where vercel >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ✗ 未安装 Vercel CLI
    echo.
    echo 正在安装 Vercel CLI...
    echo.
    npm install -g vercel
    
    if %errorlevel% neq 0 (
        echo.
        echo ✗ 安装失败！
        echo.
        echo 请手动运行: npm install -g vercel
        echo.
        pause
        exit /b 1
    )
    
    echo.
    echo ✓ Vercel CLI 安装成功
    echo.
) else (
    echo ✓ Vercel CLI 已安装
    echo.
)

echo [2/4] 检查登录状态...
vercel whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo 需要登录 Vercel...
    echo.
    echo 按任意键打开浏览器登录...
    pause >nul
    vercel login
    
    if %errorlevel% neq 0 (
        echo.
        echo ✗ 登录失败！
        echo.
        pause
        exit /b 1
    )
    
    echo.
    echo ✓ 登录成功
    echo.
) else (
    echo ✓ 已登录
    echo.
)

echo [3/4] 部署项目...
echo.
echo 项目: %project_name%
echo 目录: %cd%
echo.

vercel --yes

if %errorlevel% neq 0 (
    echo.
    echo ========================================
    echo [ERROR] 部署失败!
    echo ========================================
    echo.
    echo 可能的原因:
    echo 1. 网络连接问题
    echo 2. 项目配置错误
    echo 3. Vercel API 错误
    echo.
    echo 解决方案:
    echo 1. 检查网络连接
    echo 2. 查看错误信息
    echo 3. 稍后重试
    echo.
    pause
    exit /b 1
)

echo.
echo [4/4] 部署完成！
echo.
echo ========================================
echo   SUCCESS!
echo ========================================
echo.
echo 你的投票系统已上线！
echo.
echo 预览地址将在上方显示
echo.
echo ========================================
echo.
echo 下一步:
echo.
echo 1. 访问预览地址测试功能
echo 2. 设置环境变量（重要！）:
echo    vercel env add ADMIN_PASSWORD
echo.
echo 3. 生产部署:
echo    vercel --prod
echo.
echo 4. 自定义域名:
echo    访问 Vercel 控制台设置
echo.
echo ========================================
echo.
echo 提示:
echo - 首次部署是预览版本
echo - 使用 vercel --prod 部署到生产环境
echo - 修改代码后重新运行此脚本更新
echo.
pause
