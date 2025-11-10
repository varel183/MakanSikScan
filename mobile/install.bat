@echo off
echo 🍽️ MakanSikScan Mobile - Quick Setup
echo ====================================
echo.

if not exist "package.json" (
    echo ❌ Please run this script from the mobile directory
    echo    cd mobile
    echo    install.bat
    exit /b 1
)

echo 📦 Installing dependencies...
call npm install --legacy-peer-deps

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install dependencies
    exit /b 1
)

echo.
echo ✅ Installation complete!
echo.
echo 🚀 Next steps:
echo.
echo 1. Configure API URL:
echo    Edit src\constants\index.ts
echo    Change BASE_URL to your backend IP
echo    Example: http://192.168.1.100:8080/api/v1
echo.
echo 2. Find your IP address:
echo    Run: ipconfig
echo    Look for IPv4 Address
echo.
echo 3. Start backend:
echo    cd ..\backend
echo    api.exe
echo.
echo 4. Start mobile app:
echo    npm start
echo.
echo 5. Scan QR code with Expo Go app on your phone
echo.
echo 📱 Happy coding!
pause
