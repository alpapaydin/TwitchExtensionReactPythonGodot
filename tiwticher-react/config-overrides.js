const { override, adjustStyleLoaders } = require('customize-cra');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const fs = require('fs');

module.exports = function override(config, env) {
  // Manually add entries
  config.entry = {
    main: path.resolve(__dirname, 'src/index.js'),
    config: path.resolve(__dirname, 'src/config.js'),
  };

  // Adjust style loaders
  adjustStyleLoaders(({ use: [, css, postcss, resolve, processor] }) => {
    css.options.sourceMap = true;         // css-loader
    postcss.options.sourceMap = true;     // postcss-loader
    if (resolve) {
      resolve.options.sourceMap = true;   // resolve-url-loader
    }
    if (processor && processor.loader.includes('sass-loader')) {
      processor.options.sourceMap = true; // sass-loader
    }
  })(config);

  // Find and remove the default HtmlWebpackPlugin
  const pluginIndex = config.plugins.findIndex(plugin => plugin.constructor.name === 'HtmlWebpackPlugin');
  if (pluginIndex !== -1) {
    config.plugins.splice(pluginIndex, 1);
  }

  // Create an instance of HtmlWebpackPlugin for the 'index.html'
  config.plugins.push(
    new HtmlWebpackPlugin({
      inject: true,
      template: path.resolve(__dirname, 'public/index.html'),
      chunks: ['main'],
      filename: 'index.html',
    })
  );

  // Check if 'public/config.html' exists
  if (fs.existsSync(path.resolve(__dirname, 'public/config.html'))) {
    // Create an instance of HtmlWebpackPlugin for the 'config.html'
    config.plugins.push(
      new HtmlWebpackPlugin({
        inject: true,
        template: path.resolve(__dirname, 'public/config.html'),
        chunks: ['config'],
        filename: 'config.html',
      })
    );
  }

  return config;
};
