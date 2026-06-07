@echo off
chcp 65001 >nul 2>&1
echo ========================================
echo   AI Zuo Wen Zhu Shou - Qi Dong Jiao Ben
echo ========================================
echo.

echo [1/3] Jian Cha Huan Jing...
where python >nul 2>&1
if errorlevel 1 (
    where python3 >nul 2>&1
    if errorlevel 1 (
        echo Cuo Wu: Wei Zhao Dao Python
        echo Qing Xian An Zhuang Python 3.8+
        pause
        exit /b 1
    )
    set PYTHON=python3
) else (
    set PYTHON=python
)

echo Python Huan Jing Zheng Chang
echo.
echo [2/3] An Zhuang Yi Lai...
%PYTHON% -m pip install -r requirements.txt -q

echo.
echo [3/3] Qi Dong Ying Yong...
echo.
echo ========================================
echo   Ying Yong Qi Dong Cheng Gong!
echo   Qing Zai Liu Lan Qi Zhong Fang Wen: http://localhost:5000
echo   An Ctrl+C Ting Zhi Ying Yong
echo ========================================
echo.

%PYTHON% app.py
pause
