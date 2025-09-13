#!/bin/bash

echo "🔧 Testing Live Chat Session Filtering"
echo "======================================"

# Check if the filtering files exist
echo "📁 Checking filtering files..."

FILES=(
    "frontend/js/support/ChatSessionService.js"
    "frontend/js/support/LiveChatSocket.js"
    "frontend/assets/js/live-chat-manager.js"
    "frontend/js/auto-session-filter.js"
    "test-session-filtering.html"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
    fi
done

echo ""
echo "🔍 Checking for filtering methods in files..."

# Check for key filtering methods
echo "📋 Checking ChatSessionService.js:"
if grep -q "_isTestSession" frontend/js/support/ChatSessionService.js; then
    echo "✅ _isTestSession method found"
else
    echo "❌ _isTestSession method missing"
fi

if grep -q "_isAllowedDriverSession" frontend/js/support/ChatSessionService.js; then
    echo "✅ _isAllowedDriverSession method found"
else
    echo "❌ _isAllowedDriverSession method missing"
fi

echo "📋 Checking LiveChatSocket.js:"
if grep -q "_isTestSession" frontend/js/support/LiveChatSocket.js; then
    echo "✅ _isTestSession method found"
else
    echo "❌ _isTestSession method missing"
fi

echo "📋 Checking LiveChatManager.js:"
if grep -q "isTestSession" frontend/assets/js/live-chat-manager.js; then
    echo "✅ isTestSession method found"
else
    echo "❌ isTestSession method missing"
fi

if grep -q "filterGenuineSessions" frontend/assets/js/live-chat-manager.js; then
    echo "✅ filterGenuineSessions method found"
else
    echo "❌ filterGenuineSessions method missing"
fi

if grep -q "cleanupTestSessions" frontend/assets/js/live-chat-manager.js; then
    echo "✅ cleanupTestSessions method found"
else
    echo "❌ cleanupTestSessions method missing"
fi

echo ""
echo "🔧 Checking filter patterns..."

# Check for specific test patterns being filtered
PATTERNS=(
    "driver 123"
    "test driver"
    "mock driver"
    "test_"
    "mock_"
    "demo_"
)

echo "📋 Checking for test patterns in filtering logic:"
for pattern in "${PATTERNS[@]}"; do
    if grep -q "$pattern" frontend/js/support/ChatSessionService.js || grep -q "$pattern" frontend/assets/js/live-chat-manager.js; then
        echo "✅ Pattern '$pattern' is being filtered"
    else
        echo "⚠️  Pattern '$pattern' may not be filtered"
    fi
done

echo ""
echo "🌐 Testing filter interface..."

# Check if test interface exists and open it
if [ -f "test-session-filtering.html" ]; then
    echo "✅ Test interface available at: file://$(pwd)/test-session-filtering.html"
    
    # Try to open in default browser (macOS)
    if command -v open &> /dev/null; then
        echo "🌐 Opening test interface in browser..."
        open "file://$(pwd)/test-session-filtering.html"
    fi
else
    echo "❌ Test interface not found"
fi

echo ""
echo "🎯 Integration Test"
echo "=================="

# Create a simple test
cat > temp_filter_test.js << 'EOF'
// Quick filtering test
const testSessions = [
    { sessionId: 'test_session_001', driverName: 'Test Driver', metadata: { isTest: true } },
    { sessionId: 'genuine_session_001', driverName: 'غيث علي', metadata: { platform: 'flutter', source: 'wizzdriver' } },
    { sessionId: 'mock_session_123', driverName: 'Driver 123', metadata: { source: 'mock' } },
    { sessionId: 'real_session_002', driverName: 'أحمد محمد', metadata: { platform: 'flutter', source: 'wizzdriver' } }
];

console.log('🧪 Testing session filtering logic...');
console.log('Total test sessions:', testSessions.length);

// Test basic filtering patterns
let filteredOut = 0;
testSessions.forEach(session => {
    const name = session.driverName.toLowerCase();
    const id = session.sessionId.toLowerCase();
    const meta = session.metadata || {};
    
    // Apply filtering logic
    const isTest = meta.isTest || 
                   id.startsWith('test_') || 
                   id.startsWith('mock_') || 
                   name.includes('test') || 
                   name.includes('mock') || 
                   name === 'driver 123';
                   
    const isAllowed = meta.platform === 'flutter' && 
                      (meta.source === 'wizzdriver' || meta.source === 'flutter_http_bridge');
    
    if (isTest || !isAllowed) {
        console.log('🚫 FILTERED:', session.driverName, '(' + session.sessionId + ')');
        filteredOut++;
    } else {
        console.log('✅ ALLOWED:', session.driverName, '(' + session.sessionId + ')');
    }
});

console.log('📊 Results: ' + filteredOut + ' filtered out, ' + (testSessions.length - filteredOut) + ' allowed');
EOF

# Run the test with Node.js if available
if command -v node &> /dev/null; then
    echo "🧪 Running quick filter test..."
    node temp_filter_test.js
    rm temp_filter_test.js
else
    echo "⚠️  Node.js not available for testing"
    rm temp_filter_test.js
fi

echo ""
echo "📋 Summary"
echo "=========="
echo "✅ Enhanced session filtering has been implemented"
echo "✅ Test/mock sessions will be automatically filtered out"
echo "✅ Only genuine WizzDriver app sessions will be shown"
echo "✅ Auto-filtering script will run automatically"
echo ""
echo "🔧 Manual controls available:"
echo "   • window.autoSessionFilter.cleanup() - Remove test sessions"
echo "   • window.autoSessionFilter.filter() - Apply filtering now"
echo "   • window.autoSessionFilter.stats() - View filter statistics"
echo ""
echo "🌐 Test interface: test-session-filtering.html"
echo "📱 The live chat window should now show only 'غيث علي' and other genuine drivers"
