╔════════════════════════════════════════════════════════════════════════╗
║                🚀 WHIZZMERCHANTS CLEAN BUILD & TEST GUIDE 🚀              ║
╚════════════════════════════════════════════════════════════════════════╝

✅ COMPLETED:
   • Flutter clean build started
   • iOS pods reinstalled
   • App is being rebuilt fresh on your iPhone

⏳ WAIT FOR BUILD TO COMPLETE (3-5 minutes)

Watch for this message in terminal:
   "Flutter run key commands"
   "Application Finished"

═══════════════════════════════════════════════════════════════════════════

📱 AFTER BUILD COMPLETES:

STEP 1: Verify App Installation
   ☐ App should launch automatically on your iPhone
   ☐ Log in with your merchant credentials
   ☐ Verify dashboard loads correctly
   ☐ Check that you can see your business information

STEP 2: Register Fresh FCM Token
   ☐ Keep the app open for 10 seconds (let it initialize)
   ☐ Press HOME button to minimize app (must be in BACKGROUND)
   ☐ Wait 5 seconds for FCM token to register

STEP 3: Test Push Notification
   ☐ Run this command in a NEW terminal window:

   cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform
   node test_backend_notification.js

STEP 4: Check iPhone
   ☐ Within 3 seconds, you should see:
      • Notification banner at top of screen
      • Hear notification sound 🔔
      • Red badge on WhizzMerchants app icon

═══════════════════════════════════════════════════════════════════════════

🎯 EXPECTED TEST OUTPUT:

Terminal should show:
   ✅ SUCCESS! Notification sent!
   📊 Statistics:
      • Targeted: 4 merchants
      • Sent: 6
      • Failed: 0

iPhone should show:
   📬 "Direct Backend Test"
   💬 "This is a test notification sent directly from the backend..."

═══════════════════════════════════════════════════════════════════════════

🔧 IF BUILD FAILS:

Check terminal output for errors. Common issues:
   • Certificate expired: Open Xcode and re-sign
   • iPhone locked: Unlock your iPhone
   • Trust issue: Settings > General > Device Management > Trust developer

═══════════════════════════════════════════════════════════════════════════

📊 CHECK BUILD STATUS:

Run this command to see the current build progress:
   tail -f ~/Library/Logs/flutter/flutter.log | grep -i "build\|error\|warning"

Or check the terminal where you ran "flutter run"

═══════════════════════════════════════════════════════════════════════════

🎉 SUCCESS CRITERIA:

1. ✅ App builds and installs without errors
2. ✅ App launches and you can log in
3. ✅ Test notification command shows "Sent: 6, Failed: 0"
4. ✅ Notification appears on iPhone within 3 seconds
5. ✅ You hear the notification sound
6. ✅ Badge appears on app icon

═══════════════════════════════════════════════════════════════════════════

🚨 TROUBLESHOOTING:

Problem: Build takes too long (>10 minutes)
   → Cancel with Ctrl+C and rebuild with:
     flutter build ios --release
     flutter install -d 00008110-001C79140284801E

Problem: "No provisioning profile found"
   → Open project in Xcode and re-sign:
     open /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzMerchants/frontend/ios/Runner.xcworkspace

Problem: App crashes on launch
   → Check logs:
     flutter logs

Problem: No notification received
   → Check these in order:
     1. App is in BACKGROUND (not foreground)
     2. Do Not Disturb is OFF
     3. Notifications enabled in Settings > WhizzMerchants
     4. Check server logs for errors:
        tail -50 /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform/server.log

═══════════════════════════════════════════════════════════════════════════

📞 QUICK TEST COMMANDS:

# After app is installed and running in background:
cd /Users/ghaythallaheebi/WhizzEcoSystem/whizzEcosystem/whizzCentralPlatform
node test_backend_notification.js

# Check server status:
ps aux | grep -E "node.*local-dev-server" | grep -v grep

# Check server logs:
tail -30 server.log | grep -i "firebase\|sent\|failed"

# Verify device token registered:
aws dynamodb scan --table-name WhizzMerchants_DeviceTokens \
  --profile wizz-drivers-ghayth-dev --region us-east-1 \
  --filter-expression "platform = :p" \
  --expression-attribute-values '{":p":{"S":"ios"}}' \
  --max-items 1 | grep -A 2 "updatedAt"

═══════════════════════════════════════════════════════════════════════════

💡 TIP: Keep this window open while testing for easy reference!

═══════════════════════════════════════════════════════════════════════════
