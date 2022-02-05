const path = require("path");

module.exports = {
  entry: './src/index.ts',
  target: 'web',
  mode: 'production',
  output: {
    path: path.resolve(__dirname, "umd"),
    filename: "ekimemo-access-simulator.js",
    library: "ekimemo-access-simulator",
    libraryTarget: "umd"
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: ['ts-loader'],
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ]
  }
};