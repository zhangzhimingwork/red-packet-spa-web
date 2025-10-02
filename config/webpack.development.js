const HtmlWebpackPlugin = require('html-webpack-plugin')
const { resolve, join } = require('path')
const FriendlyErrorsWebpackPlugin = require('@soda/friendly-errors-webpack-plugin')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const notifier = require('node-notifier')
const port = 3000

module.exports = {
  devServer: {
    historyApiFallback: true,
    // 移除 static 配置
    hot: true,
    port
  },
  output: {
    publicPath: '/', // 重要：改为 '/'
    filename: 'scripts/[name].bundle.js',
    assetModuleFilename: 'images/[name].[ext]'
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      favicon: './public/favicon.ico',
      template: resolve(__dirname, '../src/index-dev.html')
    }),
    new FriendlyErrorsWebpackPlugin({
      compilationSuccessInfo: {
        messages: ['You application is running here http://localhost:' + port],
        notes: ['💊 构建信息请及时关注窗口右上角']
      },
      onErrors: function (severity, errors) {
        if (severity !== 'error') {
          return
        }
        const error = errors[0]
        console.log(error)
        notifier.notify({
          title: '👒 Webpack Build Error',
          message: severity + ': ' + error.name,
          subtitle: error.file || '',
          icon: join(__dirname, 'icon.png')
        })
      },
      clearConsole: true
    }),
    // new BundleAnalyzerPlugin()
  ]
}
