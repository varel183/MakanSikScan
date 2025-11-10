#!/bin/bash

echo "🍽️ MakanSikScan Mobile - Quick Setup"
echo "===================================="
echo ""

# Check if in mobile directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the mobile directory"
    echo "   cd mobile && bash install.sh"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "✅ Installation complete!"
echo ""
echo "🚀 Next steps:"
echo ""
echo "1. Configure API URL:"
echo "   Edit src/constants/index.ts"
echo "   Change BASE_URL to your backend IP"
echo "   Example: http://192.168.1.100:8080/api/v1"
echo ""
echo "2. Start backend:"
echo "   cd ../backend && ./api.exe"
echo ""
echo "3. Start mobile app:"
echo "   npm start"
echo ""
echo "4. Scan QR code with Expo Go app on your phone"
echo ""
echo "📱 Happy coding!"
