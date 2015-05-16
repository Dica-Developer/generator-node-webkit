'use strict';

//  Dependencies
var yeoman = require('yeoman-generator'),
  semver = require('semver'),
  request = require('request'),
  assert = require('assert');

// Locals
var NWJS_DEFAULT_VERSION = 'v0.12.0',
  PLATFORMS_MAP = {
    'MacOS32': 'osx-ia32.zip',
    'MacOS64': 'osx-x64.zip',
    'Linux32': 'linux-ia32.tar.gz',
    'Linux64': 'linux-x64.tar.gz',
    'Windows32': 'win-ia32.zip'
  };

module.exports = yeoman.generators.Base.extend({
  nwjsVersion: undefined,
  nwjsPlatform: undefined,
  versionAlreadySpecified: false,
  platformAlreadySpecified: false,
  initializing: function () {
    this.argument('nwjsVersion', {
      required: false,
      type: String,
      desc: 'The subgenerator name'
    });

    this.argument('nwjsPlatform', {
      required: false,
      type: String,
      desc: 'The subgenerator name'
    });

    if (this.nwjsVersion) {
      this.nwjsVersion = this.nwjsVersion.indexOf('v') !== 0 ? 'v' + this.nwjsVersion : this.nwjsVersion;
      assert(semver.valid(this.nwjsVersion), this.nwjsVersion + ' is not a valid version string.');
      this.log('You called the NodeWebkit subgenerator with the argument ' + this.nwjsVersion + '.');
      this.versionAlreadySpecified = true;
    }

    if (this.nwjsPlatform) {
      assert(PLATFORMS_MAP[this.nwjsPlatform], this.nwjsPlatform + ' is not a valid platform. Valid platforms are: ' + Object.keys(PLATFORMS_MAP).join(', '));
      this.log('You called the NodeWebkit subgenerator with the argument ' + this.nwjsPlatform + '.');
      this.platformAlreadySpecified = true;
    }
  },

  prompting: function () {
    var self = this,
      done = this.async();

    var prompts = [
      {
        type: 'input',
        name: 'nwjsVersion',
        message: 'Please specify which version of node-webkit you want to download',
        default: NWJS_DEFAULT_VERSION,
        when: function () {
          return !this.versionAlreadySpecified;
        },
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
        }
      },
      {
        type: 'list',
        name: 'nwjsPlatform',
        message: 'Which platform you develop on?',
        choices: Object.keys(PLATFORMS_MAP),
        default: function () {
          if ('darwin' === process.platform) {
            return 0;
          }

          if ('linux' === process.platform) {
            return 2;
          }

          if ('win32' === process.platform) {
            return 4;
          }
        }
      }];

    this.prompt(prompts, function (props) {
      this.nwjsVersion = props.nwjsVersion;
      this.nwjsPlatform = props.nwjsPlatform;
      this.config.set('nwjsVersion', this.nwjsVersion);
      this.config.set('nwjsPlatform', this.nwjsPlatform);
      done();
    }.bind(this));

  },

  downloadNWJS: function(){
    var done = this.async(),
      url = this._getDownloadUrl();

    this.extract(url, this.destinationPath('nwjs'), done);
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
    platform = platform || this.nwjsPlatform;
    var namePart = '/nwjs-';
    if (semver.outside(version, 'v0.12.0', '<')) {
      namePart = '/node-webkit-';
    }
    return 'http://dl.nwjs.io/' + version + namePart + version + '-' + PLATFORMS_MAP[platform];
  }
});
