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
    wscript "%~dp0start-silent.vbs"
    timeout /t 2 >nul
    echo Da gui lenh khoi chay!
)
pause
