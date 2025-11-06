#!/bin/bash
# Quick Schema Cleanup - One Command

echo "🚀 QUICK SCHEMA CLEANUP"
echo ""
echo "Choose an option:"
echo "  1) Test DynamoDB connection"
echo "  2) Dry run (preview changes)"
echo "  3) Run actual cleanup"
echo "  4) Cancel"
echo ""
read -p "Enter choice [1-4]: " choice

cd "$(dirname "$0")"

case $choice in
  1)
    echo "Testing DynamoDB connection..."
    node test-dynamodb.js
    ;;
  2)
    echo "Running dry run..."
    ./backend/cleanup-regions-schema.js --dry-run
    ;;
  3)
    echo "⚠️  This will modify all 116 items in DynamoDB!"
    read -p "Type 'yes' to continue: " confirm
    if [ "$confirm" = "yes" ]; then
      ./backend/cleanup-regions-schema.js
    else
      echo "Cancelled."
    fi
    ;;
  4)
    echo "Cancelled."
    ;;
  *)
    echo "Invalid choice."
    ;;
esac
