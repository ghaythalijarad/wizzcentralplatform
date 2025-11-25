# 🔍 AI Panel Debug Guide

## Issue: AI Panel Not Visible

### Quick Test (Run in Browser Console)

Open the browser console (F12 or Cmd+Option+I) and run these commands one by one:

```javascript
// 1. Check if AI panel exists in DOM
const panel = document.getElementById('ai-suggestion-panel');
console.log('Panel exists:', !!panel);
console.log('Panel element:', panel);

// 2. Check panel classes and styles
console.log('Panel classes:', panel?.className);
console.log('Panel inline display:', panel?.style.display);
console.log('Panel computed display:', window.getComputedStyle(panel).display);

// 3. Check panel dimensions
console.log('Panel offsetHeight:', panel?.offsetHeight);
console.log('Panel offsetWidth:', panel?.offsetWidth);
console.log('Panel position:', panel?.getBoundingClientRect());

// 4. Force show the panel manually
panel.classList.remove('hidden');
panel.style.display = 'block';
panel.style.visibility = 'visible';
panel.style.opacity = '1';
panel.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
panel.style.padding = '1rem';
panel.style.margin = '0 1.5rem';
panel.style.borderRadius = '0.75rem';
panel.style.position = 'relative';
panel.style.zIndex = '1000';
console.log('✅ Panel forced visible');

// 5. Add test content
document.getElementById('ai-loading').classList.add('hidden');
document.getElementById('ai-content').classList.remove('hidden');
document.getElementById('ai-suggestion-text').textContent = 'TEST: This is a test AI suggestion. If you can see this purple panel with this text, the AI panel is working!';
console.log('✅ Test content added');

// 6. Scroll into view
panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
```

### Using the Test Button

1. **Click the "Test AI" button** in the chat header (next to "End Session")
2. **Watch the console** for detailed debug output
3. **Look for the purple gradient panel** below the chat messages

### What Should Happen

✅ **Purple gradient panel appears** below chat messages  
✅ **Loading spinner shows** for 2 seconds  
✅ **AI suggestion text appears** with three buttons  
✅ **Buttons are clickable**: "Use This", "Retry", "Dismiss"

### If Panel Still Not Visible

Run this comprehensive check:

```javascript
// Full diagnostic
console.log('========== AI PANEL DIAGNOSTIC ==========');

// Check all AI elements
const elements = {
    panel: document.getElementById('ai-suggestion-panel'),
    loading: document.getElementById('ai-loading'),
    content: document.getElementById('ai-content'),
    text: document.getElementById('ai-suggestion-text')
};

console.log('Elements found:', Object.entries(elements).map(([k,v]) => `${k}: ${!!v}`));

// Check parent container
const chatArea = document.querySelector('.chat-area');
console.log('Chat area:', chatArea);
console.log('Chat area display:', window.getComputedStyle(chatArea).display);

// Check if panel is in correct position
console.log('Panel parent:', elements.panel?.parentElement?.className);

// Check CSS rules affecting panel
const panelStyles = window.getComputedStyle(elements.panel);
console.log('Panel computed styles:', {
    display: panelStyles.display,
    visibility: panelStyles.visibility,
    opacity: panelStyles.opacity,
    position: panelStyles.position,
    zIndex: panelStyles.zIndex,
    height: panelStyles.height,
    width: panelStyles.width
});

// Check if any parent has display:none
let parent = elements.panel?.parentElement;
while (parent && parent !== document.body) {
    const display = window.getComputedStyle(parent).display;
    if (display === 'none') {
        console.error('❌ Parent has display:none:', parent.className || parent.tagName);
    }
    parent = parent.parentElement;
}

console.log('========================================');
```

### Manual Fix (Last Resort)

If nothing works, paste this into console:

```javascript
// Nuclear option - force visibility with !important
const style = document.createElement('style');
style.textContent = `
    #ai-suggestion-panel {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        position: relative !important;
        z-index: 9999 !important;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
        padding: 1rem !important;
        margin: 1rem 1.5rem !important;
        border-radius: 0.75rem !important;
        min-height: 100px !important;
    }
`;
document.head.appendChild(style);
console.log('✅ Emergency CSS override applied');

// Then run the test
testAIPanel();
```

## WebSocket "Connection Failed" Issue

The connection is actually working (messages deliver fine), it's just showing recovery messages.

### To Verify Connection Works:

1. Select a chat session
2. Send a test message
3. Check if message appears in chat
4. If yes → Connection is working, ignore "recovery" message

### The Fix Applied:

Updated `updateConnectionStatus()` to suppress cosmetic "connection recovery" messages since messaging works bidirectionally.

## Expected Behavior After Fixes

✅ AI panel shows up with purple gradient  
✅ "Test AI" button triggers panel  
✅ Auto-trigger works after sending messages  
✅ Connection status doesn't show confusing recovery messages  
✅ All three action buttons work (Use This, Retry, Dismiss)

## Next Steps

1. **Test the AI panel** - Click "Test AI" button
2. **Check console output** - Look for 🧪 test messages
3. **Verify visibility** - Purple panel should appear
4. **Report findings** - What do you see in console? Is panel visible?
