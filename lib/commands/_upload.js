var argv = require('yargs').argv,
    inquirer = require('inquirer'),
    print = require('../../utils/print'),
    // gulpServer = require('./server/gulpfile.js'),
    readSyncByRl = require('./util').readSyncByRl,
    logger = require('../../utils/logger'),
    upload = require('../../utils/weex/upload'),
    shell = require('shelljs'),
    readConfig = require('../../utils/readConfig'),
    version = readConfig.get('version'),
    versionCode = readConfig.get('arosNativeJs')['versionCode'];

var config = {
    name: 'upload',
    explain: 'upload app install package to server.',
    command: 'aros upload',
    options: [{
        keys: ['-h', '--help'],
        describe: 'read help'
    }, {
        keys: ['--ios'],
        describe: 'pack full dose zip and send to aros ios platform.'
    }, {
        keys: ['--android'],
        describe: 'pack full dose zip and send to aros android platform.'
    }, {
        keys: ['--all'],
        describe: 'pack full dose zip and send to aros android and ios platform.'
    }]
}

function helpTitle() {
    print.title(config)
}

function helpCommand() {
    print.command(config)
}

var questions = [{
    type: 'list',
    name: 'platform',
    message: 'what kind of platform you want to pack?',
    choices: [{
        name: "ios",
        value: "ios"
    }, {
        name: "android",
        value: "android"
    }, ]
}]

var packContainer = {
    select: select,
    ios: function() {
        // gulpServer.start('upload:ios');
    },
    android: function() {
        
        // 复制apk
        shell.cp('platforms/android/WeexFrameworkWrapper/app/build/outputs/apk/samplechannel/debug/app-samplechannel-debug.apk', `app/solarApp/android/${version.android}_${versionCode.android}.apk`)

        var timer = setInterval(() => {
            process.stdout.write('.');
        },500)
        upload.uploadAppZip().then(() => {
            clearInterval(timer)
        })
    },
    all: function() {
        // gulpServer.start('upload:all');
    }
}

function select() {
    inquirer.prompt(questions).then(function(answers) {
        var platform = JSON.parse(JSON.stringify(answers)).platform;
        packContainer[platform] && packContainer[platform]();
    }, (error) => {
        logger.fatal('input error'.red)
        logger.fatal(error)
    });
}

function run() {
    if (argv.h || argv.help) {
        helpCommand();
        return
    }

    if (argv.ios) {
        packContainer.ios()
    } else if (argv.android) {
        packContainer.android()
    } else if (argv.all) {
        packContainer.all()
    } else {
        packContainer.android()
    }
}

module.exports = {
    run: run,
    config: config,
    helpTitle: helpTitle,
    helpCommand: helpCommand
}
