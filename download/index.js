/*global require*/
'use strict';

var yeoman = require('yeoman-generator');
var when = require('when');
var http = require('http');
var fs = require('fs-extra');
var DecompressZip = require('decompress-zip');
var tar = require('tar-fs');
var zlib = require('zlib');

module.exports = yeoman.generators.Base.extend({
  constructor: function () {
    yeoman.generators.Base.apply(this, arguments);
    this.nodeWebkitVersion = 'v0.10.0';
    this.downloadNodeWebkit = true;
  },
  _getDownloadUrl: function(){
    return 'http://dl.node-webkit.org/' + this.nodeWebkitVersion + '/node-webkit-' + this.nodeWebkitVersion + '-';
  },
  askForInstallNodeWebkit: function askForInstallNodeWebkit() {
    var done = this.async();
    var prompts = [
      {
        type: 'confirm',
        name: 'downloadNodeWebkit',
        message: 'Do you want to download node-webkit?',
        default: true
      }
    ];
    this.prompt(prompts, function (props) {
      this.downloadNodeWebkit = props.downloadNodeWebkit;
      done();
    }.bind(this));

  },
  askForVersion: function askForAppName() {
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
  },
  createFolder: function createFolder() {
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
  },
  getNodeWebkit: function getNodeWebkit() {
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
  },
  _createFolder: function _createFolder() {
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
  },
  _getNodeWebkit: function _getNodeWebkit() {
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
  },
  _requestNodeWebkit: function _requestNodeWebkit(versionString, extension, platform) {
    var defer = when.defer();
    var _this = this;
    if (!fs.existsSync('tmp/' + platform + extension)) {
      if (fs.existsSync('tmp/' + platform + extension + '.part')) {
        fs.unlinkSync('tmp/' + platform + extension + '.part');
      }
      this.log.info('Downloading node-webkit for ' + platform);
      http.get(this._getDownloadUrl() + versionString + extension, function (res) {
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
  },
  unzipNodeWebkit: function unzipNodeWebkit() {
    var done = this.async();
    var successClbk = function () {
      done();
    };
    var failureClbk = function (error) {
      throw error;
    };
    when.all(this._unzipNodeWebkit()).then(successClbk, failureClbk);
  },
  _unzipNodeWebkit: function _unzipNodeWebkit() {
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
  },
  _extract: function _extract(platform, extension) {
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
  }
});