const path = require('path');

module.exports = {
  entry: './jupyter', // Path to your entry file
  output: {
    filename: 'jupyter.js',
    path: path.resolve(__dirname, '../static/js') // Ensure this matches your Go server's static file directory
  },
  resolve: {
    extensions: ['.ts', '.js'], // Resolve TypeScript and JavaScript files
    modules: [path.resolve(__dirname, 'src'), 'node_modules']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader', // Handles TypeScript files
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'], // Handles CSS files
      }
    ]
  },
  devtool: 'source-map' // Optional: to generate source maps for easier debugging
};
