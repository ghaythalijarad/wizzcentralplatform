#!/bin/bash

# WizzCentral Platform - Development Startup Script
echo "🚀 Starting WizzCentral Platform Development Environment..."
echo "════════════════════════════════════════════════════════"

# Kill existing Node.js processes
echo "🔄 Cleaning up existing processes..."
pkill -f "node.*wizzcentralplatform" 2>/dev/null || true
pkill -f "local-dev-server" 2>/dev/null || true

# Kill processes on common development ports
echo "🔄 Freeing up ports..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# Navigate to project directory
cd /Users/ghaythallaheebi/wizzcentralplatform

# Check AWS profile
echo "🔍 Checking AWS configuration..."
if aws sts get-caller-identity --profile wizz-drivers-ghayth-dev > /dev/null 2>&1; then
    echo "✅ AWS profile 'wizz-drivers-ghayth-dev' is connected"
    export AWS_PROFILE=wizz-drivers-ghayth-dev
else
    echo "⚠️  AWS profile not connected. Running: aws sso login --profile wizz-drivers-ghayth-dev"
    aws sso login --profile wizz-drivers-ghayth-dev
    export AWS_PROFILE=wizz-drivers-ghayth-dev
fi

# Set environment variables
echo "🔧 Setting up environment..."
export NODE_ENV=development
export PORT=3000
export AWS_REGION=us-east-1

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Install backend dependencies if needed
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

echo "🎯 Starting WizzCentral Platform..."
echo "────────────────────────────────────────────────────────"

# Start the development server
npm run local

echo "✅ WizzCentral Platform startup script completed!"
