@echo off
chcp 65001 >nul
echo ========================================================
echo   KIEM TRA TRANG THAI MAY CHU PHONG HOC TIN HOC
echo ========================================================
netstat -aon | findstr ":3000.*LISTENING" >nul
if %errorlevel% equ 0 (
    echo [DANG CHAY] May chu dang hoat dong tai:
    echo   - May cuc bo: http://localhost:3000
    echo.
    echo Dang mo trinh duyet...
    start http://localhost:3000
) else (
    echo [CHUA CHAY] May chu chua duoc khoi dong.
    echo Dang khoi dong may chu ngam...
    powershell.exe -WindowStyle Hidden -NoProfile -ExecutionPolicy Bypass -Command "& 'C:\Program Files\nodejs\node.exe' '%~dp0server.cjs'"
    timeout /t 2 >nul
    echo Da khoi dong thanh cong! Dang mo trinh duyet...
    start http://localhost:3000
)
pause
