#!/bin/bash

# Knowledge Base Management Helper Script
# Quick commands for updating KB files

KB_PATH="/Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/backend/knowledge-base"
BACKEND_PATH="/Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/backend"

echo "🧠 Knowledge Base Manager"
echo "========================="
echo ""

# Function to show menu
show_menu() {
    echo "Choose an option:"
    echo ""
    echo "1. 📝 Edit existing KB file"
    echo "2. ➕ Add new question to file"
    echo "3. 📊 View KB statistics"
    echo "4. 🔍 Test search"
    echo "5. ✅ Validate all files"
    echo "6. 🔄 Reload KB (test)"
    echo "7. 📋 List all files"
    echo "8. 🆕 Create new KB file"
    echo "9. ❌ Exit"
    echo ""
}

# Function to list files
list_files() {
    echo ""
    echo "📂 Available Knowledge Base Files:"
    echo ""
    cd "$KB_PATH"
    find . -name "*.json" -type f | sed 's|^\./||' | nl
    echo ""
}

# Function to validate JSON
validate_json() {
    local file=$1
    if node -e "try { JSON.parse(require('fs').readFileSync('$file', 'utf8')); console.log('✅ Valid JSON'); process.exit(0); } catch(e) { console.log('❌ Invalid:', e.message); process.exit(1); }"; then
        return 0
    else
        return 1
    fi
}

# Function to view stats
view_stats() {
    echo ""
    echo "📊 Knowledge Base Statistics:"
    echo ""
    cd "$BACKEND_PATH"
    node -e "
const { knowledgeBase } = require('./src/services/knowledge-base-loader');
(async () => {
  try {
    await knowledgeBase.initialize();
    const stats = knowledgeBase.getStats();
    console.log('   Files Loaded:', stats.filesLoaded);
    console.log('   Total Questions:', stats.totalQuestions);
    console.log('   Total Policies:', stats.totalPolicies);
    console.log('   Total Workflows:', stats.totalWorkflows);
    console.log('   Categories:', stats.categories.join(', '));
  } catch (e) {
    console.log('   ❌ Error:', e.message);
  }
})();
"
    echo ""
}

# Function to test search
test_search() {
    echo ""
    read -p "Enter search query: " query
    read -p "Category (merchants/customers/all): " category
    
    if [ "$category" = "all" ]; then
        category=""
    fi
    
    echo ""
    echo "🔍 Searching for: '$query'"
    echo ""
    
    cd "$BACKEND_PATH"
    node -e "
const { knowledgeBase } = require('./src/services/knowledge-base-loader');
(async () => {
  try {
    await knowledgeBase.initialize();
    const results = knowledgeBase.search('$query', '$category', 5);
    console.log('Found:', results.length, 'results\\n');
    results.forEach((r, i) => {
      console.log(\`\${i+1}. \${r.title}\`);
      console.log(\`   Score: \${r.score.toFixed(2)} | Category: \${r.category} | ID: \${r.id}\`);
      console.log('');
    });
  } catch (e) {
    console.log('❌ Error:', e.message);
  }
})();
"
    echo ""
}

# Function to validate all files
validate_all() {
    echo ""
    echo "✅ Validating all KB files..."
    echo ""
    cd "$KB_PATH"
    
    find . -name "*.json" -type f | while read file; do
        printf "   %-50s" "$file"
        if validate_json "$file" 2>/dev/null; then
            echo " ✅"
        else
            echo " ❌"
        fi
    done
    echo ""
}

# Function to create new KB file
create_new_file() {
    echo ""
    read -p "Enter category (merchants/customers/policies/common-issues): " category
    read -p "Enter filename (e.g., menu-management): " filename
    
    filepath="$KB_PATH/$category/${filename}.json"
    
    if [ -f "$filepath" ]; then
        echo "❌ File already exists: $filepath"
        return
    fi
    
    # Create directory if it doesn't exist
    mkdir -p "$KB_PATH/$category"
    
    # Create template file
    cat > "$filepath" << 'EOF'
{
  "category": "CATEGORY_NAME",
  "version": "1.0",
  "last_updated": "2025-11-15",
  "description": "Brief description of this category",
  "questions": [
    {
      "id": "XX001",
      "question": "Example question?",
      "answer": "Example answer with details.\n\nUse \\n for line breaks.\n\n✅ Use emojis for clarity",
      "keywords": ["keyword1", "keyword2", "phrase"],
      "priority": "medium",
      "related": [],
      "escalate_if": []
    }
  ],
  "workflows": [],
  "policies": []
}
EOF

    echo ""
    echo "✅ Created: $filepath"
    echo ""
    echo "Next steps:"
    echo "1. Edit the file: code $filepath"
    echo "2. Replace CATEGORY_NAME, XX001, and example content"
    echo "3. Validate: kb-manager.sh → option 5"
    echo ""
}

# Function to reload KB
reload_kb() {
    echo ""
    echo "🔄 Reloading Knowledge Base..."
    cd "$BACKEND_PATH"
    node -e "
const { knowledgeBase } = require('./src/services/knowledge-base-loader');
(async () => {
  try {
    await knowledgeBase.reload();
    console.log('✅ Knowledge base reloaded successfully');
    const stats = knowledgeBase.getStats();
    console.log('   Total Questions:', stats.totalQuestions);
  } catch (e) {
    console.log('❌ Error:', e.message);
  }
})();
"
    echo ""
}

# Main loop
while true; do
    show_menu
    read -p "Enter option (1-9): " choice
    
    case $choice in
        1)
            list_files
            read -p "Enter file path (e.g., merchants/orders-management.json): " filepath
            if [ -f "$KB_PATH/$filepath" ]; then
                code "$KB_PATH/$filepath"
                echo "✅ Opened in VS Code"
            else
                echo "❌ File not found: $filepath"
            fi
            ;;
        2)
            list_files
            read -p "Enter file path: " filepath
            if [ -f "$KB_PATH/$filepath" ]; then
                echo ""
                read -p "Question ID (e.g., OM011): " qid
                read -p "Question: " question
                read -p "Answer (one line, use \\n for breaks): " answer
                read -p "Keywords (comma-separated): " keywords
                read -p "Priority (critical/high/medium/low): " priority
                
                echo ""
                echo "Adding question to $filepath..."
                echo "Note: This is a manual edit - please open the file and add:"
                echo ""
                echo "{
  \"id\": \"$qid\",
  \"question\": \"$question\",
  \"answer\": \"$answer\",
  \"keywords\": [$(echo $keywords | sed 's/,/", "/g' | sed 's/^/"/' | sed 's/$/"/')],
  \"priority\": \"$priority\",
  \"related\": [],
  \"escalate_if\": []
}"
                echo ""
                read -p "Press Enter to open file in editor..."
                code "$KB_PATH/$filepath"
            else
                echo "❌ File not found"
            fi
            ;;
        3)
            view_stats
            read -p "Press Enter to continue..."
            ;;
        4)
            test_search
            read -p "Press Enter to continue..."
            ;;
        5)
            validate_all
            read -p "Press Enter to continue..."
            ;;
        6)
            reload_kb
            read -p "Press Enter to continue..."
            ;;
        7)
            list_files
            read -p "Press Enter to continue..."
            ;;
        8)
            create_new_file
            read -p "Press Enter to continue..."
            ;;
        9)
            echo ""
            echo "👋 Goodbye!"
            echo ""
            exit 0
            ;;
        *)
            echo ""
            echo "❌ Invalid option. Please choose 1-9"
            echo ""
            ;;
    esac
done
