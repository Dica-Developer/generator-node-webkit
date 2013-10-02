'use strict';
var util = require('util');
var path = require('path');
var yeoman = require('yeoman-generator');
var when = require('when');
var https = require('https');
var fs = require('fs-extra');
var AdmZip = require('adm-zip');
var url = require('url');
var GitHubApi = require('github');

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

var suggestAppNameFromPath = function (_) {
  var basePath = path.basename(process.env.PWD);
  return _.slugify(basePath);
};

var githubUserInfo = function (name, cb) {
  github.user.getFrom({
    user: name
  }, function (err, res) {
    if (err) {
      throw err;
    }
    cb(JSON.parse(JSON.stringify(res)));
  });
};

var NodeWebkitGenerator = module.exports = function NodeWebkitGenerator(args, options, config) {
  yeoman.generators.Base.apply(this, arguments);

  this.on('end', function () {
    this.installDependencies({ skipInstall: options['skip-install'] });
  });

  this.pkg = JSON.parse(this.readFileAsString(path.join(__dirname, '../package.json')));
  this.nodeWebkitBaseUrl = 'https://s3.amazonaws.com/node-webkit/v0.7.5/node-webkit-v0.7.5-';
};

util.inherits(NodeWebkitGenerator, yeoman.generators.Base);

NodeWebkitGenerator.prototype.askFor = function askFor() {
  var done = this.async();
  var appName = suggestAppNameFromPath(this._);

  // have Yeoman greet the user.
  console.log(this.yeoman);

  var prompts = [
    {
      name: 'appName',
      message: 'What do you want to call your app?',
      default: appName
    },
    {
      name: 'appDescription',
      message: 'A little description for your app?'
    },
    {
      name: 'githubUser',
      message: 'Would you mind telling me your username on GitHub?',
      default: 'someuser'
    },
    {
      type: 'checkbox',
      name: 'platforms',
      message: 'Which platform do you wanna support?',
      choices: [
        {
          name: 'MacOS',
          checked: true
        },
        {
          name: 'Linux 32',
          checked: true
        },
        {
          name: 'Linux 64',
          checked: true
        },
        {
          name: 'Windows',
          checked: true
        }
      ],
      validate: function( answer ) {
        if ( answer.length < 1 ) {
          return "You must choose at least one platform.";
        }
        return true;
      }
    }
  ];

  this.prompt(prompts, function (props) {
    var _this = this;
    this.appName = props.appName;
    this.appDescription = props.appDescription;
    this.platforms = props.platforms;
    this.githubUser = props.githubUser;
    this.MacOS = false;
    this.Linux32 = false;
    this.Linux64 = false;
    this.Windows = false;
    this.github = false;

    props.platforms.forEach(function(platform){
      switch(platform){
        case 'MacOS':
          _this.MacOS = true;
          break;
        case 'Linux 32':
          _this.Linux32 = true;
          break;
        case 'Linux 64':
          _this.Linux64 = true;
          break;
        case 'Windows':
          _this.Windows = true;
          break;
      }
    });

    done();
  }.bind(this));
};

NodeWebkitGenerator.prototype.userInfo = function userInfo() {
  var done = this.async();

  if(this.githubUser !== 'someuser'){
    this.github = true;
    githubUserInfo(this.githubUser, function (res) {
      this.realname = res.name;
      this.email = res.email;
      this.githubUrl = res.html_url;
      done();
    }.bind(this));
  } else {
    done();
  }
};

NodeWebkitGenerator.prototype.app = function app() {
  this.mkdir('app');
  this.mkdir('app/img');
  this.mkdir('resources/node-webkit');
  if(this.MacOS){
    this.mkdir('resources/node-webkit/mac');
  }
  if(this.Linux32){
    this.mkdir('resources/node-webkit/linux32');
  }
  if(this.Linux64){
    this.mkdir('resources/node-webkit/linux64');
  }
  if(this.Windows){
    this.mkdir('resources/node-webkit/win');
  }
  this.mkdir('tmp');

  this.copy('_bower.json', 'bower.json');
  this.copy('app/_main.css', 'app/css/main.css');
  this.copy('app/_index.js', 'app/js/index.js');
  this.template('_package.json', 'package.json');
  this.template('app/_package.json', 'app/package.json');
  this.template('app/_index.html', 'app/views/index.html');
  this.template('_Gruntfile.js', 'Gruntfile.js');
};

NodeWebkitGenerator.prototype.getNodeWebkit = function getNodeWebkit(){
  var done = this.async();
  var whenClbk = function(){
    done();
  };
  if(this.platforms.length > 0){
    when.all(this._getNodeWebkit(), whenClbk, whenClbk);
  } else {
    done();
  }
};


NodeWebkitGenerator.prototype._getNodeWebkit = function _getNodeWebkit(){
  var promises = [];
  if(this.MacOS){
    promises.push(this._requestNodeWebkit('osx-ia32.zip', 'MacOS'));
  }
  if(this.Linux32){
    promises.push(this._requestNodeWebkit('linux-ia32.tar.gz', 'Linux32'));
  }
  if(this.Linux64){
    promises.push(this._requestNodeWebkit('linux-x64.tar.gz', 'Linux64'));
  }
  if(this.Windows){
    promises.push(this._requestNodeWebkit('win-ia32.zip', 'Windows'));
  }
  return promises;
};

NodeWebkitGenerator.prototype._requestNodeWebkit = function _requestNodeWebkit(versionString, platform){
  var defer = when.defer();
  if (!fs.existsSync('tmp/node-webkit-v0.7.5-'+ versionString)) {
    console.log('Downloading node-webkit for ' + platform);
    https.get(this.nodeWebkitBaseUrl + versionString, function (res) {
      res.on('data', function (chunk) {
        fs.appendFileSync('tmp/node-webkit-v0.7.5-'+ versionString, chunk);
      }).on('end', function () {
          defer.resolve();
      }).on('error', function(error){
          defer.reject(error);
      });
    }).on('error', function(error){
        defer.reject(error);
    });
  } else{
    console.log('Already downloaded');
    defer.resolve();
  }
  return defer.promise;
};

NodeWebkitGenerator.prototype.unzipNodeWebkit = function unzipNodeWebkit(){
  if(this.platforms.length > 0){
    if(this.MacOS){
      var zipMac = new AdmZip('tmp/node-webkit-v0.7.5-osx-ia32.zip');
      zipMac.extractAllTo('tmp/mac', true);
    }
    if(this.Linux32){
      //TODO tar.gz
    }
    if(this.Linux64){
      //TODO tar.gz
    }
    if(this.Windows){
      var zipWin = new AdmZip('tmp/node-webkit-v0.7.5-win-ia32.zip');
      zipWin.extractAllTo('resources/node-webkit/win', true);
    }
  }
};

NodeWebkitGenerator.prototype.copyNodeWebkit = function unzipNodeWebkit(){
  var done = this.async();
  if(this.platforms.length > 0){
    if(this.MacOS){
      fs.copy('tmp/mac/node-webkit.app', 'resources/node-webkit/mac/node-webkit.app', function(error){
        error ? done(error) : done();
      });
    }
  } else{
    done();
  }
};

NodeWebkitGenerator.prototype.projectfiles = function projectfiles() {
  this.copy('editorconfig', '.editorconfig');
  this.copy('jshintrc', '.jshintrc');
};