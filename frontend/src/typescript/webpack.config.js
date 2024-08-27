const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './src/ts/jupyter.ts', // Updated entry point for TypeScript
  output: {
    filename: 'jupyter.js', // Output filename
    path: path.resolve(__dirname, 'dist/js'), // Output directory for JS
    publicPath: '/js/', // Public path for serving JS files
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'], // Handle CSS files
      },
      {
        test: /\.html$/,
        use: ['html-loader'], // Handle HTML files
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '../css/styles.css', // Output CSS to 'dist/css'
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'src/html'), // Source folder for HTML files
          to: path.resolve(__dirname, 'dist/html'), // Destination folder for HTML files
        },
        {
          from: path.resolve(__dirname, 'src/css'), // Source folder for CSS files
          to: path.resolve(__dirname, 'dist/css'), // Destination folder for CSS files
        },
        {
          from: path.resolve(__dirname, 'src/img'), // Source folder for img files
          to: path.resolve(__dirname, 'dist/img'), // Destination folder for img files
        },
      ],
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'), // Serve from 'dist'
    },
    compress: true,
    port: 8081,
    hot: true,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'], // Resolve these extensions
  },
};
