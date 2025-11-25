# 📋 Knowledge Base Quick Reference Card

## 🎯 Most Common Tasks

### 1️⃣ Edit Existing Question (30 seconds)
```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform
code backend/knowledge-base/merchants/orders-management.json
# Edit → Save → Done! (Auto-reloads)
```

### 2️⃣ Add New Question (2 minutes)
```bash
# Open file
code backend/knowledge-base/merchants/orders-management.json

# Copy existing question, paste, and modify:
{
  "id": "OM011",  # ← Increment number
  "question": "Your new question here?",
  "answer": "Step by step answer...\n\n✅ Pro tip here",
  "keywords": ["keyword", "phrase", "search term"],
  "priority": "medium",
  "related": ["OM001"],
  "escalate_if": ["complex case"]
}

# Save → Done!
```

### 3️⃣ Create New Category File (5 minutes)
```bash
cd backend/knowledge-base/merchants

# Copy template
cp orders-management.json payments-payouts.json

# Edit with your content
code payments-payouts.json

# Update: category, questions, IDs
# Save → Done!
```

### 4️⃣ Test Your Changes (10 seconds)
```bash
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/backend

node -e "
const { knowledgeBase } = require('./src/services/knowledge-base-loader');
(async () => {
  await knowledgeBase.reload();
  const r = knowledgeBase.search('YOUR_SEARCH_HERE', 'merchants');
  console.log('✅ Found:', r[0]?.title || 'No match');
})();
"
```

---

## 📍 File Locations

```
/whizzCentralPlatform/
  backend/
    knowledge-base/
      merchants/
        orders-management.json       ← ✅ EXISTS
        payments-payouts.json        ← Create this
        menu-management.json         ← Create this
        account-settings.json        ← Create this
      customers/
        ordering-help.json           ← Create this
```

---

## 🎨 Question Template

```json
{
  "id": "XX###",
  "question": "Clear question here?",
  "answer": "Answer with steps:\n\n1. First step\n2. Second step\n3. Third step\n\n⏰ Important note\n\n✅ Pro tip",
  "keywords": [
    "main keyword",
    "alternative phrase",
    "related term",
    "how users ask"
  ],
  "priority": "critical|high|medium|low",
  "related": ["XX001", "XX002"],
  "escalate_if": [
    "specific condition",
    "urgent situation"
  ]
}
```

---

## 🔤 Category ID Prefixes

| Category | Prefix | Example |
|----------|--------|---------|
| Order Management | `OM` | OM001, OM002 |
| Payment Issues | `PM` | PM001, PM002 |
| Account Issues | `AC` | AC001, AC002 |
| Business Setup | `BS` | BS001, BS002 |
| Technical Support | `TS` | TS001, TS002 |
| Menu Management | `MM` | MM001, MM002 |

---

## ✅ Writing Great Answers

### DO ✅
- Use numbered steps for processes
- Add emojis for visual clarity (✅ ⚠️ 💰 ⏰)
- Include time estimates ("⏰ 2 minutes")
- Mention consequences ("After 3 missed orders...")
- Link related questions
- Use `\n\n` for paragraph breaks

### DON'T ❌
- Write long paragraphs
- Use technical jargon
- Skip important warnings
- Forget edge cases

---

## 🔍 Useful Keywords

**Good keywords** = How users actually ask:
```json
"keywords": [
  "accept order",          // ✅ Natural phrase
  "new order notification",// ✅ How they ask
  "confirm order",         // ✅ Alternative term
  "order coming in"        // ✅ Casual phrasing
]
```

**Bad keywords** = Too generic:
```json
"keywords": ["order", "accept", "new"]  // ❌ Too broad
```

---

## 🧪 Quick Tests

### Validate JSON
```bash
cd backend/knowledge-base/merchants
node -e "JSON.parse(require('fs').readFileSync('FILE.json')); console.log('✅')"
```

### View Stats
```bash
cd backend
node -e "const {knowledgeBase}=require('./src/services/knowledge-base-loader');(async()=>{await knowledgeBase.initialize();console.log(knowledgeBase.getStats())})();"
```

### Test Search
```bash
node -e "const {knowledgeBase}=require('./src/services/knowledge-base-loader');(async()=>{await knowledgeBase.initialize();const r=knowledgeBase.search('QUERY','merchants');console.log(r[0]?.title)})();"
```

---

## 🚨 Common Mistakes

1. **Forgetting commas** between questions
   ```json
   }  ← Missing comma here!
   {
   ```

2. **Wrong escape characters** in answers
   ```json
   "answer": "Use \n not \\n"  ← Use single backslash
   ```

3. **Duplicate IDs**
   ```json
   "id": "OM001"  ← Already used!
   ```

4. **Generic keywords**
   ```json
   "keywords": ["help"]  ← Too generic
   ```

---

## 💡 Pro Tips

1. **Test before saving** - Validate JSON syntax
2. **Use real questions** - Copy from support tickets
3. **Update regularly** - Based on analytics
4. **Keep it simple** - 2-4 sentences or clear steps
5. **Visual hierarchy** - Use emojis and line breaks
6. **Link related** - Build knowledge graph
7. **Set escalation** - Know when humans needed

---

## 🎯 Emoji Guide

```
✅ Success, correct, yes
⚠️ Warning, important
❌ Error, wrong, no
💰 Money, payment, payout
⏰ Time, deadline, duration
📍 Location, address
🔔 Notification, alert
📱 App, mobile, phone
🏦 Bank, financial
📊 Statistics, data
🎯 Goal, target
🔍 Search, find
📝 Document, form
🚀 Quick, fast
💡 Tip, idea
```

---

## 📞 Getting Help

- **Full Guide**: `HOW_TO_UPDATE_KNOWLEDGE_BASE.md`
- **Implementation**: `AI_KNOWLEDGE_BASE_IMPROVEMENT_GUIDE.md`
- **Quick Start**: `AI_KNOWLEDGE_BASE_QUICK_START.md`
- **Success Guide**: `AI_KB_IMPLEMENTATION_SUCCESS.md`

---

## ⚡ Super Quick Workflow

```bash
# 1. Edit
code backend/knowledge-base/merchants/orders-management.json

# 2. Add/modify question (copy existing, change ID)

# 3. Save (⌘S)

# 4. Test (optional)
node -e "require('./backend/src/services/knowledge-base-loader').knowledgeBase.reload().then(()=>console.log('✅'))"

# Done! Changes are live.
```

---

**Last Updated**: November 15, 2025  
**Location**: `/whizzCentralPlatform/backend/knowledge-base/`  
**Auto-reload**: Yes ✅  
**Restart needed**: No ❌

---

**Quick Start**: Open `orders-management.json` → Copy question → Edit → Save → Done! 🎉
