// System Health Check for OOP Modular Architecture
// Simple diagnostic tool to verify all components are working
(function (global) {
  class SystemHealthCheck {
    constructor() {
      this.results = {};
      this.passed = 0;
      this.failed = 0;
    }

    run() {
      console.log('🏥 Running System Health Check...');
      console.log('=====================================');

      this.checkCoreModules();
      this.checkSupportModules();
      this.checkThemeSystem();
      this.checkEventBus();
      this.checkWebSocket();

      this.displayResults();
      return this.failed === 0;
    }

    assert(name, condition, message) {
      this.results[name] = {
        passed: condition,
        message: message || (condition ? 'PASS' : 'FAIL')
      };

      if (condition) {
        this.passed++;
        console.log(`✅ ${name}: ${message || 'PASS'}`);
      } else {
        this.failed++;
        console.error(`❌ ${name}: ${message || 'FAIL'}`);
      }
    }

    checkCoreModules() {
      console.log('\n🔧 Core Modules:');
      this.assert('EventBus', !!global.EventBus, 'Event communication system loaded');
      this.assert('ThemeManager', !!global.ThemeManager, 'Theme system loaded');
      this.assert('ModalManager', !!global.ModalManager, 'Modal system loaded');
      // ValidationManager removed - no longer required
      this.assert('StorageManager', !!global.StorageManager, 'Storage system loaded');
    }

    checkSupportModules() {
      console.log('\n🎫 Support Modules:');
      this.assert('SupportApp', !!global.SupportApp, 'Bootstrap application loaded');
      this.assert('TicketService', !!global.TicketService, 'Ticket service loaded');
      this.assert('TicketUI', !!global.TicketUI, 'Ticket UI loaded');
      this.assert('ChatSessionService', !!global.ChatSessionService, 'Chat session service loaded');
      this.assert('LiveChatSocket', !!global.LiveChatSocket, 'WebSocket wrapper loaded');
      this.assert('LiveChatUI', !!global.LiveChatUI, 'Live chat UI loaded');
    }

    checkThemeSystem() {
      console.log('\n🎨 Theme System:');
      if (global.ThemeManager) {
        const primaryColor = global.ThemeManager.getToken('color.primary');
        this.assert('Theme Tokens', !!primaryColor, `Primary color: ${primaryColor}`);

        const cssVar = getComputedStyle(document.documentElement).getPropertyValue('--color-primary');
        this.assert('CSS Variables', !!cssVar.trim(), `CSS variable applied: ${cssVar.trim()}`);

        this.assert('Theme Switching',
          typeof global.ThemeManager.switchTheme === 'function',
          'Theme switching available');
      }
    }

    checkEventBus() {
      console.log('\n📡 Event System:');
      if (global.EventBus) {
        let testReceived = false;
        const unsub = global.EventBus.on('health-check', () => { testReceived = true; });
        global.EventBus.emit('health-check');
        this.assert('Event Communication', testReceived, 'Events working correctly');
        unsub();
      }
    }

    checkWebSocket() {
      console.log('\n🔌 WebSocket System:');
      this.assert('WebSocket Manager', !!global.WebSocketManager, 'WebSocket class available');
      this.assert('Live Chat WebSocket', !!global.LiveChatSocket, 'Live chat WebSocket wrapper available');

      // Check if wsManager is initialized
      if (global.wsManager) {
        this.assert('WebSocket Instance', !!global.wsManager, 'WebSocket manager instance created');
      } else {
        this.assert('WebSocket Instance', false, 'WebSocket manager not initialized');
      }
    }

    displayResults() {
      console.log('\n📊 Health Check Results:');
      console.log('========================');
      console.log(`✅ Passed: ${this.passed}`);
      console.log(`❌ Failed: ${this.failed}`);
      console.log(`📈 Health Score: ${Math.round((this.passed / (this.passed + this.failed)) * 100)}%`);

      if (this.failed === 0) {
        console.log('🎉 System is healthy! All modules loaded correctly.');
        if (global.ModalManager) {
          global.ModalManager.success('System health check passed! 🎉');
        }
      } else {
        console.warn('⚠️ System has issues. Check failed components above.');
        if (global.ModalManager) {
          global.ModalManager.warning(`System health check: ${this.failed} issues found`);
        }
      }
    }

    // Quick fix for common issues
    diagnoseAndFix() {
      console.log('🔧 Running diagnostics and attempting fixes...');

      // Check if SupportApp is initialized
      if (global.SupportApp && !global.SupportApp.initialized) {
        console.log('🔧 Initializing SupportApp...');
        global.SupportApp.init();
      }

      // Check if theme is applied
      if (global.ThemeManager) {
        global.ThemeManager.applyToDocument();
      }

      // Re-run health check
      setTimeout(() => {
        console.log('🔄 Re-running health check after fixes...');
        this.run();
      }, 1000);
    }
  }

  // Make available globally
  global.SystemHealthCheck = SystemHealthCheck;

  // Auto-run on load (but wait for modules to initialize)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        const healthCheck = new SystemHealthCheck();
        healthCheck.run();
      }, 2000); // Wait 2 seconds for all modules to load
    });
  } else {
    setTimeout(() => {
      const healthCheck = new SystemHealthCheck();
      healthCheck.run();
    }, 2000);
  }

})(window);
