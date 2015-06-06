'use strict';

//  Dependencies
var yeoman = require('yeoman-generator'),
  semver = require('semver'),
  request = require('request'),
  fs = require('fs'),
  optionOrPrompt = require('yeoman-option-or-prompt');

// Local
var PLATFORMS_MAP = {
    'MacOS32': 'osx-ia32.zip',
    'MacOS64': 'osx-x64.zip',
    'Linux32': 'linux-ia32.tar.gz',
    'Linux64': 'linux-x64.tar.gz',
    'Windows32': 'win-ia32.zip'
  };

module.exports = yeoman.generators.Base.extend({
  nwjs: {},

  _optionOrPrompt: optionOrPrompt,

  inializing: function () {
    this.options.defaults = this.options.defaults || {};
  },

  prompting: function () {
    var self = this,
      done = this.async();

    var prompts = [
      {
        type: 'input',
        name: 'nwjsVersion',
        message: 'Please specify which version of node-webkit you want to download',
        validate: function (answer) {
          var done = this.async(), url;

          if (!semver.valid(answer)) {
            done(answer + 'is not a valid version string.');
            return;
          }

          self.log.info('Check if version "' + answer + '" is available for download.');

          url = self._getDownloadUrl(answer, 'Linux64');
          request.head(url, function (error, response) {
            if (error) {
              self.log.conflict(error);
            }
            if (response.statusCode === 200) {
              self.log.ok('Use version "' + answer + '".');
              done(true);
            } else {
              done('No download url found for version "' + answer + '" (' + url + ')!');
            }
          });
        },
        default: this.options.defaults.nwjsVersion,
        when: function () {
          return !this.options.acceptDefaults;
        }.bind(this)
      },
      {
        type: 'list',
        name: 'platform',
        message: 'Which platform you develop on?',
        choices: Object.keys(PLATFORMS_MAP),
        default: this.options.defaults.platform,
        when: function () {
          return !this.options.acceptDefaults;
        }.bind(this)
      }];

    this._optionOrPrompt(prompts, function (props) {
      this.nwjsVersion = props.nwjsVersion || this.options.defaults.nwjsVersion;
      this.platform = props.platform || this.options.defaults.platform;
      done();
    }.bind(this));

  },

  downloadNWJS: function () {
    var done = this.async(),
      folderName = this._getNwjsFolderName(),
      folderPath = this.destinationPath('nwjs/' + folderName),
      url = this._getDownloadUrl();

    if (fs.existsSync(folderPath)) {
      this.log.write()
        .ok('NWJS already downloaded. Skip to next step.');
      done();
    } else {
      this.extract(url, this.destinationPath('nwjs'), done);
    }
  },

  writing: {
    app: function () {
      var platformName = this.platform,
        taskname = platformName + '_' + this.nwjsVersion,
        srcFolder = this._getNwjsFolderName(),
        nwExecutable = semver.outside(this.nwjsVersion, 'v0.12.0', '<') ? 'node-webkit' : 'nwjs',
        templateFile;

      if (platformName.indexOf('Linux') > -1) {
        templateFile = '_linux_grunt_tasks.js'
      } else if (platformName.indexOf('Windows') > -1) {
        templateFile = '_win_grunt_tasks.js'
      } else {
        templateFile = '_mac_grunt_tasks.js'
      }

      this.fs.copyTpl(
        this.templatePath(templateFile),
        this.destinationPath('grunt-tasks/' + taskname + '.js'),
        {
          'taskname': taskname,
          'platformName': platformName,
          'srcFolder': srcFolder,
          'nwExecutable': nwExecutable
        }
      );
    }
  },

  configuring: function () {
    this.config.set('nwjs', { platform: this.platform, nwjsVersion: this.nwjsVersion});
    this.config.save();
  },

  end: function () {
    this.log.ok('New grunt task generated.')
      .info('grunt ' + this.platform + '_' + this.nwjsVersion)
      .writeln('');
  },

  /**
   *
   * @param [version] {String}
   * @param [platform] {String}
   * @returns {string}
   * @private
   */
  _getDownloadUrl: function (version, platform) {
    version = version || this.nwjsVersion;
    platform = platform || this.platform;
    var namePart = '/nwjs-';
    if (semver.outside(version, 'v0.12.0', '<')) {
      namePart = '/node-webkit-';
    }
    return 'http://dl.nwjs.io/' + version + namePart + version + '-' + PLATFORMS_MAP[platform];
  },

  _getNwjsFolderName: function () {
    var version = this.nwjsVersion,
      platform = this.platform,
      namePart = 'nwjs-',
      platformFileName = PLATFORMS_MAP[platform],
      platformWithoutFileExtension = platformFileName.substring(0, platformFileName.indexOf('.'));

    if (semver.outside(version, 'v0.12.0', '<')) {
      namePart = 'node-webkit-';
    }
    return namePart + version + '-' + platformWithoutFileExtension;
  }
});
