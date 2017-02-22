module.exports = {
  context: __dirname,
  entry: "./lib/root.js",
  output: {
    path: "./lib/",
    filename: "bundle.js"
  },
    module: {
    loaders: [
      {
        test: [/\.js?$/],
        exclude: /(node_modules)/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015']
        },
      },
      {
        test: /\.json$/,
        loader: 'raw-loader'
      }
    ]
  },
  devtool: 'source-map',
  resolve: {
    extensions: ['*', '.js']
  }
};