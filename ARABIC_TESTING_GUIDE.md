# 🧪 Arabic Localization Testing Guide

## Quick Test Instructions

### 1. 🚀 Launch the Support Page

**Option A: Using Browser**
```bash
# Open in Chrome (no cache)
open -a "Google Chrome" --args --disable-cache \
  "http://localhost:8080/frontend/pages/support.html"
```

**Option B: Using VS Code Task**
- Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)
- Type: "Tasks: Run Task"
- Select: "Reload Support Page (No Cache)"

---

### 2. ✅ Visual Checks

#### **A. Page Load (Arabic Default)**
- [ ] Page loads with Arabic text
- [ ] Text flows right-to-left
- [ ] Header shows: "الدعم المباشر" (Live Support)
- [ ] Language indicator shows: "AR"
- [ ] Connection status in Arabic: "جاري الاتصال..." or "متصل"

#### **B. Language Switcher**
- [ ] Language button visible in header (🌐 icon with "AR")
- [ ] Click language button
- [ ] Page switches to English
- [ ] Text flows left-to-right
- [ ] Language indicator changes to: "EN"
- [ ] Click again to switch back to Arabic

#### **C. RTL Layout (Arabic Mode)**
- [ ] Sessions panel on the right side
- [ ] Chat area on the left side
- [ ] Message input aligned correctly
- [ ] Icons and buttons positioned properly
- [ ] Scroll bars on the left side

#### **D. LTR Layout (English Mode)**
- [ ] Sessions panel on the left side
- [ ] Chat area on the right side
- [ ] Standard left-to-right layout
- [ ] Scroll bars on the right side

---

### 3. 🔍 Console Testing

Open browser DevTools (F12) and test in Console:

```javascript
// 1. Check current language
console.log('Current Language:', SupportI18n.getLanguage());
// Expected: 'ar' (on first load)

// 2. Check if RTL mode
console.log('Is RTL?', SupportI18n.isRTL());
// Expected: true (in Arabic mode)

// 3. Test translation
console.log('Translation:', SupportI18n.t('connected'));
// Expected: 'متصل' (in Arabic) or 'Connected' (in English)

// 4. Switch to English
SupportI18n.setLanguage('en');
// Page should update to English

// 5. Verify language changed
console.log('Current Language:', SupportI18n.getLanguage());
// Expected: 'en'

// 6. Switch back to Arabic
SupportI18n.setLanguage('ar');
// Page should update to Arabic

// 7. Test translation with parameters
console.log(SupportI18n.t('minutesAgo', 5));
// Expected: 'منذ 5 دقيقة' (in Arabic) or '5 minutes ago' (in English)
```

---

### 4. 📝 Dynamic Content Testing

#### **A. Connection Status**
1. Watch the connection status indicator
2. Should display in current language:
   - Arabic: "جاري الاتصال..." → "متصل"
   - English: "Connecting..." → "Connected"

#### **B. Empty States**
1. With no active sessions:
   - Arabic: "لا توجد محادثات نشطة"
   - English: "No active conversations"

2. With no closed sessions:
   - Arabic: "لا توجد جلسات مغلقة مؤخراً"
   - English: "No recently closed sessions"

#### **C. Session Selection**
1. When no session selected:
   - Chat title should show:
   - Arabic: "اختر محادثة"
   - English: "Select a conversation"

2. When session active:
   - Chat title shows customer/driver name (same in both languages)
   - "End Session" button shows:
   - Arabic: "إنهاء الجلسة"
   - English: "End Session"

---

### 5. 🎨 UI Element Checks

#### **Arabic Mode Checklist**
```
✓ Header Title: "الدعم المباشر"
✓ Subtitle: "المساعدة الفورية للعملاء"
✓ Connection Status: "متصل" / "جاري الاتصال..." / "غير متصل"
✓ Reconnect Button: "إعادة الاتصال"
✓ Active Conversations: "المحادثات النشطة"
✓ Closed Sessions: "الجلسات المغلقة (آخر ساعتين)"
✓ Welcome Message: "مرحباً بك في لوحة الدعم"
✓ Select Conversation: "اختر محادثة"
✓ Input Placeholder: "اكتب رسالتك..."
✓ End Session Button: "إنهاء الجلسة"
```

#### **English Mode Checklist**
```
✓ Header Title: "Live Support"
✓ Subtitle: "Real-time customer assistance"
✓ Connection Status: "Connected" / "Connecting..." / "Disconnected"
✓ Reconnect Button: "Reconnect"
✓ Active Conversations: "Active Conversations"
✓ Closed Sessions: "Closed Sessions (Last 2h)"
✓ Welcome Message: "Welcome to Support Dashboard"
✓ Select Conversation: "Select a conversation"
✓ Input Placeholder: "Type your message..."
✓ End Session Button: "End Session"
```

---

### 6. 💾 LocalStorage Persistence Test

1. **Set Language to Arabic:**
   ```javascript
   SupportI18n.setLanguage('ar');
   ```

2. **Refresh Page** (F5 or Cmd+R)
   - Page should load in Arabic

3. **Check LocalStorage:**
   ```javascript
   console.log(localStorage.getItem('supportLanguage'));
   // Expected: 'ar'
   ```

