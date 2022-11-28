const path = require("path");

module.exports = {
  entry: './src/index.ts',
  target: 'web',
  mode: 'production',
  output: {
    path: path.resolve(__dirname, "umd"),
    filename: "simulator.min.js",
    chunkFilename: "[name].min.js",
    library: 'simulator',
    libraryTarget: 'umd',
    globalObject: 'this',
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: 'tsconfig.webpack.json'
          }
        },
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ]
  }
};