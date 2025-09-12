const esbuild = require('esbuild');
const path = require('path');

async function buildWebSocketHandler() {
  try {
    await esbuild.build({
      entryPoints: ['src/handlers/websocket-connections.js'],
      bundle: true,
      minify: true,
      target: 'node18',
      platform: 'node',
      outfile: 'dist/websocket-handler/index.js',
      external: ['aws-sdk', '@aws-sdk/*'],
      sourcemap: false,
      format: 'cjs',
      banner: {
        js: `// WebSocket handler - exports handler function`
      }
    });
    console.log('✅ WebSocket handler built successfully');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

buildWebSocketHandler();
