const { merge } = require('webpack-merge'); // v5以上は { merge } = require('webpack-merge') とする
const common = require('./webpack.config.js');
module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
});