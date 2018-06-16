#!/usr/bin/env node

const program = require('commander')
const chalk = require('chalk')
const runAndroid = require('./android')
const runIOS = require('./ios.js')
// const runWeb = require('../src/run/Web')

program
  .usage('<platform> [options]')
  .option('-c, --config [path]', 'specify the configuration file')
  .option('-C, --clean','clean project before build android app')
  .parse(process.argv)

function printExample() {
  console.log('  Examples:')
  console.log()
  console.log(chalk.grey('    # run weex Android project'))
  console.log('    $ ' + chalk.blue('weexpack run android'))
  console.log()
  console.log(chalk.grey('    # run weex iOS project'))
  console.log('    $ ' + chalk.blue('weexpack run ios'))
  console.log()
  console.log(chalk.grey('    # run weex web'))
  console.log('    $ ' + chalk.blue('weexpack run web'))
  console.log()
}

program.on('--help', printExample)

function isValidPlatform(args) {
  if (args && args.length) {
    return args[0] === 'android' || args[0] === 'ios' || args[0] === 'web'
  }
  return false
}

/**
 * Run weex app on the specific platform
 * @param {String} platform
 */
function run(platform, options) {
  switch (platform) {
    case 'android' : runAndroid(options); break;
    case 'ios' : runIOS(options); break;
     
  }
}

// check if platform exist
if (program.args.length < 1) {
  program.help()
  process.exit()
}

if (isValidPlatform(program.args)) {
  // TODO: parse config file
  run(program.args[0], {configPath:program.config,clean:program.clean})

} else {
  console.log()
  console.log(`${chalk.red('Unknown platform:')} ${chalk.yellow(program.args[0])}`)
  console.log()
  printExample()
  process.exit()
}
