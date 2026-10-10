@echo off
echo ========================================
echo AI心理健康卫士 - 启动脚本
echo ========================================
echo.

echo 正在启动后端服务器...
cd /d "%~dp0backend"
start "后端服务器" cmd /k "npm run dev"

echo 正在启动前端服务器...
cd /d "%~dp0frontend"
start "前端服务器" cmd /k "npm run dev"

echo.
echo ========================================
echo 服务器启动完成！
echo 前端地址: http://localhost:5173
echo 后端地址: http://localhost:8080
echo ========================================
echo.
pause
