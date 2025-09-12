const path = require('path');

module.exports = {
  target: 'node',
  mode: 'production',
  entry: './src/handlers/amazon-connect-enhanced.js',
  externals: {
    'aws-sdk': 'aws-sdk'
  },
  resolve: {
    extensions: ['.js', '.json']
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  output: {
    libraryTarget: 'commonjs',
    path: path.resolve(__dirname, '.webpack'),
    filename: '[name].js'
  }
};
