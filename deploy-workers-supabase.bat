@echo off
chcp 65001 >nul
cls
echo.
echo ========================================
echo   部署到 Cloudflare Workers + Supabase
echo ========================================
echo.

echo [提示] 请确保已完成以下准备工作:
echo   1. 创建 Supabase 项目
echo   2. 运行 supabase-schema.sql 创建表
echo   3. 获取 SUPABASE_URL 和 SUPABASE_ANON_KEY
echo.
pause

echo.
echo [1/6] 检查 Wrangler CLI...
where wrangler >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ 未安装 Wrangler CLI
    echo.
    echo 正在安装...
    npm install -g wrangler
    
    if %errorlevel% neq 0 (
        echo.
        echo ✗ 安装失败！
        pause
        exit /b 1
    )
    
    echo ✓ 安装成功
    echo.
)

echo ✓ Wrangler CLI 已安装
echo.

echo [2/6] 安装依赖...
echo.
copy package-workers.json package.json
npm install
echo.

echo [3/6] 创建 KV 命名空间...
echo.
echo 创建静态资源命名空间...
wrangler kv:namespace create "STATIC_ASSETS" --config wrangler-supabase.toml
echo.
echo ⚠️  请复制上面的 id，更新 wrangler-supabase.toml 中的 id = "placeholder"
echo.
pause

echo [4/6] 上传静态文件...
echo.
wrangler kv:key put --binding=STATIC_ASSETS "index.html" --path=index.html --config wrangler-supabase.toml
wrangler kv:key put --binding=STATIC_ASSETS "admin.html" --path=admin.html --config wrangler-supabase.toml
wrangler kv:key put --binding=STATIC_ASSETS "voter.html" --path=voter.html --config wrangler-supabase.toml
wrangler kv:key put --binding=STATIC_ASSETS "display.html" --path=display.html --config wrangler-supabase.toml
wrangler kv:key put --binding=STATIC_ASSETS "style.css" --path=style.css --config wrangler-supabase.toml
echo.

echo [5/6] 设置 Supabase 配置...
echo.
echo 请输入你的 Supabase URL:
set /p SUPABASE_URL=
wrangler secret put SUPABASE_URL --config wrangler-supabase.toml
echo %SUPABASE_URL% | wrangler secret put SUPABASE_URL --config wrangler-supabase.toml

echo.
echo 请输入你的 Supabase Anon Key:
set /p SUPABASE_KEY=
echo %SUPABASE_KEY% | wrangler secret put SUPABASE_ANON_KEY --config wrangler-supabase.toml

echo.
echo 请输入管理员密码（留空使用默认 admin123）:
set /p ADMIN_PASS=
if not "%ADMIN_PASS%"=="" (
    echo %ADMIN_PASS% | wrangler secret put ADMIN_PASSWORD --config wrangler-supabase.toml
)

echo.
echo [6/6] 部署 Worker...
echo.
wrangler deploy --config wrangler-supabase.toml

if %errorlevel% neq 0 (
    echo.
    echo ========================================
    echo [ERROR] 部署失败!
    echo ========================================
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   SUCCESS!
echo ========================================
echo.
echo 你的投票系统已上线！
echo.
echo 访问地址: https://voting-system.你的账号.workers.dev
echo.
echo ========================================
echo.
echo 下一步:
echo.
echo 1. 访问网址测试功能
echo 2. 查看日志: wrangler tail --config wrangler-supabase.toml
echo 3. 更新代码后重新部署: wrangler deploy --config wrangler-supabase.toml
echo.
pause
