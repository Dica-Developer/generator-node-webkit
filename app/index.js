/*global require*/
'use strict';

var util = require('util');
var path = require('path');
var yeoman = require('yeoman-generator');
var when = require('when');
var http = require('http');
var fs = require('fs-extra');
var url = require('url');
var GitHubApi = require('github');
var DecompressZip = require('decompress-zip');
var tar = require('tar-fs');
var zlib = require('zlib');

var Examples = require('./examples.js');

var NodeWebkitGenerator = module.exports = function NodeWebkitGenerator(args, options) {
  yeoman.generators.Base.apply(this, arguments);

  this.on('end', function () {
    this.installDependencies({
      skipInstall: options['skip-install']
    });
  });

  this.pkg = JSON.parse(this.readFileAsString(path.join(__dirname, '../package.json')));
  this.nodeWebkitVersion = 'v0.9.2';
  this.nodeWebkitBaseUrl = 'http://dl.node-webkit.org/' + this.nodeWebkitVersion + '/node-webkit-' + this.nodeWebkitVersion + '-';
  this.github = false;
};

util.inherits(NodeWebkitGenerator, yeoman.generators.Base);

NodeWebkitGenerator.prototype.welcome = function welcome() {
  if (!this.options['skip-welcome-message']) {
    console.log(this.yeoman);
  }
};

NodeWebkitGenerator.prototype.askForAppName = function askForAppName() {
  var done = this.async();
  var basePath = path.basename(process.env.PWD);
  var appName = this._.camelize(basePath);

  var prompts = [
    {
      name: 'appName',
      message: 'What do you want to call your app? Allowed characters ^[a-zA-Z0-9]+$',
      default: appName,
      validate: function (answer) {
        if (!/^[a-zA-Z0-9]+$/.test(answer)) {
          return 'The application name should only consist of the following characters a-z, A-Z and 0-9.';
        }
        return true;
      }
    }
  ];

  this.prompt(prompts, function (props) {
    this.appName = props.appName;
    done();
  }.bind(this));

};

NodeWebkitGenerator.prototype.askForDescription = function askForDescription() {
  var done = this.async();
  var prompts = [
    {
      name: 'appDescription',
      message: 'A little description for your app?'
    }
  ];

  this.prompt(prompts, function (props) {
    this.appDescription = props.appDescription;
    done();
  }.bind(this));

};

NodeWebkitGenerator.prototype.askForGithubName = function askForGithubName() {
  var done = this.async();
  var prompts = [
    {
      name: 'githubUser',
      message: 'Would you mind telling me your username on GitHub?',
      default: 'someuser'
    }
  ];

  this.prompt(prompts, function (props) {
    this.githubUser = props.githubUser;
    done();
  }.bind(this));
};

NodeWebkitGenerator.prototype.askForInstallNodeWebkit = function askForInstallNodeWebkit() {
  var done = this.async();
  var prompts = [
    {
      type: 'confirm',
      name: 'downloadNodeWebkit',
      message: 'Do you want to download latest node-webkit?',
      default: true
    },
    {
      type: 'checkbox',
      name: 'platforms',
      message: 'Which platform do you wanna support?',
      choices: [
        {
          name: 'MacOS',
          checked: 'darwin' === process.platform
        },
        {
          name: 'Linux 64',
          checked: 'linux' === process.platform
        },
        {
          name: 'Linux 32',
          checked: false
        },
        {
          name: 'Windows',
          checked: 'win32' === process.platform
        }
      ],
      when: function (answers) {
        return answers.downloadNodeWebkit;
      },
      validate: function (answer) {
        if (answer.length < 1) {
          return 'You must choose at least one platform.';
        }
        return true;
      }
    }
  ];

  this.prompt(prompts, function (props) {
    this.platforms = props.platforms;
    this.downloadNodeWebkit = props.downloadNodeWebkit;
    this.MacOS = false;
    this.Linux64 = false;
    this.Windows = false;
    if (props.downloadNodeWebkit) {
      props.platforms.forEach(function (platform) {
        switch (platform) {
        case 'MacOS':
          this.MacOS = true;
          break;
        case 'Linux 64':
          this.Linux64 = true;
        break;
        case 'Linux 32':
          this.Linux32 = true;
          break;
        case 'Windows':
          this.Windows = true;
          break;
        }
      }.bind(this));
    }
    done();
  }.bind(this));
};

NodeWebkitGenerator.prototype.askForInstallExamples = function askForInstallExamples() {
  var done = this.async();
  var prompts = [
    {
      type: 'confirm',
      name: 'installExamples',
      message: 'Do you want to install one of the node-webkit examples?',
      default: false
    }
  ];
  this.prompt(prompts, function (props) {
    this.installExamples = props.installExamples;
    done();
  }.bind(this));

};

