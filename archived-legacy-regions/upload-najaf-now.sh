#!/bin/bash
# Quick Najaf Regions Upload

echo "🚀 Starting Najaf Regions Upload..."
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform

# Set AWS environment
export AWS_PROFILE=wizz-drivers-ghayth-dev
export AWS_REGION=us-east-1

# Run the upload
node quick-upload-najaf.js

echo "✅ Upload complete! Refresh the Regions Management page."
