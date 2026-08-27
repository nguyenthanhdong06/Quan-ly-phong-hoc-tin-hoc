@echo off
chcp 65001 >nul
echo Dang cai dat dich vu tu khoi chay ngam cho Phong Hoc Tin Hoc...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut(\"$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\QuanLyPhongHoc_AutoStart.lnk\"); $Shortcut.TargetPath = 'wscript.exe'; $Shortcut.Arguments = '\"%~dp0start-silent.vbs\"'; $Shortcut.WorkingDirectory = '%~dp0..\..'; $Shortcut.Description = 'Quan Ly Phong Hoc Tin Hoc Auto-Start'; $Shortcut.Save();"
echo [OK] Da cai dat thanh cong! Ung dung se tu dong chay ngam moi khi may tinh duoc bat.
echo Vi tri: %APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\QuanLyPhongHoc_AutoStart.lnk
pause
