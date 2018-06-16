const os = require('os');
const path = require('path');
const webpack = require('webpack');
const HappyPack = require('happypack');
const getFiles = require('./getWebpackFiles');
const vueLoaderConfig = require('./vue-loader.conf');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const happyThreadPool = HappyPack.ThreadPool({ size: os.cpus().length })

process.noDeprecation = true;

function resolve(relativePath) {
  return path.join(process.cwd(), relativePath)
}

const plugins = [
  new webpack.optimize.CommonsChunkPlugin({
    async: 'shared-module',
    minChunks: (module, count) => count >= 2
  }),
  new HappyPack({
    id: 'babel',
    verbose: false,
    loaders: ['babel-loader?cacheDirectory=true'],
    threadPool: happyThreadPool
  }),
  new webpack.BannerPlugin({
    banner: '// { "framework": "Vue" }\n',
    raw: true,
    exclude: 'Vue'
  })
]
var weexCfg = {
  entry: getFiles.getEntry(),
  output: {
    path: resolve('dist'),
    publicPath: resolve('dist/js'),
    filename: '[name].js',
    chunkFilename: '[chunkhash].js'
  },
  cache: true,
  watch: false,
  resolveLoader: {
    modules: [path.resolve(__dirname, '../../../', 'node_modules')]
  },
  stats: {
    colors: true,
    modules: false,
    reasons: false
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: 'happypack/loader?id=babel',
        include: [
          resolve('node_modules'),
          resolve('src')
        ]
      },
      {
        test: /\.vue(\?[^?]+)?$/,
        include: [
          resolve('node_modules'),
          resolve('src')
        ],
        use: [{
          loader: 'weex-loader',
          options: {
            loaders: {
              sass: ['sass-loader'],
              scss: ['sass-loader'],
              less: ['less-loader'],
              stylus: ['stylus-loader']
            }
          }
        }]
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.vue', '.json', '.css', '.less', '.sass'],
    alias: getFiles.getAlias(),
    modules: [
      resolve('node_modules')
    ]
  },
  plugins
}

/**
 * Generate multiple entrys
 * @param {Array} entry 
 */
const generateMultipleEntrys = (entry) => {
  let entrys = Object.keys(entry);
  // exclude vendor entry.
  let excludes = ['vendor', 'plugin', 'js/config/index'];
  entrys = entrys.filter(entry => excludes.indexOf(entry) === -1);
  const htmlPlugin = entrys.map(name => {
    return new HtmlWebpackPlugin({
      filename: name + '.html',
      template: resolve('web/index.html'),
      isDevServer: true,
      chunksSortMode: 'dependency',
      inject: true,
      chunks: [name],
      // production
      minimize: true
    })
  })
  return htmlPlugin;
}

const useEslint = [];
var webCfg = {
  entry: getFiles.getWebEntry(),
  output: {
    path: resolve('dist/web'),
    filename: '[name].js'
  },
  resolve: {
    extensions: ['.js', '.vue', '.json', '.css', '.less', '.sass'],
    alias: getFiles.getAlias(),
    modules: [
      resolve('node_modules')
    ]
  },
  module: {
    // webpack 2.0 
    rules: useEslint.concat([
      {
        test: /\.js$/,
        use: [{
          loader: 'babel-loader'
        }],
        exclude: /node_modules(?!(\/|\\).*(weex).*)/
      },
      {
        test: /\.vue(\?[^?]+)?$/,
        use: [{
          loader: 'vue-loader',
          options: Object.assign(vueLoaderConfig({useVue: true, usePostCSS: false}), {
            /**
             * important! should use postTransformNode to add $processStyle for
             * inline style prefixing.
             */
            optimizeSSR: false,
            postcss: [
              // to convert weex exclusive styles.
              require('postcss-plugin-weex')(),
              require('autoprefixer')({
                browsers: ['> 0.1%', 'ios >= 8', 'not ie < 12']
              }),
              require('postcss-plugin-px2rem')({
                // base on 750px standard.
                rootValue: 75,
                // to leave 1px alone.
                minPixelValue: 1.01
              })
            ],
            compilerModules: [
              {
                postTransformNode: el => {
                  // to convert vnode for weex components.
                  require('weex-vue-precompiler')()(el)
                }
              }
            ]
            
          })
        }]
      }
    ])
  },
  plugins: [
    new webpack.BannerPlugin({
      banner: '// { "framework": "Vue"} \n',
      raw: true,
      exclude: 'Vue'
    }),
    ...generateMultipleEntrys(getFiles.getWebEntry())
  ]
}

let isDev = true
if (isDev) {
  weexCfg.devtool = 'eval';
  weexCfg.plugins = weexCfg.plugins.concat([
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('development')
      }
    })
  ])
}

module.exports = [weexCfg, webCfg];
