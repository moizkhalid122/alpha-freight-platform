Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Get the directory where this script is located
scriptPath = fso.GetParentFolderName(WScript.ScriptFullName)
batFile = scriptPath & "\AUTO-START-SERVER.bat"

' Wait 15 seconds for system to fully boot
WScript.Sleep 15000

' Run the batch file in hidden window
WshShell.Run """" & batFile & """", 0, False

Set WshShell = Nothing
Set fso = Nothing
