@echo off
chcp 65001 >nul
echo Dang cai dat dich vu tu khoi chay ngam cho Phong Hoc Tin Hoc...
set "SCRIPT_DIR=%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut(\"$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\QuanLyPhongHoc_AutoStart.lnk\"); $Shortcut.TargetPath = 'powershell.exe'; $Shortcut.Arguments = '-WindowStyle Hidden -NoProfile -ExecutionPolicy Bypass -Command \"& ''C:\Program Files\nodejs\node.exe'' ''%SCRIPT_DIR%server.cjs''\"'; $Shortcut.WorkingDirectory = '%SCRIPT_DIR%..\..'; $Shortcut.Description = 'Quan Ly Phong Hoc Tin Hoc Auto-Start'; $Shortcut.Save();"
echo [OK] Da cai dat thanh cong! Ung dung se tu dong chay ngam moi khi may tinh duoc bat.
echo Vi tri: %APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\QuanLyPhongHoc_AutoStart.lnk
pause
