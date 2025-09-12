const esbuild = require('esbuild');
const path = require('path');

async function buildChatBridge() {
  try {
    await esbuild.build({
      entryPoints: ['src/handlers/chat-bridge.js'],
      bundle: true,
      minify: true,
      target: 'node18',
      platform: 'node',
      outfile: 'dist/chat-bridge/index.js',
      external: ['aws-sdk', '@aws-sdk/*'],
      sourcemap: false,
      format: 'cjs',
      banner: {
        js: `// Chat bridge handler - exports sendChatMessage, postAgentReply, getChatHistory functions`
      }
    });
    console.log('✅ Chat bridge built successfully');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

buildChatBridge();
