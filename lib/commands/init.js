var fs = require('fs'),
  path = require('path'),
  ora = require('ora'),
  fse = require('fs-extra'),
  download = require('download-git-repo'),
  inquirer = require('inquirer'),

  exists = require('fs').existsSync,
  rm = require('rimraf').sync,

  gulpServer = require('./server/gulpfile'),
  argv = require('yargs').argv,
  print = require('../../utils/print'),
  Config = require('../../utils/config'),
  logger = require('../../utils/logger'),

  shell = require('shelljs');

var config = {
  name: 'init',
  explain: 'generate aros template.',
  command: 'aros init',
  options: [{
    keys: ['-h', '--help'],
    describe: 'read help.'
  }]
}

function helpTitle() {
  print.title(config)
}

function helpCommand() {
  print.command(config)
}

var questions = [{
  type: 'input',
  name: 'name',
  default: function () {
    return 'aros-demo';
  },
  message: "Input project/app's name.",
  validate: function (value) {
    var pass = value.match(/^[0-9a-z\-_]+$/i);
    if (pass) {
      return true;
    }

    return 'Your input contain illegal character, please try again.';
  }

}, {
  type: 'input',
  name: 'version',
  default: function () {
    return '1.0.0';
  },
  message: "Input init version?",
  validate: function (value) {
    var pass = value.match(/^\d{1,2}\.\d{1,2}\.\d{1,2}$/);
    if (pass) {
      return true;
    }
    return 'Your input contain illegal character, please try again.';
  }
}, {
  type: 'input',
  name: 'applicationID',
  default: function () {
    return 'com.lfg.weex';
  },
  message: "Input init android application id?",
  validate: function (value) {
    var pass = value.match(/^[a-z\.]+$/);
    if (pass) {
      return true;
    }
    return 'Your input contain illegal character, please try again.';
  }
}]

const TEMPLATE = 'aros-template'
function create() {
  inquirer.prompt(questions).then(function (answers) {
    let _answers = JSON.parse(JSON.stringify(answers))

    let { name, version, applicationID } = _answers

    const spinner = ora('downloading template'),
      tmp = path.resolve(process.cwd(), name)

    spinner.start();
    if (exists(tmp)) rm(tmp);
    download(`yangguangqishimi/${TEMPLATE}`, tmp, function (err) {
      spinner.stop()

      if (err) logger.fatal('Failed to download repo ' + TEMPLATE + ': ' + err.message.trim())
      changeFile(tmp + '/package.json', `${TEMPLATE}-name`, name)

      changeFile(tmp + '/config/eros.native.js', `${TEMPLATE}-name`, name)
      changeFile(tmp + '/config/eros.native.js', `${TEMPLATE}-version`, version)
      changeFile(tmp + '/platforms/android/WeexFrameworkWrapper/gradle.properties', 'com.lfg.weex', applicationID)

      changeFile(tmp + '/platforms/android/WeexFrameworkWrapper/app/src/main/AndroidManifest.xml', 'com.lfg.weex', applicationID)
      changePackageName([tmp + '/platforms/android/WeexFrameworkWrapper/app/src'], 'com.lfg.weex', applicationID)

      logger.sep()
      logger.success('Generated "%s".', name)
      logger.sep()
      logger.success('Run flowing code to get started.')
      logger.log('1. cd %s', name)
      logger.log('2. npm install')
      logger.log('3. aros dev')
    })
  });
};


function run() {
  if (argv.h || argv.help) {
    helpCommand();
  } else {
    create();
  }
}

function changePackageName(paths, oldName, newName) {
  if (!(paths instanceof Array)) return;
  paths.map(path_str => {
    const oldArr = oldName.split('.');
    const newArr = newName.split('.');
    const arr = []
    findDirs(path_str, oldArr, arr, false);
    console.log(arr);
    for (const file of arr) {
      const rootPath = file.substr(0, file.length - oldArr.join('/').length);
      shell.mkdir(path.join(rootPath, 'tmp'));
      shell.mv(path.join(file, '*'), path.join(rootPath, 'tmp'));
      shell.rm('-rf', path.join(rootPath, oldArr[0]));
      // 遍历tmp，替换oldname
      const files = shell.find(path.join(rootPath, 'tmp'));
      files.map(filename => {
        changeFile(filename, oldName, newName);
      })
      shell.mkdir('-p', path.join(rootPath, ...newArr));
      shell.mv(path.join(rootPath, 'tmp', '*'), path.join(rootPath, ...newArr));
      shell.rm('-rf', path.join(rootPath, 'tmp'));
    }
  })
}
/**
 * 文件遍历方法
 * @param filePath 需要遍历的文件路径
 */
function findDirs(filePath, names, arr, start) {
  //根据文件路径读取文件，返回文件列表
  const files = fs.readdirSync(filePath);
  for (const filename of files) {
    var filedir = path.join(filePath, filename);
    var stat = fs.statSync(filedir);
    if (stat.isDirectory()) {
      if (filename === names[0]) {
        if (names.length === 1) {
          return arr.push(filedir);
        } else {
          findDirs(filedir, names.slice(1), arr, true)
        }
      } else {
        !start && findDirs(filedir, names, arr, false); //递归，如果是文件夹，就继续遍历该文件夹下面的文件
      }
    }
  }
}

function changeFile(path, oldText, newText) {
  if (!fs.existsSync(path)) return;
  if (fs.statSync(path).isDirectory()) return;
  var result = fs.readFileSync(path, 'utf8').replace(new RegExp(oldText, "g"), newText);
  if (result) {
    fs.writeFileSync(path, result, 'utf8');
  }
};

module.exports = {
  run: run,
  config: config,
  helpTitle: helpTitle,
  helpCommand: helpCommand
}