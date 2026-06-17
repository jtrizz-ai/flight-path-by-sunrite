#!/bin/bash

# Flight Path Worker Test Script
# This script tests the worker setup and configuration

echo "🧪 Flight Path Worker Test Suite"
echo "================================"

# Check if .env exists
if [ ! -f .env ]; then
  echo "❌ Error: .env file not found"
  echo "Please run: cp .env.example .env"
  echo "Then fill in your credentials"
  exit 1
fi

echo "✅ .env file found"

# Load environment variables
export $(cat .env | xargs)

# Check required variables
check_var() {
  if [ -z "${!1}" ]; then
    echo "❌ Error: $1 is not set in .env"
    exit 1
  else
    echo "✅ $1 is configured"
  fi
}

check_var "NOTION_API_KEY"
check_var "NOTION_ROOT_PAGE_ID"
check_var "SUPABASE_URL"
check_var "SUPABASE_SERVICE_KEY"

# Test Node.js installation
echo "📦 Checking Node.js installation..."
if command -v node &> /dev/null; then
  NODE_VERSION=$(node --version)
  echo "✅ Node.js installed: $NODE_VERSION"
else
  echo "❌ Node.js not found"
  exit 1
fi

# Test npm installation
echo "📦 Checking npm installation..."
if command -v npm &> /dev/null; then
  NPM_VERSION=$(npm --version)
  echo "✅ npm installed: $NPM_VERSION"
else
  echo "❌ npm not found"
  exit 1
fi

# Check if dependencies are installed
echo "📦 Checking dependencies..."
if [ -d "node_modules" ]; then
  echo "✅ Dependencies installed"
else
  echo "⚠️  Dependencies not found. Installing..."
  npm install
fi

# Test TypeScript compilation
echo "🔨 Testing TypeScript compilation..."
if npm run build; then
  echo "✅ TypeScript compilation successful"
else
  echo "❌ TypeScript compilation failed"
  exit 1
fi

echo ""
echo "🎉 All tests passed!"
echo ""
echo "📝 Next steps:"
echo "1. Make sure your Notion integration is added to your root page"
echo "2. Set up your Supabase database by running the schema"
echo "3. Test the worker: npm run dev"
echo ""
echo "🚀 To start the worker in development mode:"
echo "   npm run dev"
echo ""
echo "🎯 To run a single manual crawl:"
echo "   WORKER_MODE=manual npm start"