4. **Set Language to English:**
   ```javascript
   SupportI18n.setLanguage('en');
   ```

5. **Refresh Page Again**
   - Page should load in English

6. **Clear LocalStorage:**
   ```javascript
   localStorage.removeItem('supportLanguage');
   location.reload();
   ```
   - Page should load in Arabic (default)

---

### 7. 🔄 Dynamic Updates Test

1. **Switch language while page is active**
2. **Verify these update automatically:**
   - [ ] Connection status text
   - [ ] Session list (if visible)
   - [ ] Empty state messages
   - [ ] Button labels
   - [ ] Input placeholders
   - [ ] Page direction (RTL/LTR)

---

### 8. 🐛 Common Issues & Solutions

#### **Issue: Page loads in English**
**Solution:** Check browser cache. Use incognito mode or clear cache.
```javascript
// Force Arabic
SupportI18n.setLanguage('ar');
```

#### **Issue: Language switcher doesn't work**
**Solution:** Open console and check for errors:
```javascript
// Check if i18n is loaded
console.log(typeof SupportI18n);
// Should output: 'object'

// Check if language switcher exists
console.log(document.getElementById('languageSwitcher'));
// Should output: <button> element
```

#### **Issue: Text not translating**
**Solution:** Check if element has `data-i18n` attribute:
```javascript
// Verify i18n attributes
document.querySelectorAll('[data-i18n]').forEach(el => {
    console.log(el.getAttribute('data-i18n'), ':', el.textContent);
});
```

#### **Issue: RTL layout broken**
**Solution:** Check HTML dir attribute:
```javascript
console.log(document.documentElement.getAttribute('dir'));
// Should be 'rtl' in Arabic, 'ltr' in English
```

---

### 9. 📱 Mobile/Responsive Testing

1. **Open DevTools** (F12)
2. **Toggle Device Toolbar** (Cmd+Shift+M / Ctrl+Shift+M)
3. **Select mobile device** (iPhone, iPad, etc.)
4. **Verify:**
   - [ ] Arabic text readable on small screens
   - [ ] Language switcher accessible
   - [ ] RTL layout works on mobile
   - [ ] Touch targets large enough

---

### 10. 🎯 Integration Testing

#### **A. With WebSocket Connection**
1. Start backend server
2. Open support page
3. Wait for WebSocket connection
4. Verify status updates in current language

#### **B. With Active Sessions**
1. Start a chat session (from driver/customer app)
2. Session should appear in list
3. Click to open
4. Verify all UI elements in current language

#### **C. With AI Assistant**
1. Open AI panel
2. Request suggestion
3. Verify AI responses work in both languages

---

### 11. ✅ Final Verification Checklist

```
Basic Functionality:
[ ] Page loads in Arabic by default
[ ] Language switcher button visible
[ ] Can switch between AR and EN
[ ] Language preference persists

Visual Layout:
[ ] RTL layout in Arabic mode
[ ] LTR layout in English mode
[ ] Message bubbles aligned correctly
[ ] Sessions panel positioned correctly

Dynamic Content:
[ ] Connection status translates
[ ] Empty states translate
[ ] Session updates translate
[ ] Error messages translate (if any)

Performance:
[ ] Language switch is instant
[ ] No console errors
[ ] No visual glitches
[ ] Smooth transitions

Edge Cases:
[ ] Works in incognito mode
[ ] Works after cache clear
[ ] Works with slow connection
[ ] Works with multiple tabs
```

---

## 🚨 Known Limitations

1. **Message Content:** User messages are not translated (as expected)
2. **Time Stamps:** Use browser locale for formatting
3. **Names:** Customer/driver names remain in original language
4. **AI Responses:** Depend on backend language setting

---

## 📞 Debug Commands

### Quick Diagnostics
```javascript
// Full diagnostic
console.log('=== Arabic i18n Diagnostics ===');
console.log('Language:', SupportI18n.getLanguage());
console.log('Is RTL?', SupportI18n.isRTL());
console.log('HTML dir:', document.documentElement.dir);
console.log('HTML lang:', document.documentElement.lang);
console.log('LocalStorage:', localStorage.getItem('supportLanguage'));
console.log('i18n Object:', SupportI18n);
console.log('Sample Translation:', SupportI18n.t('connected'));
console.log('i18n Elements:', document.querySelectorAll('[data-i18n]').length);
```

### Force Reset
```javascript
// Reset to default (Arabic)
localStorage.removeItem('supportLanguage');
SupportI18n.setLanguage('ar');
location.reload();
```

---

## ✨ Success Criteria

The Arabic localization is working correctly if:

1. ✅ Page loads in Arabic by default
2. ✅ Can switch to English and back
3. ✅ RTL layout works properly
4. ✅ All static text translates
5. ✅ All dynamic content translates
6. ✅ Language preference persists
7. ✅ No console errors
8. ✅ No visual glitches

---

## 📚 Additional Resources

- **Implementation Docs:** `ARABIC_LOCALIZATION_COMPLETE.md`
- **Translation Keys:** `frontend/assets/js/support-i18n.js`
- **Support Page:** `frontend/pages/support.html`

---

**Last Updated:** November 15, 2025  
**Status:** ✅ Ready for Testing  
**Implementation:** Complete ✅
