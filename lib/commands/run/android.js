const path = require('path')
const chalk = require('chalk')
const child_process = require('child_process')
const fs = require('fs')
const inquirer = require('inquirer')
const copy = require('recursive-copy')
const utils = require('../utils')
const startJSServer = require('./server')
const {Config,androidConfigResolver} = require('../utils/config')
/**
 * Build and run Android app on a connected emulator or device
 * @param {Object} options
 */
function runAndroid(options) {
  console.log(` => ${chalk.blue.bold('npm install&build')}`)
  utils.buildJS()
   
      .then(()=>{
        var dir=options.dir;
      return utils.exec('weexplus install '+options.dir)
    })
    .then(()=> {
      // startJSServer()
      return {options}
    })
    .then(prepareAndroid)
    // .then(resolveConfig)
    .then(findAndroidDevice)
    .then(chooseDevice)
    .then(reverseDevice)
    .then(buildApp)
    .then(installApp)
    .then(runApp)
    .catch((err) => {
      if (err) {
        console.log(chalk.red('Error:', err));
      }
    })
}

function publish(options)
{
    utils.buildJS()
   
      .then(()=>{
        var dir=options.dir;
      return utils.exec('weexplus install ')
    })
    .then(()=> {
      // startJSServer()
      return {options}
    })
    .then(prepareAndroid)
    .then(buildApp)
    .then(()=>{

        var path=  process.cwd();
        console.log(path)
          var open=require('open')
          open(path+'/app/build/outputs/apk')
    })

}

/**
 * Prepare
 * @param {Object} options
 */
function prepareAndroid({options}) {
  return new Promise((resolve, reject) => {
    const rootPath = process.cwd()

    if (!utils.checkAndroid(rootPath,options.dir)) {
      console.log(rootPath)
      console.log(chalk.red('  Android project not found !'))
      console.log()
      console.log(`  You should run ${chalk.blue('weexpack create')} or ${chalk.blue('weexpack platform add android')}  first`)
      reject()
    }

    console.log()
    console.log(` => ${chalk.blue.bold('Will start Android app')}`)

    // change working directory to android
    process.chdir(path.join(rootPath, 'platforms/android/'+options.dir))
     // console.log(process.env)
    // if (!process.env.ANDROID_HOME) {
    //   console.log()
    //   console.log(chalk.red('  Environment variable $ANDROID_HOME not found !'))
    //   console.log()
    //   console.log(`  You should set $ANDROID_HOME first.`)
    //   console.log(`  See ${chalk.cyan('http://stackoverflow.com/questions/19986214/setting-android-home-enviromental-variable-on-mac-os-x')}`)
    //   reject()
    // }

    // try {
    //   child_process.execSync(`adb kill-server`, {encoding: 'utf8'})
    // } catch (e) {
    //   reject()
    // }
    // try {
    //   child_process.execSync(`adb start-server`, {encoding: 'utf8'})
    // } catch (e) {
    //   reject()
    // }

  try {
    child_process.execSync(`adb start-server`, {encoding: 'utf8'})
  } catch (e) {
    reject()
  }
  try {
    child_process.execSync(`adb devices`, {encoding: 'utf8'})
  } catch (e) {
    reject()
  }
    resolve({options, rootPath})
  })
}
function resolveConfig({options,rootPath}) {
  let androidConfig = new Config(androidConfigResolver, path.join(rootPath, 'android.config.json'));
  return androidConfig.getConfig().then((config) => {
    androidConfigResolver.resolve(config);
    return {options, rootPath};
  })
}
/**
 * find android devices
 * @param {Object} options
 */
function findAndroidDevice({options}) {
  return new Promise((resolve, reject) => {
    let devicesInfo = ''
    try {
      devicesInfo = child_process.execSync(`adb devices`, {encoding: 'utf8'})
    } catch (e) {
      console.log(chalk.red(`adb devices failed, please make sure you have adb in your PATH.`))
      console.log(`See ${chalk.cyan('http://stackoverflow.com/questions/27301960/errorunable-to-locate-adb-within-sdk-in-android-studio')}`)
      reject()
    }

    let devicesList = utils.parseDevicesResult(devicesInfo)

    resolve({devicesList, options})
  })
}

