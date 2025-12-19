#!/bin/bash

echo "🚀 Setting up Planner Winter Mobile App..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Install npm dependencies
echo ""
echo "📦 Installing npm dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"
echo ""

# Initialize Capacitor
echo "📱 Initializing Capacitor..."
npx cap init "Planner Winter" "com.plannerwinter.app" --web-dir="."

if [ $? -ne 0 ]; then
    echo "⚠️  Capacitor may already be initialized, continuing..."
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update API URL in js/api.js (set your production backend URL)"
echo "2. Add iOS platform: npm run cap:add:ios"
echo "3. Add Android platform: npm run cap:add:android"
echo "4. See MOBILE_SETUP.md for detailed instructions"
echo ""



