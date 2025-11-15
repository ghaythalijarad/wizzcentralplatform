# 📝 How to Manually Update Knowledge Base Files

## Quick Reference Guide

**Location**: `/whizzCentralPlatform/backend/knowledge-base/`

**File Format**: JSON

**No Restart Needed**: Changes are loaded dynamically!

---

## 📂 Directory Structure

```
backend/knowledge-base/
├── merchants/
│   ├── orders-management.json          ✅ EXISTS (10 Q&As)
│   ├── payments-payouts.json           ⏳ Create this
│   ├── account-settings.json           ⏳ Create this
│   ├── menu-management.json            ⏳ Create this
│   └── technical-issues.json           ⏳ Create this
├── customers/
│   ├── ordering-help.json              ⏳ Create this
│   └── delivery-tracking.json          ⏳ Create this
├── policies/
│   └── merchant-policies.json          ⏳ Create this
└── common-issues/
    └── top-20-issues.json              ⏳ Create this
```

---

## 🚀 Method 1: Quick Edit (Recommended)

### Step 1: Navigate to File
```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform
cd backend/knowledge-base/merchants
```

### Step 2: Open in Editor
```bash
# VS Code
code orders-management.json

# Or any text editor
open -a TextEdit orders-management.json
```

### Step 3: Edit the JSON
Add/modify questions in the `questions` array:

```json
{
  "category": "order_management",
  "version": "1.0",
  "last_updated": "2025-11-15",
  "questions": [
    {
      "id": "OM011",
      "question": "YOUR NEW QUESTION HERE",
      "answer": "YOUR DETAILED ANSWER HERE\n\nUse \\n for line breaks\nUse emojis: ✅ ⚠️ 💰",
      "keywords": ["keyword1", "keyword2", "phrase"],
      "priority": "high",
      "related": ["OM001", "OM002"],
      "escalate_if": ["complex issue", "urgent"]
    }
  ]
}
```

### Step 4: Validate JSON
```bash
# Quick validation
node -e "JSON.parse(require('fs').readFileSync('orders-management.json', 'utf8')); console.log('✅ Valid JSON')"
```

### Step 5: Test the Change
```bash
cd ../..  # Back to backend directory

node -e "
const { knowledgeBase } = require('./src/services/knowledge-base-loader');
(async () => {
  await knowledgeBase.reload();  // Reload without restart
  console.log('✅ Knowledge base reloaded');
  
  // Test your new question
  const results = knowledgeBase.search('YOUR_SEARCH_QUERY', 'merchants');
  console.log('Found:', results.length, 'results');
  if (results[0]) {
    console.log('Top:', results[0].title);
  }
})();
"
```

**Done! No server restart needed!**

---

## 🎯 Method 2: Using Command Line (Fast)

### Add a New Question
```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/backend/knowledge-base/merchants

# Using jq (install: brew install jq)
cat orders-management.json | jq '.questions += [{
  "id": "OM011",
  "question": "How do I update my store hours?",
  "answer": "To update store hours:\\n1. Go to Settings\\n2. Tap Business Hours\\n3. Adjust times\\n4. Save changes",
  "keywords": ["store hours", "opening hours", "working hours"],
  "priority": "medium",
  "related": ["OM010"],
  "escalate_if": []
}]' > temp.json && mv temp.json orders-management.json

echo "✅ Question added!"
```

### Update an Existing Question
```bash
# Find and edit specific question (replace OM001 with your ID)
jq '(.questions[] | select(.id == "OM001") | .answer) = "NEW ANSWER TEXT"' \
  orders-management.json > temp.json && mv temp.json orders-management.json
```

---

## 📋 Method 3: Copy Template (Easiest for New Files)

### Create a New Category File