NodeWebkitGenerator.prototype.getExampleList = function getExampleList() {
  var done = this.async();
  if (this.installExamples) {
    var prompts = [
      {
        type: 'list',
        name: 'example',
        message: 'Which example do you want to install?',
        choices: []
      }
    ];

    this.examplesAPI = new Examples(this);
    this.log.info('Getting list of available examples.');
    this.examplesAPI.getExampleList()
      .then(function (list) {
        prompts[0].choices = list;

        this.prompt(prompts, function (props) {
          this.example = props.example;
          done();
        }.bind(this));
      }.bind(this));
  } else {
    done();
  }
};


NodeWebkitGenerator.prototype.getGithubUserInfo = function getGithubUserInfo() {
  var done = this.async();
  var _this = this;
  var responseClbk = function (err, responseText) {
    if (err) {
      _this.log.info('Error while fetching github user information.', err);
      _this.log.skip('Skip fetching github user information.');
      done();
    } else {
      var responseObject = JSON.parse(JSON.stringify(responseText));
      _this.log.ok('Github informations successfully retrieved.');
      _this.github = true;
      _this.realname = responseObject.name;
      _this.githubUrl = responseObject.html_url;
      done();
    }
  };

  if (this.githubUser !== 'someuser') {
    var proxy = process.env.http_proxy || process.env.HTTP_PROXY || process.env.https_proxy || process.env.HTTPS_PROXY || null;
    var githubOptions = {
      version: '3.0.0'
    };

    if (proxy) {
      githubOptions.proxy = {};
      githubOptions.proxy.host = url.parse(proxy).hostname;
      githubOptions.proxy.port = url.parse(proxy).port;
    }

    var github = new GitHubApi(githubOptions);
    this.log.info('Get GitHub informations');
    github.user.getFrom({
      user: this.githubUser
    }, responseClbk);
  } else {
    done();
  }
};

NodeWebkitGenerator.prototype.createFolder = function createFolder() {
  this.mkdir('app');
  this.mkdir('app/img');
  this.mkdir('resources/node-webkit');
  if (this.MacOS) {
    this.mkdir('resources/node-webkit/MacOS');
  }
  if (this.Linux64) {
    this.mkdir('resources/node-webkit/Linux64');
  }
  if (this.Windows) {
    this.mkdir('resources/node-webkit/Windows');
  }
  this.mkdir('tmp');
};

NodeWebkitGenerator.prototype.getNodeWebkit = function getNodeWebkit() {
  var done = this.async();

  var successClbk = function () {
    done();
  };
  var failureClbk = function (error) {
    throw error;
  };
  if (this.downloadNodeWebkit) {
    when.all(this._getNodeWebkit()).then(successClbk, failureClbk);
  } else {
    when.all(this._createFolder()).then(successClbk, failureClbk);
  }
};

NodeWebkitGenerator.prototype._createFolder = function _createFolder() {
  var promises = [];
  var basePath = 'resources/node-webkit/';
  var platforms = ['MacOS', 'Linux64', 'Windows'];
  platforms.forEach(function (platform) {
    var defer = when.defer();
    promises.push(defer.promise);
    fs.mkdirs(basePath + '/' + platform, function (err) {
      if (err) {
        defer.reject(err);
      } else {
        defer.resolve();
      }
    });
  });
  return promises;
};

NodeWebkitGenerator.prototype._getNodeWebkit = function _getNodeWebkit() {
  var promises = [];
  if (this.MacOS) {
    promises.push(this._requestNodeWebkit('osx-ia32', '.zip', 'MacOS'));
  }
  if (this.Linux64) {
    promises.push(this._requestNodeWebkit('linux-x64', '.tar.gz', 'Linux64'));
  }
  if (this.Linux32) {
    promises.push(this._requestNodeWebkit('linux-ia32', '.tar.gz', 'Linux32'));
  }
  if (this.Windows) {
    promises.push(this._requestNodeWebkit('win-ia32', '.zip', 'Windows'));
  }
  return promises;
};

