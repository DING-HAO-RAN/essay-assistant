@echo off
echo ========================================
echo   AI作文助手 - 启动脚本
echo ========================================
echo.

echo [1/3] 检查Python环境...
python --version >nul 2>&1
if errorlevel 1 (
    echo 错误：未找到Python，请先安装Python 3.8+
    pause
    exit /b 1
)
echo Python环境正常

echo.
echo [2/3] 安装依赖...
pip install -r requirements.txt -q

echo.
echo [3/3] 启动应用...
echo.
echo ========================================
echo   应用启动成功！
echo   请在浏览器中访问：http://localhost:5000
echo   按 Ctrl+C 停止应用
echo ========================================
echo.

python app.py
pause