```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/backend/knowledge-base/merchants

# Create from template
cat > payments-payouts.json << 'EOF'
{
  "category": "payment_issues",
  "version": "1.0",
  "last_updated": "2025-11-15",
  "description": "Payment and payout information for merchants",
  "questions": [
    {
      "id": "PM001",
      "question": "When do I receive my payouts?",
      "answer": "Payouts are processed weekly:\n\n💰 **Schedule**:\n- Calculation: Every Monday\n- Transfer: Within 3-5 business days\n- Bank arrival: Typically by Friday\n\n📊 **Requirements**:\n✅ Bank details verified\n✅ Minimum payout: $25\n✅ Account in good standing\n\nCheck your Earnings section for detailed breakdown.",
      "keywords": ["payout", "payment schedule", "when paid", "earnings", "money"],
      "priority": "high",
      "related": ["PM002", "PM003"],
      "escalate_if": ["payout delayed over 2 weeks", "incorrect amount"]
    },
    {
      "id": "PM002",
      "question": "What is the commission rate?",
      "answer": "Commission structure:\n\n💵 **Standard Rate**: 15% per order\n\n📊 **Breakdown**:\n- Platform fee: 12%\n- Payment processing: 3%\n\n🎯 **Volume Discounts**:\n- 100+ orders/month: 13%\n- 500+ orders/month: 11%\n- 1000+ orders/month: Custom rate\n\nCommission is deducted before payout.",
      "keywords": ["commission", "fees", "rate", "percentage", "cost"],
      "priority": "high",
      "related": ["PM001"],
      "escalate_if": ["dispute about commission", "incorrect deduction"]
    },
    {
      "id": "PM003",
      "question": "How do I update my bank details?",
      "answer": "Update bank information:\n\n🏦 **Steps**:\n1. Go to Settings → Payment Info\n2. Tap 'Bank Details'\n3. Enter new account information\n4. Upload verification document\n5. Wait for approval (1-2 business days)\n\n⚠️ **Important**:\n- Payouts pause during verification\n- Use business account if available\n- Ensure name matches business registration\n\n📞 Contact support if rejected.",
      "keywords": ["bank details", "account number", "change bank", "update payment"],
      "priority": "medium",
      "related": ["PM001"],
      "escalate_if": ["verification rejected", "urgent payout needed"]
    }
  ],
  "workflows": [
    {
      "id": "WF_PAYOUT_TRACKING",
      "name": "Track Your Payout",
      "steps": [
        "1. Open app → Earnings tab",
        "2. View 'Pending Payout' amount",
        "3. Check 'Next Payout Date'",
        "4. Review transaction history",
        "5. If delayed, contact support after 7 business days"
      ]
    }
  ],
  "policies": [
    {
      "id": "POL_PAYOUT_SCHEDULE",
      "name": "Weekly Payout Schedule",
      "description": "Payouts calculated Monday, transferred within 3-5 business days",
      "minimum": "$25 minimum payout threshold"
    },
    {
      "id": "POL_COMMISSION",
      "name": "Commission Structure",
      "description": "15% standard commission (12% platform + 3% payment processing)",
      "discounts": "Volume discounts available for high-performing merchants"
    }
  ]
}
EOF

echo "✅ Created payments-payouts.json"
```

### Test the New File
```bash
cd ../..
node -e "
const { knowledgeBase } = require('./src/services/knowledge-base-loader');
(async () => {
  await knowledgeBase.reload();
  const stats = knowledgeBase.getStats();
  console.log('📊 Total Questions:', stats.totalQuestions);
  console.log('📂 Categories:', stats.categories.join(', '));
  
  // Test search
  const results = knowledgeBase.search('payout', 'merchants');
  console.log('\\n🔍 Payout search:', results.length, 'results');
})();
"
```

---

## 🎨 JSON Structure Reference

### Complete Question Object
```json
{
  "id": "XX###",           // Unique ID (e.g., OM001, PM001, AC001)
  "question": "string",    // Clear, natural question
  "answer": "string",      // Detailed answer (use \n for line breaks)
  "keywords": [],          // Search terms (lowercase)
  "priority": "critical|high|medium|low",
  "related": [],           // Related question IDs
  "escalate_if": []        // When to escalate to human
}
```

### Category IDs (Use these)
```json
{
  "order_management": "OM###",
  "payment_issues": "PM###",
  "account_issues": "AC###",
  "business_setup": "BS###",
  "technical_support": "TS###",
  "menu_management": "MM###"
}
```

---

## ✅ Best Practices