NodeWebkitGenerator.prototype._requestNodeWebkit = function _requestNodeWebkit(versionString, extension, platform) {
  var defer = when.defer();
  var _this = this;
  if (!fs.existsSync('tmp/' + platform + extension)) {
    if (fs.existsSync('tmp/' + platform + extension + '.part')) {
      fs.unlinkSync('tmp/' + platform + extension + '.part');
    }
    this.log.info('Downloading node-webkit for ' + platform);
    http.get(this.nodeWebkitBaseUrl + versionString + extension, function (res) {
      if (200 === res.statusCode) {
        res.on('data', function (chunk) {
          fs.appendFileSync('tmp/' + platform + extension + '.part', chunk);
        }).on('end', function () {
          fs.renameSync('tmp/' + platform + extension + '.part', 'tmp/' + platform + extension);
          _this.log.ok('Node-webkit for ' + platform + ' downloaded');
          defer.resolve();
        }).on('error', function (error) {
          _this.log.conflict('Error while downloading node-webkit for ' + platform, error);
          defer.reject(error);
        });
      } else {
        _this.log.conflict('Wrong content type for %s', platform);
        defer.reject('Wrong content type for ' + platform);
      }
    }).on('error', function (error) {
      _this.log.conflict('Error while downloading node-webkit for ' + platform, error);
      defer.reject(error);
    });
  } else {
    this.log.ok('Node-webkit for ' + platform + ' already downloaded');
    defer.resolve();
  }
  return defer.promise;
};

NodeWebkitGenerator.prototype.unzipNodeWebkit = function unzipNodeWebkit() {
  var done = this.async();
  var successClbk = function () {
    done();
  };
  var failureClbk = function (error) {
    throw error;
  };
  when.all(this._unzipNodeWebkit()).then(successClbk, failureClbk);
};

NodeWebkitGenerator.prototype._unzipNodeWebkit = function _unzipNodeWebkit() {
  var promises = [];

  if (this.MacOS) {
    promises.push(this._extract('MacOS', '.zip'));
  }
  if (this.Linux64) {
    promises.push(this._extract('Linux64', '.tar.gz'));
  }
  if (this.Linux32) {
    promises.push(this._extract('Linux32', '.tar.gz'));
  }
  if (this.Windows) {
    promises.push(this._extract('Windows', '.zip'));
  }
  return promises;
};

NodeWebkitGenerator.prototype._extract = function _extract(platform, extension) {
  var _this = this;
  var defer = when.defer();
  if ('.zip' === extension) {
    if (fs.existsSync('tmp/' + platform + extension)) {
      this.log.info('Unzip %s files.', platform);
      var unzipper = new DecompressZip('tmp/' + platform + extension);

      unzipper.on('error', function (error) {
        _this.log.conflict('Error while unzipping "tmp/' + platform + extension + '"', error);
        defer.reject(error);
      });

      unzipper.on('extract', function () {
        _this.log.ok('"tmp/%s.zip" successfully unzipped', platform);
        defer.resolve();
      });

      unzipper.extract({
        path: 'resources/node-webkit/' + platform
      });
    } else {
      defer.resolve();
    }
  } else if ('.tar.gz' === extension) {
    this.log.info('Un.tar.gz %s files.', platform);
    var src = 'tmp/' + platform + extension;
    var dst = 'resources/node-webkit/' + platform;
    fs.createReadStream(src).pipe(zlib.createGunzip()).pipe(tar.extract(dst)).on('finish', function (error) {
      if (!error) {
        var platformSuffix = platform === 'Linux64' ? '-linux-x64' : '-linux-ia32';
        var copyPath = 'resources/node-webkit/' + platform + '/node-webkit-' + _this.nodeWebkitVersion + platformSuffix;
        fs.copy(copyPath, 'resources/node-webkit/' + platform, function (error) {
          if (error) {
            defer.reject(error);
          } else {
            fs.remove(copyPath);
            _this.log.ok('%s directory successfully copied.', platform);
            defer.resolve();
          }
        });
      } else {
        defer.reject(error);
      }
    });
  }
  return defer.promise;
};

NodeWebkitGenerator.prototype.processProjectfiles = function processProjectfiles() {
  this.copy('editorconfig', '.editorconfig');
  this.copy('jshintrc', '.jshintrc');
  this.copy('_bower.json', 'bower.json');
  this.copy('mac/dmgStyler.applescript', 'resources/mac/dmgStyler.applescript');
  this.copy('mac/package.sh', 'resources/mac/package.sh');
  this.copy('mac/background.png', 'resources/mac/background.png');
  this.template('_package.json', 'package.json');
  this.template('_Gruntfile.js', 'Gruntfile.js');
  this.template('mac/_Info.plist.tmp', 'resources/mac/Info.plist.tmp');
  this.template('mac/_Info.plist', 'resources/mac/Info.plist');
};

NodeWebkitGenerator.prototype.processAppFiles = function processAppFiles() {
  var done = this.async();
  if (this.installExamples) {
    this.examplesAPI.downloadAndInstallExamples(this.example)
      .then(function () {
        done();
      });
  } else {
    this.copy('app/_main.css', 'app/css/main.css');
    this.copy('app/_index.js', 'app/js/index.js');
    this.template('app/_package.json', 'app/package.json');
    this.template('app/_index.html', 'app/views/index.html');
    done();
  }
};