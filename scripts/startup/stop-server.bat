@echo off
chcp 65001 >nul
echo Dang tim va tat cac tien trinh chay tren cong 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000.*LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
echo Da tat may chu phong hoc tin hoc thanh cong!
timeout /t 3 >nul
