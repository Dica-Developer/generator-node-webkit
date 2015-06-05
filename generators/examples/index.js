'use strict';

//  Dependencies
var yeoman = require('yeoman-generator'),
  GitHubApi = require('github'),
  DecompressZip = require('decompress-zip'),
  request = require('request'),
  fs = require('fs'),
  fsExtra = require('fs-extra'),
  url = require('url'),
  inquirer = require('inquirer'),
  optionOrPrompt = require('yeoman-option-or-prompt');

require('chalk');

// Local
var progressMessage = [
    '[' + '='.red + '---------]',
    '[-' + '='.red + '--------]',
    '[--' + '='.red + '-------]',
    '[---' + '='.red + '------]',
    '[----' + '='.red + '-----]',
    '[-----' + '='.red + '----]',
    '[------' + '='.red + '---]',
    '[-------' + '='.red + '--]',
    '[--------' + '='.red + '-]',
    '[---------' + '='.red + ']',
    '[--------' + '='.red + '-]',
    '[-------' + '='.red + '--]',
    '[------' + '='.red + '---]',
    '[-----' + '='.red + '----]',
    '[----' + '='.red + '-----]',
    '[---' + '='.red + '------]',
    '[--' + '='.red + '-------]',
    '[-' + '='.red + '--------]'
  ],
  proxy = process.env.http_proxy || process.env.HTTP_PROXY || process.env.https_proxy || process.env.HTTPS_PROXY || null,
  githubOptions = {
    version: '3.0.0'
  };

if (proxy) {
  githubOptions.proxy = {};
  githubOptions.proxy.host = url.parse(proxy).hostname;
  githubOptions.proxy.port = url.parse(proxy).port;
}

var github = new GitHubApi(githubOptions);
var EXAMPLE_DOWNLOAD_URL = 'https://github.com/zcbenz/nw-sample-apps/archive/master.zip';

module.exports = yeoman.generators.Base.extend({
  exampleList: [],
  EXAMPLES_ZIP_DESTINATION_PATH: '',
  EXAMPLES_EXTRACT_DESTINATION_PATH: '',

  _optionOrPrompt: optionOrPrompt,

  initializing: {
    setup: function () {
      this.EXAMPLES_ZIP_DESTINATION_PATH = this.destinationPath('tmp/node-webkit-examples.zip');
      this.EXAMPLES_EXTRACT_DESTINATION_PATH = this.destinationRoot();
      this.EXAMPLES_PATH = 'nw-sample-apps-master';
      fsExtra.ensureDirSync(this.destinationPath('tmp'));
    },
    fetchExamplesList: function () {
      var done = this.async(),
        exampleListReducer = function (exampleList, treeEntry) {
          if ('tree' === treeEntry.type) {
            exampleList.push(treeEntry.path);
          }
          return exampleList;
        },
        githubCallback = function (err, resp) {
          this.exampleList = resp.tree.reduce(exampleListReducer, []);
          this.exampleList.push('Continue without an example')
          done();
        };

      github.gitdata.getTree({
        'user': 'zcbenz',
        'repo': 'nw-sample-apps',
        'sha': 'master'
      }, githubCallback.bind(this));
    }
  },
  prompting: function () {
    var done = this.async(),
      prompts = [{
        type: 'list',
        name: 'exampleName',
        message: 'Which example do you want to install?',
        choices: this.exampleList,
        save: true,
        default: this.options.defaults.exampleName,
        when: function () {
          return !this.options.acceptDefaults;
        }.bind(this)
      }];

    this._optionOrPrompt(prompts, function (props) {
      this.exampleName = props.exampleName || this.options.defaults.exampleName;
      done();
    }.bind(this));
  },

  download: function () {
    var self = this,
      done = this.async(),
      log = this.log.write(),
      dowloadCount, bottomBar, writeStream;

    if (this.exampleName !== 'Continue without an example') {
      if (fs.existsSync(this.EXAMPLES_ZIP_DESTINATION_PATH)) {
        log.ok('Examples already downloaded. Skip to next step.');
        done();
        return;
      }

      dowloadCount = 18;
      bottomBar = new inquirer.ui.BottomBar();
      writeStream = fs.createWriteStream(this.EXAMPLES_ZIP_DESTINATION_PATH);

      request
        .get(EXAMPLE_DOWNLOAD_URL)
        .on('error', function (err) {
          self.log.conflict(err);
        })
        .on('data', function () {
          var currentProgressIndex = (dowloadCount++ % 18),
            currentProgressMessage = progressMessage[currentProgressIndex];

          bottomBar.updateBottomBar(currentProgressMessage + ' Fetching ' + EXAMPLE_DOWNLOAD_URL);
        })
        .pipe(writeStream);


      writeStream.on('finish', function () {
        bottomBar.updateBottomBar('').close();
        log.write().ok('Done in ' + self.EXAMPLES_ZIP_DESTINATION_PATH).write();
        done();
      });
    } else {
      done();
    }
  },

  unzip: function () {
    var done = this.async(),
      unzipper = new DecompressZip('tmp/node-webkit-examples.zip'),
      log = this.log.write(),
      dowloadCount, bottomBar;

    if (this.exampleName !== 'Continue without an example') {
      if (fs.existsSync(this.EXAMPLES_EXTRACT_DESTINATION_PATH + '/' + this.EXAMPLES_PATH)) {
        log.ok('Examples already extracted. Skip to next step.');
        done();
        return;
      }

      dowloadCount = 18;
      bottomBar = new inquirer.ui.BottomBar();

      unzipper.on('data', function () {
        var currentProgressIndex = (dowloadCount++ % 18),
          currentProgressMessage = progressMessage[currentProgressIndex];

        bottomBar.updateBottomBar(currentProgressMessage + ' Unzipping ' + this.EXAMPLES_EXTRACT_DESTINATION_PATH);
      });

      unzipper.on('error', function (error) {
        this.log.conflict('Error while unzipping "tmp/node-webkit-examples.zip"', error);
        bottomBar.updateBottomBar('').close();
      }.bind(this));

      unzipper.on('extract', function () {
        bottomBar.updateBottomBar('').close();
        log.write().ok('Done unzipping examples.').write();
        done();
      }.bind(this));

      unzipper.extract({
        path: this.EXAMPLES_EXTRACT_DESTINATION_PATH
      });
    } else {
      done()
    }
  },

  installExample: function () {
    var done = this.async(),
      exampleSourcePath = this.destinationPath(this.EXAMPLES_PATH + '/' + this.exampleName);

    if (this.exampleName !== 'Continue without an example') {
      fsExtra.copy(exampleSourcePath, this.destinationPath('app'), function (error) {
      if (error) {
        this.log.conflict(error);
      }

      done();
      }.bind(this));
    } else {
      done();
    }
  }
});
