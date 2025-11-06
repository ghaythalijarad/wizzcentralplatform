#!/bin/zsh
# Super simple - just start the server

cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform

# Kill everything on port 3000
killall node 2>/dev/null
lsof -ti:3000 | xargs kill -9 2>/dev/null
sleep 1

# Start server
echo "Starting server..."
node local-dev-server.js
