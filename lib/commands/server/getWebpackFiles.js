const path = require('path');
const fs = require('fs-extra');
const readConfig = require('../../../utils/readConfig');
const isWin = /^win/.test(process.platform);
const SUPPORT_FILES = ['vue', 'js'];

function resolve(relativePath) {
  return path.join(process.cwd(), relativePath)
}

function getEntry() {
  var entryMap = {};
  const exportsPath = readConfig.get('exports')
  exportsPath && exportsPath.map(item => {
    var arr = item.split('.');
    let extname = arr.length > 0 && arr[arr.length - 1];
    let entry = extname === 'vue' ? '?entry=true' : '';

    if (SUPPORT_FILES.indexOf(extname) > -1) {
      entryMap[arr[0]] = path.join(process.cwd(), '/src', item + entry);
    }
  });
  return entryMap;
}
function getWebEntry() {
  var entryMap = {};
  const exportsPath = readConfig.get('exports')
  exportsPath && exportsPath.map(item => {
    var arr = item.split('.');
    let filepath = resolve('src/' + item);
    if (isWin) {
      filepath = filepath.replace(/\\/g, '\\\\');
    }
    let contents = '';
    contents += `    weex.init(Vue) \n\n
    const App = require('${filepath}');\n
    new Vue(Vue.util.extend({el: '#root'}, App));\n`;

    fs.outputFileSync(resolve('.temp/' + arr[0] + '.js'), contents, 'utf-8');
    entryMap[arr[0]] = resolve('.temp/' + arr[0] + '.js');
  });
  const webConfig = readConfig.get('webConfig');
  let relativePluginPath = resolve(webConfig.pluginFilePath);
  if (isWin) {
    relativePluginPath = relativePluginPath.replace(/\\/g, '\\\\');
  }
  const hasPluginInstalled = fs.existsSync(resolve(webConfig.pluginFilePath));
  if (hasPluginInstalled) {
    let contents = '';
    contents += `\n// If detact plugins/plugin.js is exist, import and the plugin.js\n`;
    contents += `import plugins from '${relativePluginPath}';\n`;
    contents += `plugins.forEach(function (plugin) {\n\tweex.install(plugin)\n});\n\n`;
    fs.outputFileSync(resolve('.temp/plugin.js'), contents, 'utf-8');
    entryMap['plugin'] = resolve('.temp/plugin.js');
  }
  return entryMap;
}


function getAlias() {
  let aliasMap = {};
  let alias = readConfig.get('alias');
  for (const i in alias) {
    aliasMap[i] = path.join(process.cwd(), 'src', alias[i]);
  }
  return aliasMap;
}

// getWebEntry()

module.exports = {
  getAlias,
  getWebEntry,
  getEntry
}
