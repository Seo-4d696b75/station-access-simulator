const { merge } = require('webpack-merge'); // v5以上は { merge } = require('webpack-merge') とする
const common = require('./webpack.config.js');
const path = require("path");

module.exports = merge(common, {
  entry: './src/main.ts',
  mode: 'development',
  devtool: 'inline-source-map',
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "main.js"
  },
});