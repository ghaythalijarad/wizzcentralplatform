╔═══════════════════════════════════════════════════════════════════════════╗
║                    🍎 XCODE INSTALLATION GUIDE 🍎                         ║
╚═══════════════════════════════════════════════════════════════════════════╝

✅ Xcode is now opening...

📋 FOLLOW THESE STEPS IN XCODE:

┌───────────────────────────────────────────────────────────────────────────┐
│ STEP 1: Select Your Device                                                │
└───────────────────────────────────────────────────────────────────────────┘
   • At the top of Xcode, look for the device dropdown (next to the Play button)
   • Click it and select: "Ghayth's iPhone"
   • Make sure it says "Ghayth's iPhone" NOT "Any iOS Device (arm64)"

┌───────────────────────────────────────────────────────────────────────────┐
│ STEP 2: Fix Signing (If Needed)                                           │
└───────────────────────────────────────────────────────────────────────────┘
   • In the left sidebar, click "Runner" (the blue icon at the top)
   • Select "Runner" under TARGETS
   • Click the "Signing & Capabilities" tab
   • Make sure:
     ✓ "Automatically manage signing" is checked
     ✓ Team: F6B9QH9W82 is selected
     ✓ Provisioning Profile shows (automatic)
   • If you see any red errors, click "Try Again" or re-select the team

┌───────────────────────────────────────────────────────────────────────────┐
│ STEP 3: Trust the Developer Certificate (If Prompted on iPhone)           │
└───────────────────────────────────────────────────────────────────────────┘
   If your iPhone shows "Untrusted Developer" message:
   1. Go to iPhone: Settings > General > VPN & Device Management
   2. Tap on your developer certificate (F6B9QH9W82)
   3. Tap "Trust [Your Name]"
   4. Confirm by tapping "Trust" again

┌───────────────────────────────────────────────────────────────────────────┐
│ STEP 4: Build and Run                                                     │
└───────────────────────────────────────────────────────────────────────────┘
   • Click the ▶️ Play button at the top left of Xcode
   • OR press: Cmd + R
   • Wait for build to complete (2-3 minutes)
   • The app will automatically install and launch on your iPhone

┌───────────────────────────────────────────────────────────────────────────┐
│ STEP 5: After App Launches on iPhone                                      │
└───────────────────────────────────────────────────────────────────────────┘
   1. ✅ Log in with your merchant credentials
   2. ✅ Wait 10 seconds (let FCM initialize)
   3. ✅ Press HOME button to minimize app (must be in background!)
   4. ✅ Go back to your Mac terminal

═══════════════════════════════════════════════════════════════════════════

📱 AFTER APP IS RUNNING IN BACKGROUND ON IPHONE:

Run this command in terminal:
┌───────────────────────────────────────────────────────────────────────────┐
│ cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform
│ node test_backend_notification.js                                         │
└───────────────────────────────────────────────────────────────────────────┘

Then immediately check your iPhone for the notification! 🔔

═══════════════════════════════════════════════════════════════════════════

🔧 TROUBLESHOOTING:

Problem: "No provisioning profile found"
   → Re-select your Team in Signing & Capabilities
   → Make sure "Automatically manage signing" is checked

Problem: "Unable to install"
   → iPhone might be locked - unlock it
   → Try unplugging and replugging the USB cable
   → Make sure iPhone trusts this computer (tap "Trust" when prompted)

Problem: Build fails with signing error
   → Open Xcode preferences: Cmd + ,
   → Go to Accounts tab
   → Make sure your Apple ID is signed in
   → Click "Download Manual Profiles"

Problem: App crashes immediately after launch
   → Check Xcode console for errors (bottom panel)
   → Try: Product > Clean Build Folder (Shift + Cmd + K)
   → Then build again (Cmd + R)

═══════════════════════════════════════════════════════════════════════════

⏱️  EXPECTED TIMELINE:

   1-2 min:  Xcode builds the app
   10 sec:   App installs on iPhone
   5 sec:    You log in and minimize app
   3 sec:    After running test, notification appears

═══════════════════════════════════════════════════════════════════════════

📞 WATCH FOR THIS MESSAGE IN XCODE:

   "Build Succeeded"  ✅
   "Running on Ghayth's iPhone"  ✅
   "Finished running Runner.app"  ✅

═══════════════════════════════════════════════════════════════════════════

🎯 ONCE APP IS RUNNING, COME BACK TO TERMINAL AND LET ME KNOW!

═══════════════════════════════════════════════════════════════════════════
