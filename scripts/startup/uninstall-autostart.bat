@echo off
chcp 65001 >nul
echo Dang go bo dich vu tu khoi chay ngam...
set "STARTUP_SHORTCUT=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\QuanLyPhongHoc_AutoStart.lnk"
if exist "%STARTUP_SHORTCUT%" (
    del /f /q "%STARTUP_SHORTCUT%"
    echo [OK] Da go bo khoi dong cung Windows thanh cong.
) else (
    echo Khong tim thay loi tat khoi dong trong thu muc Startup.
)
pause