/**
 * Choose one device to run
 * @param {Array} devicesList: name, version, id, isSimulator
 * @param {Object} options
 */
function chooseDevice({devicesList, options}) {
  return new Promise((resolve, reject) => {
    if (devicesList && devicesList.length > 1) {
      const listNames = [new inquirer.Separator(' = devices = ')]
      for (const device of devicesList) {
        listNames.push(
          {
            name: `${device}`,
            value: device
          }
        )
      }

      inquirer.prompt([
          {
            type: 'list',
            message: 'Choose one of the following devices',
            name: 'chooseDevice',
            choices: listNames
          }
        ])
        .then((answers) => {
          const device = answers.chooseDevice
          resolve({device, options})
        })
    } else if (devicesList.length == 1) {
      resolve({device: devicesList[0], options})
    }
    else {
      reject('No android devices found.')
    }
  })
}

/**
 * Adb reverse device, allow device connect host network
 * @param {String} device
 * @param {Object} options
 */
function reverseDevice({device, options}) {
  return new Promise((resolve, reject) => {
    try {
      let s = child_process.execSync(`adb -s ${device} reverse tcp:8080 tcp:8080`, {encoding: 'utf8'})
    } catch (e) {
      console.error('reverse error[ignored]');
      resolve({device, options})
    }

    resolve({device, options})
  })
}

/**
 * Build the Android app
 * @param {String} device
 * @param {Object} options
 */
function buildApp({device, options}) {
  return new Promise((resolve, reject) => {
    console.log(` => ${chalk.blue.bold('Building app ...')}`)
 const rootPath = process.cwd()
    console.log('build='+rootPath)
    let clean = options.clean ? ' clean' : '';
    try {
      child_process.execSync(process.platform === 'win32' ? `call gradlew.bat${clean} assemble` : `./gradlew${clean} assemble`, {
        encoding: 'utf8',
        stdio: [0, 1, 2]
      })
    } catch (e) {
      reject()
    }

    resolve({device, options})
  })
}

/**
 * Install the Android app
 * @param {String} device
 * @param {Object} options
 */
function installApp({device, options}) {
  return new Promise((resolve, reject) => {
    console.log(` => ${chalk.blue.bold('Install app ...')}`)
    const rootPath = process.cwd()
    // console.log(rootPath)
    const apkName =rootPath+'/app/build/outputs/apk/app-debug.apk'
    console.log(chalk.green('=============================================='));
    console.log(chalk.green('=============================================='));
    console.log(chalk.green("apk输出目录："+rootPath+'/app/build/outputs/apk'));
    console.log(chalk.green('=============================================='));
    console.log(chalk.green('=============================================='));

    try {
      child_process.execSync(`adb -s ${device} install -r  ${apkName}`, {encoding: 'utf8'})
    } catch (e) {
      reject()
    }

    resolve({device, options})
  })
}

/**
 * Run the Android app on emulator or device
 * @param {String} device
 * @param {Object} options
 */
function runApp({device, options}) {
  return new Promise((resolve, reject) => {
    console.log(` => ${chalk.blue.bold('Running app ...')}`)
    const rootPath = process.cwd()
    console.log(rootPath)
    const packageName = fs.readFileSync(
      'app/src/main/AndroidManifest.xml',
      'utf8'
    ).match(/package="(.+?)"/)[1]


    try {
      child_process.execSync(`adb -s ${device} shell am start -n ${packageName}/com.farwolf.weex.activity.SplashActivity_`, {encoding: 'utf8'})
    } catch (e) {
      reject(e)
    }

    resolve()
  })
}

module.exports = {runAndroid,publish}