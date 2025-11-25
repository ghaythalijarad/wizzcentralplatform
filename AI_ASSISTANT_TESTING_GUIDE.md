# AI Assistant Testing Guide 🧪

## Quick Test Steps

### 1. **View the AI Assistant Panel**
1. Open: `http://localhost:3000/pages/support.html`
2. **Initial State**: Panel should be hidden (no active session)
3. **Click any active session** in the left sidebar
4. **AI Panel should appear** between chat messages and input box

### 2. **Test Panel States**

#### Empty State (Default)
- Panel shows: "💡 Click 'Get AI Suggestion' to generate..."
- Status badge: "Ready" (white background)

#### Generate AI Suggestion
1. Click **"✨ Get AI Suggestion"** button
2. **Loading state** should show:
   - Spinning animation
   - "Generating AI suggestion..." text
   - Status badge: "Thinking..." (orange background)
   - Button disabled during loading

3. **Expected outcomes**:
   - **Success**: Suggestion appears in white box with action buttons
   - **Error**: Error message shows with red border
   - Status badge updates accordingly

#### Use Suggestion
1. After suggestion appears, click **"✓ Use This"**
2. Text should copy to message input box
3. Input should auto-resize and focus

#### Regenerate
1. Click **"🔄 Regenerate"** to get new suggestion
2. Loading state → new suggestion

#### Clear
1. Click **"Clear"** button
2. Panel resets to empty state

### 3. **Test Session Switching**
1. Generate AI suggestion for session A
2. Click on session B in sidebar
3. **AI panel should clear** (reset to empty state)
4. Generate new suggestion for session B
5. Verify it's contextual to session B's conversation

### 4. **Test Closed Sessions**
1. Select a closed/archived session
2. **AI panel should hide** (not available for closed sessions)
3. Input area should also be hidden

---

## 🔍 What to Check

### UI/UX
- [ ] Panel appears/hides correctly based on session state
- [ ] Smooth transitions between states
- [ ] Buttons are clickable and responsive
- [ ] Loading spinner animates smoothly
- [ ] Text is readable (white text on purple gradient)
- [ ] Buttons have hover effects

### Functionality
- [ ] Can only generate suggestions for active sessions
- [ ] Cannot generate suggestion if no conversation history
- [ ] "Use This" button copies text to input correctly
- [ ] Input auto-resizes after copying suggestion
- [ ] Session switching clears previous suggestions
- [ ] Closed sessions hide the AI panel

### Error Handling
- [ ] Error message if no session selected
- [ ] Error message if no conversation history
- [ ] Error message if API call fails (expected currently)
- [ ] Error message if authentication fails
- [ ] Button re-enables after error

---

## 🐛 Expected Behavior (Current State)

### ⚠️ API Calls Will Fail
Since the AI backend endpoint may not be fully implemented yet, you will see:

**Error Message**:
```
AI API returned 404: Not Found
```
or
```
Failed to generate AI suggestion. Please try again.
```

**This is expected!** The UI and integration are complete. Once the backend AI endpoint is ready at:
```
POST https://7ysrz3rspi.execute-api.us-east-1.amazonaws.com/dev/ai/suggestion
```

The suggestions will work.

---

## 🔧 Browser Console Logs

Watch for these debug messages:

### Success Flow
```
✨ AI suggestion displayed
✅ AI suggestion copied to input
```

### Error Flow
```
❌ AI suggestion error: [error details]
⚠️ No Cognito token found, using test mode
```

### Session Switching
```
🧹 AI suggestion cleared
```

---

## 📱 Mobile/Responsive Testing

If testing on different screen sizes:
- Panel should remain readable
- Buttons should stay clickable
- Text should wrap properly
- Panel shouldn't break layout

---

## ✅ What's Working Now

1. ✅ Panel visibility (shows/hides based on session)
2. ✅ All UI states render correctly
3. ✅ Button interactions work
4. ✅ Session switching clears state
5. ✅ "Use This" copies to input
6. ✅ Error messages display
7. ✅ Loading animations work
8. ✅ Status badge updates

## ⏳ What Needs Backend

1. ⏳ Actual AI suggestion generation (API endpoint)
2. ⏳ Real Cognito token validation
3. ⏳ Conversation context processing
4. ⏳ AI model response

---

## 🎯 Quick Visual Check

Open the page and look for:

```
┌─────────────────────────────────────────┐
│  Chat Messages Area                     │
│  (conversation history)                 │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐ ← NEW AI PANEL
│ 🤖 WhizzAI Suggestion    [Ready]       │
│          [✨ Get AI Suggestion]         │
│                                         │
│ 💡 Click "Get AI Suggestion" to        │
│    generate a response...               │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ [Type your message...]        [Send →]  │
└─────────────────────────────────────────┘
```

---

## 🚀 Next Steps After UI Testing

Once UI is confirmed working:

1. **Backend Team**: Implement AI endpoint
2. **Auth Team**: Verify Cognito token flow
3. **Integration Test**: End-to-end with real AI responses
4. **Performance Test**: Response time monitoring
5. **User Feedback**: Gather agent feedback on suggestions

---

**Testing Date**: November 13, 2025  
**Test URL**: http://localhost:3000/pages/support.html  
**Status**: UI Complete ✅ | Backend Integration Pending ⏳
