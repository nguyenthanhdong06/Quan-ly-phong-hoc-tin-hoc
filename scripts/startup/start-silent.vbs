Set FSO = CreateObject("Scripting.FileSystemObject")
strDir = FSO.GetParentFolderName(WScript.ScriptFullName)
strBat = FSO.BuildPath(strDir, "start-server.bat")
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd.exe /c """ & strBat & """", 0, False
Set WshShell = Nothing
Set FSO = Nothing
