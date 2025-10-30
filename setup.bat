@echo off
chcp 65001 >nul
echo ==================================================
echo 🎵 YTM Remote Server - Setup
echo ==================================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js ist nicht installiert!
    echo Bitte installiere Node.js von https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✓ Node.js gefunden: %NODE_VERSION%
echo.

REM Install dependencies
echo 📦 Installiere Dependencies...
call npm install

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ==================================================
    echo ✅ Setup erfolgreich abgeschlossen!
    echo ==================================================
    echo.
    echo Starte den Server mit:
    echo   npm start
    echo.
    echo Öffne dann im Browser:
    echo   http://localhost:3000
    echo.
    echo ⚠️  WICHTIG:
    echo 1. Starte zuerst YouTube Music Desktop App
    echo 2. Aktiviere Remote Control in den Einstellungen
    echo 3. Akzeptiere die Authentifizierungsanfrage!
    echo.
) else (
    echo.
    echo ❌ Installation fehlgeschlagen!
    echo Bitte prüfe die Fehlermeldungen oben.
)

pause
