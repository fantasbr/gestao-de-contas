@echo off
REM ============================================
REM Build Docker - Gestao Contas (Wrapper)
REM ============================================

echo Redirecionando para o script PowerShell...
powershell.exe -ExecutionPolicy Bypass -File build-docker.ps1
pause

