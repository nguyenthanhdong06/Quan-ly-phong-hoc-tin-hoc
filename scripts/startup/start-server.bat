@echo off
set "PATH=C:\Program Files\nodejs;C:\Program Files\Git\cmd;%PATH%"
set "CI=true"
cd /d "%~dp0..\.."
"C:\Program Files\nodejs\node.exe" "%~dp0..\..\node_modules\vite\bin\vite.js" --port=3000 --host=0.0.0.0 > "%~dp0server.log" 2>&1