### 1. Answer Format
```
✅ GOOD:
"To accept an order:\n1. Open app\n2. Tap order\n3. Review details\n4. Tap 'Accept'\n\n⏰ You have 2 minutes!"

❌ BAD:
"Just open the app and accept the order when it comes in."
```

### 2. Keywords
```json
✅ GOOD:
"keywords": ["accept order", "new order", "confirm order", "order notification"]

❌ BAD:
"keywords": ["accept", "order"]
```

### 3. Escalation Triggers
```json
✅ GOOD:
"escalate_if": ["tried all steps still not working", "urgent business impact", "customer threatening lawsuit"]

❌ BAD:
"escalate_if": ["doesn't work"]
```

### 4. Use Emojis for Visual Clarity
```
✅ Success / Checkmark
⚠️ Warning / Important
❌ Error / Wrong
💰 Money / Payment
⏰ Time / Deadline
📍 Location
🔔 Notification
📱 App / Mobile
🏦 Bank / Financial
```

---

## 🧪 Testing Changes

### Test 1: Validate JSON
```bash
cd backend/knowledge-base/merchants
node -e "
try {
  JSON.parse(require('fs').readFileSync('YOUR_FILE.json', 'utf8'));
  console.log('✅ Valid JSON');
} catch (e) {
  console.log('❌ Invalid JSON:', e.message);
}
"
```

### Test 2: Test Search
```bash
cd ../..
node -e "
const { knowledgeBase } = require('./src/services/knowledge-base-loader');
(async () => {
  await knowledgeBase.reload();
  
  const testQueries = [
    'accept orders',
    'payout',
    'cancel order',
    'change hours'
  ];
  
  for (const query of testQueries) {
    const results = knowledgeBase.search(query, 'merchants', 1);
    console.log('Query:', query);
    console.log('  →', results[0]?.title || 'No match');
    console.log('  Score:', results[0]?.score.toFixed(2) || 'N/A');
    console.log('');
  }
})();
"
```

### Test 3: Get Statistics
```bash
node -e "
const { knowledgeBase } = require('./src/services/knowledge-base-loader');
(async () => {
  await knowledgeBase.reload();
  console.log('📊 Stats:', knowledgeBase.getStats());
})();
"
```

---

## 🔄 Reload Without Restart

The knowledge base automatically reloads on server restart, but you can also reload manually:

```javascript
// In your code
const { knowledgeBase } = require('./src/services/knowledge-base-loader');
await knowledgeBase.reload();
```

Or via API endpoint (if you add one):
```bash
curl -X POST http://localhost:8080/api/admin/reload-kb
```

---

## 📝 Quick Edit Workflow

### Daily Update Routine (2 minutes)

1. **Open file**
   ```bash
   code backend/knowledge-base/merchants/orders-management.json
   ```

2. **Add/edit question**
   - Copy existing question
   - Change ID (increment number)
   - Update question and answer
   - Update keywords

3. **Save file** (⌘S / Ctrl+S)

4. **Validate**
   ```bash
   node -e "JSON.parse(require('fs').readFileSync('backend/knowledge-base/merchants/orders-management.json')); console.log('✅ Valid')"
   ```

5. **Test** (optional, but recommended)
   ```bash
   node -e "
   const { knowledgeBase } = require('./backend/src/services/knowledge-base-loader');
   (async () => {
     await knowledgeBase.reload();
     console.log('✅ Reloaded. Total Qs:', knowledgeBase.getStats().totalQuestions);
   })();
   "
   ```

**Done!** Changes are live immediately.

---

## 🆘 Common Issues & Fixes

### Issue 1: JSON Syntax Error
```
❌ Error: Unexpected token } in JSON at position 1234
```

**Fix**: Use a JSON validator
```bash
# Install if needed
brew install jq

# Validate and format
cat your-file.json | jq '.' > formatted.json
mv formatted.json your-file.json
```

### Issue 2: Knowledge Base Not Loading
```
⚠️ Knowledge base not initialized
```

**Fix**: Check file location
```bash
cd backend
ls -la knowledge-base/merchants/

# Should see: orders-management.json
```

### Issue 3: Search Returns No Results
```
Found: 0 results
```

