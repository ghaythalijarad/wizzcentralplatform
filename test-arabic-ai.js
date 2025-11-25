#!/usr/bin/env node
/**
 * Test Script for Arabic AI Configuration
 * Tests WhizzMe AI responses in Arabic
 */

const { getAISuggestion } = require('./backend/src/services/bedrock-agent-service');

console.log('🧪 Testing WhizzMe Arabic AI Configuration\n');
console.log('='.repeat(60));

// Test cases
const testCases = [
  {
    name: 'Test 1: Arabic Question (Order Management)',
    context: {
      userType: 'merchant',
      message: 'كيف أقبل طلب جديد؟',
      category: 'order_management',
      metadata: {
        language: 'ar'
      }
    }
  },
  {
    name: 'Test 2: Default Language (Should be Arabic)',
    context: {
      userType: 'merchant',
      message: 'لماذا لا أستلم طلبات؟',
      category: 'order_management',
      metadata: {}  // No language specified - should default to Arabic
    }
  },
  {
    name: 'Test 3: English Override',
    context: {
      userType: 'merchant',
      message: 'How do I accept a new order?',
      category: 'order_management',
      metadata: {
        language: 'en'
      }
    }
  },
  {
    name: 'Test 4: Technical Support in Arabic',
    context: {
      userType: 'merchant',
      message: 'التطبيق لا يعمل',
      category: 'technical_support',
      metadata: {
        language: 'ar'
      }
    }
  },
  {
    name: 'Test 5: Payment Question in Arabic',
    context: {
      userType: 'merchant',
      message: 'متى سأستلم مستحقاتي؟',
      category: 'payment_issues',
      metadata: {
        language: 'ar'
      }
    }
  }
];

async function runTests() {
  let passed = 0;
  let failed = 0;

  for (const test of testCases) {
    console.log(`\n📋 ${test.name}`);
    console.log('-'.repeat(60));
    console.log(`Message: ${test.context.message}`);
    console.log(`Category: ${test.context.category}`);
    console.log(`Language: ${test.context.metadata.language || 'default (ar)'}`);
    console.log();

    try {
      const startTime = Date.now();
      const response = await getAISuggestion(test.context);
      const duration = Date.now() - startTime;

      if (response.success) {
        console.log('✅ SUCCESS');
        console.log(`⏱️  Response Time: ${duration}ms`);
        console.log(`📝 Response:\n${response.suggestion}`);
        console.log(`🎯 Confidence: ${response.confidence}`);
        passed++;
      } else {
        console.log('❌ FAILED');
        console.log(`Error: ${response.error}`);
        failed++;
      }
    } catch (error) {
      console.log('❌ EXCEPTION');
      console.log(`Error: ${error.message}`);
      failed++;
    }

    console.log('='.repeat(60));
  }

  // Summary
  console.log('\n📊 Test Summary');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passed}/${testCases.length}`);
  console.log(`❌ Failed: ${failed}/${testCases.length}`);
  console.log(`Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);
  
  if (passed === testCases.length) {
    console.log('\n🎉 All tests passed! Arabic AI is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.');
  }
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
