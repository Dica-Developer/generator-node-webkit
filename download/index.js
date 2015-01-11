/*global require*/
'use strict';

var yeoman = require('yeoman-generator');
var when = require('when');
var http = require('follow-redirects').http;
var request = require('request');
var fs = require('fs-extra');
var DecompressZip = require('decompress-zip');
var tar = require('tar-fs');
var zlib = require('zlib');

module.exports = yeoman.generators.Base.extend({
  constructor: function() {
    yeoman.generators.Base.apply(this, arguments);
    this.defaultNodeWebkitVersion = 'v0.10.5';
    this.nodeWebkitVersion = 'v0.10.5';
    this.downloadNodeWebkit = true;
  },
  _getDownloadUrl: function() {
    return 'http://dl.node-webkit.org/' + this.nodeWebkitVersion +
      '/node-webkit-' + this.nodeWebkitVersion + '-';
  },
  _getDownloadTmpUrl: function(version) {
    return 'http://dl.node-webkit.org/' + version + '/node-webkit-' +
      version + '-linux-x64.tar.gz';
  },
  askForInstallNodeWebkit: function askForInstallNodeWebkit() {
    var done = this.async();
    var prompts = [{
      type: 'confirm',
      name: 'downloadNodeWebkit',
      message: 'Do you want to download node-webkit?',
      default: true
    }];
    this.prompt(prompts, function(props) {
      this.downloadNodeWebkit = props.downloadNodeWebkit;
      done();
    }.bind(this));

  },
  askForVersion: function askForInstallLatesVersion() {
    var done = this.async(),
      _this = this;
    var prompts = [{
      type: 'input',
      name: 'nodeWebkitVersion',
      message: 'Please specify which version of node-webkit you want download',
      default: _this.defaultNodeWebkitVersion,
      when: function() {
        return _this.downloadNodeWebkit;
      },
      validate: function(answer) {
        var validateDone = this.async(),
          url = _this._getDownloadTmpUrl(answer);

        _this.log.info('Check if version "' + answer +
          '" is available for download.');
        request.head(url, function(error, response) {
          if (error) {
            _this.log.conflict(error);
          }
          if (response.statusCode === 200) {
            _this.log.ok('Use version "' + answer + '".');
            validateDone(true);
          } else {
            validateDone('No download url found for version "' +
              answer + '"!');
          }
        });
      }
    }];

    this.prompt(prompts, function(props) {
      this.nodeWebkitVersion = props.nodeWebkitVersion;
      done();
    }.bind(this));
  },
  askForPlatform: function askForPlatform() {
    var done = this.async(),
      _this = this,
      prompts = [{
        type: 'checkbox',
        name: 'platforms',
        message: 'Which platform do you wanna support?',
        choices: [{
          name: 'MacOS 32',
          checked: 'darwin' === process.platform
        }, {
          name: 'MacOS 64',
          checked: false
        }, {
          name: 'Linux 64',
          checked: 'linux' === process.platform
        }, {
          name: 'Linux 32',
          checked: false
        }, {
          name: 'Windows',
          checked: 'win32' === process.platform
        }],
        when: function() {
          return _this.downloadNodeWebkit;
        },
        validate: function(answer) {
          if (answer.length < 1) {
            return 'You must choose at least one platform.';
          }
          return true;
        }
      }];

    this.prompt(prompts, function(props) {
      _this.platforms = props.platforms;
      _this.MacOS32 = false;
      _this.MacOS64 = false;
      _this.Linux64 = false;
      _this.Windows = false;
      if (_this.downloadNodeWebkit) {
        _this.platforms.forEach(function(platform) {
          switch (platform) {
            case 'MacOS 32':
              _this.MacOS32 = true;
              break;
            case 'MacOS 64':
              _this.MacOS64 = true;
              break;
            case 'Linux 64':
              _this.Linux64 = true;
              break;
            case 'Linux 32':
              _this.Linux32 = true;
              break;
            case 'Windows':
              _this.Windows = true;
              break;
          }
        });
      }
      done();
    });
  },
  createFolder: function createFolder() {
    this.log.info('Creating folder structure for node-webkit source.');
    this.mkdir('resources/node-webkit');
    this.log.ok('Created: "resources/node-webkit"');
    if (this.MacOS32) {
      this.mkdir('resources/node-webkit/MacOS32');
      this.log.ok('Created: "resources/node-webkit/MacOS32"');
    }
    if (this.MacOS64) {
      this.mkdir('resources/node-webkit/MacOS64');
      this.log.ok('Created: "resources/node-webkit/MacOS64"');
    }
    if (this.Linux64) {
      this.mkdir('resources/node-webkit/Linux64');
      this.log.ok('Created: "resources/node-webkit/Linux64"');
    }
    if (this.Linux32) {
      this.mkdir('resources/node-webkit/Linux32');
      this.log.ok('Created: "resources/node-webkit/Linux32"');
    }
    if (this.Windows) {
      this.mkdir('resources/node-webkit/Windows');
      this.log.ok('Created: "resources/node-webkit/Windows"');
    }
    this.mkdir('tmp');
    this.log.ok('Created: "tmp"');
  },
  getNodeWebkit: function getNodeWebkit() {
    var done = this.async();

    var successClbk = function() {
      done();
    };
    var failureClbk = function(error) {
      throw error;
    };
    if (this.downloadNodeWebkit) {
      when.all(this._getNodeWebkit()).then(successClbk, failureClbk);
    } else {
      successClbk();
    }
  },
  _getNodeWebkit: function _getNodeWebkit() {
    var promises = [];
    if (this.MacOS32) {
      promises.push(this._requestNodeWebkit('osx-ia32', '.zip', 'MacOS32'));
    }
    if (this.MacOS64) {
      promises.push(this._requestNodeWebkit('osx-x64', '.zip', 'MacOS64'));
    }
    if (this.Linux64) {
      promises.push(this._requestNodeWebkit('linux-x64', '.tar.gz',
        'Linux64'));
    }
    if (this.Linux32) {
      promises.push(this._requestNodeWebkit('linux-ia32', '.tar.gz',
        'Linux32'));
    }
    if (this.Windows) {
      promises.push(this._requestNodeWebkit('win-ia32', '.zip', 'Windows'));
    }
    return promises;
  },
  _requestNodeWebkit: function _requestNodeWebkit(versionString, extension,
    platform) {
    var defer = when.defer(),
      _this = this;

    if (!fs.existsSync('tmp/' + platform + extension)) {
      if (fs.existsSync('tmp/' + platform + extension + '.part')) {
        fs.unlinkSync('tmp/' + platform + extension + '.part');
      }
      this.log.info('Downloading node-webkit for ' + platform);
      http.get(this._getDownloadUrl() + versionString + extension,
        function(res) {
          if (200 === res.statusCode) {
            res.on('data', function(chunk) {
              fs.appendFileSync('tmp/' + platform + extension +
                '.part', chunk);
            }).on('end', function() {
              fs.renameSync('tmp/' + platform + extension + '.part',
                'tmp/' + platform + extension);
              _this.log.ok('Node-webkit for ' + platform +
                ' downloaded');
              defer.resolve();
            }).on('error', function(error) {
              _this.log.conflict(
                'Error while downloading node-webkit for ' +
                platform, error);
              defer.reject(error);
            });
          } else {
            _this.log.conflict('Wrong content type for %s', platform);
            defer.reject('Wrong content type for ' + platform);
          }
        }).on('error', function(error) {
        _this.log.conflict('Error while downloading node-webkit for ' +
          platform, error);
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
    var successClbk = function() {
      done();
    };
    var failureClbk = function(error) {
      throw error;
    };
    if (this.downloadNodeWebkit) {
      when.all(this._unzipNodeWebkit()).then(successClbk, failureClbk);
    } else {
      done();
    }
  },
  _unzipNodeWebkit: function _unzipNodeWebkit() {
    var promises = [];

    if (this.MacOS32) {
      promises.push(this._extract('MacOS32', '.zip'));
    }
    if (this.MacOS64) {
      promises.push(this._extract('MacOS64', '.zip'));
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

        unzipper.on('error', function(error) {
          _this.log.conflict('Error while unzipping "tmp/' + platform +
            extension + '"', error);
          defer.reject(error);
        });

        unzipper.on('extract', function() {
          _this.log.ok('"tmp/%s.zip" successfully unzipped', platform);
          defer.resolve();
        });

        var stripLevel = 0;
        if ('MacOS64' === platform || this.nodeWebkitVersion.indexOf(
            'v0.9.') === -1 && this.nodeWebkitVersion.indexOf('v0.8.') ===
          -1) {
          stripLevel = 1;
        }
        unzipper.extract({
          path: 'resources/node-webkit/' + platform,
          strip: stripLevel
        });
      } else {
        defer.resolve();
      }
    } else if ('.tar.gz' === extension) {
      this.log.info('Un.tar.gz %s files.', platform);
      var src = 'tmp/' + platform + extension;
      var dst = 'resources/node-webkit/' + platform;
      fs.createReadStream(src).pipe(zlib.createGunzip()).pipe(tar.extract(
        dst)).on('finish', function(error) {
        if (!error) {
          var platformSuffix = platform === 'Linux64' ? '-linux-x64' :
            '-linux-ia32';
          var copyPath = 'resources/node-webkit/' + platform +
            '/node-webkit-' + _this.nodeWebkitVersion +
            platformSuffix;
          fs.copy(copyPath, 'resources/node-webkit/' + platform,
            function(error) {
              if (error) {
                defer.reject(error);
              } else {
                fs.remove(copyPath);
                _this.log.ok('%s directory successfully copied.',
                  platform);
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