**Fix**: Check keywords
```json
// Make keywords more specific
"keywords": [
  "accept order",        // ✅ GOOD - phrase
  "new order",          // ✅ GOOD - phrase
  "order notification", // ✅ GOOD - phrase
  "confirm order"       // ✅ GOOD - phrase
]
```

---

## 📊 Monitoring Changes

### View All Questions
```bash
cd backend/knowledge-base/merchants
jq '.questions[] | {id, question}' orders-management.json
```

### Count Questions per File
```bash
for file in *.json; do
  count=$(jq '.questions | length' "$file")
  echo "$file: $count questions"
done
```

### Find Specific Question
```bash
jq '.questions[] | select(.id == "OM001")' orders-management.json
```

---

## 🚀 Pro Tips

1. **Keep answers concise** - 2-4 sentences or clear steps
2. **Update version** - Increment version number when making major changes
3. **Test keywords** - Search for your question using different terms
4. **Link related** - Connect related questions with IDs
5. **Set priorities** - Mark critical issues as "critical" or "high"
6. **Review quarterly** - Update based on common support tickets
7. **Use templates** - Copy similar questions and modify

---

## 📚 Example: Adding a New Question

### Scenario: Merchant asks "How do I add photos to my menu?"

**Step 1: Choose file** → `menu-management.json` (or create it)

**Step 2: Add question**
```json
{
  "id": "MM005",
  "question": "How do I add photos to my menu items?",
  "answer": "Add photos to menu items:\n\n📸 **Steps**:\n1. Go to Menu → Select item\n2. Tap 'Add Photo' icon\n3. Choose from camera or gallery\n4. Crop/adjust image\n5. Tap 'Save'\n\n✅ **Tips**:\n- Use good lighting\n- Show the actual dish\n- Square format works best (1:1)\n- Max size: 5MB\n\n📊 **Impact**: Items with photos get 3x more orders!",
  "keywords": ["add photo", "menu photo", "item image", "upload picture", "menu pictures"],
  "priority": "medium",
  "related": ["MM001", "MM002"],
  "escalate_if": ["photo upload fails repeatedly", "image quality rejected"]
}
```

**Step 3: Save and test**
```bash
# Validate
node -e "JSON.parse(require('fs').readFileSync('backend/knowledge-base/merchants/menu-management.json')); console.log('✅ Valid')"

# Test search
node -e "
const { knowledgeBase } = require('./backend/src/services/knowledge-base-loader');
(async () => {
  await knowledgeBase.reload();
  const r = knowledgeBase.search('add photos menu', 'merchants');
  console.log('Found:', r[0]?.title);
})();
"
```

**Done!** The AI can now answer photo-related questions.

---

## 🎯 Quick Commands Cheat Sheet

```bash
# Navigate to KB
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/backend/knowledge-base/merchants

# Edit file
code orders-management.json

# Validate JSON
node -e "JSON.parse(require('fs').readFileSync('FILE.json')); console.log('✅')"

# Reload KB
cd ../.. && node -e "require('./src/services/knowledge-base-loader').knowledgeBase.reload().then(() => console.log('✅'))"

# Test search
node -e "const {knowledgeBase}=require('./src/services/knowledge-base-loader');(async()=>{await knowledgeBase.initialize();const r=knowledgeBase.search('QUERY','merchants');console.log(r[0]?.title)})();"

# View stats
node -e "const {knowledgeBase}=require('./src/services/knowledge-base-loader');(async()=>{await knowledgeBase.initialize();console.log(knowledgeBase.getStats())})();"
```

---

## ✅ Checklist for Updates

- [ ] Open correct file
- [ ] Add/edit question with unique ID
- [ ] Write clear, actionable answer
- [ ] Add relevant keywords (5-8 phrases)
- [ ] Set appropriate priority
- [ ] Link related questions
- [ ] Add escalation triggers
- [ ] Save file
- [ ] Validate JSON syntax
- [ ] Test search functionality
- [ ] Update version number (if major change)
- [ ] Update last_updated date

---

**Last Updated**: November 15, 2025  
**Next Review**: February 15, 2026

**Status**: ✅ Ready to Use!
