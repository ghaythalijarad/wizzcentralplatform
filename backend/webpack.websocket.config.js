const path = require('path');

module.exports = {
  entry: {
    'websocket-connections': './src/handlers/websocket-connections.js',
    'chat-bridge': './src/handlers/chat-bridge.js'
  },
  target: 'node',
  mode: 'production',
  optimization: {
    minimize: true,
  },
  externals: [],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [ ['@babel/preset-env', { targets: { node: '18' }, modules: false }] ]
          }
        }
      }
    ]
  },
  resolve: {
    extensions: ['.js']
  },
  output: {
    libraryTarget: 'commonjs2',
    path: path.join(__dirname, '.webpack'),
    filename: '[name].js'
  }
};
