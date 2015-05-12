/*global require*/
'use strict';

var util = require('util');
var path = require('path');
var yeoman = require('yeoman-generator');
var url = require('url');
var GitHubApi = require('github');
var _ = require('lodash');
var readFileAsString = require("html-wiring").readFileAsString;
var welcomeMessage = require('yeoman-welcome');

var Examples = require('./examples.js');

var NodeWebkitGenerator = module.exports = function NodeWebkitGenerator(args, options) {
  yeoman.generators.Base.apply(this, arguments);

  this.on('end', function () {
    this.installDependencies({
      skipInstall: options['skip-install']
    });
  });

  this.pkg = JSON.parse(readFileAsString(path.join(__dirname, '../package.json')));
  this.github = false;
};

util.inherits(NodeWebkitGenerator, yeoman.generators.Base);

NodeWebkitGenerator.prototype.welcome = function welcome() {
  if (!this.options['skip-welcome-message']) {
    this.log(welcomeMessage);
  }
};

NodeWebkitGenerator.prototype.askForAppName = function askForAppName() {
  var done = this.async();
  var basePath = path.basename(process.env.PWD);
  var appName = _.camelCase(basePath);

  var prompts = [{
    name: 'appName',
    message: 'What do you want to call your app? Allowed characters ^[a-zA-Z0-9]+$',
    default: appName,
    validate: function (answer) {
      if (!/^[a-zA-Z0-9]+$/.test(answer)) {
        return 'The application name should only consist of the following characters a-z, A-Z and 0-9.';
      }
      return true;
    }
  }];

  this.prompt(prompts, function (props) {
    this.appName = props.appName;
    done();
  }.bind(this));

};

NodeWebkitGenerator.prototype.askForDescription = function askForDescription() {
  var done = this.async();
  var prompts = [{
    name: 'appDescription',
    message: 'A little description for your app?'
  }];

  this.prompt(prompts, function (props) {
    this.appDescription = props.appDescription;
    done();
  }.bind(this));

};

NodeWebkitGenerator.prototype.askForGithubName = function askForGithubName() {
  var done = this.async();
  var prompts = [{
    name: 'githubUser',
    message: 'Would you mind telling me your username on GitHub?',
    default: 'someuser'
  }];

  this.prompt(prompts, function (props) {
    this.githubUser = props.githubUser;
    done();
  }.bind(this));
};

NodeWebkitGenerator.prototype.askForInstallExamples = function askForInstallExamples() {
  var done = this.async();
  var prompts = [{
    type: 'confirm',
    name: 'installExamples',
    message: 'Do you want to install one of the node-webkit examples?',
    default: false
  }];
  this.prompt(prompts, function (props) {
    this.installExamples = props.installExamples;
    done();
  }.bind(this));

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

NodeWebkitGenerator.prototype.getExampleList = function getExampleList() {
  var done = this.async();
  if (this.installExamples) {
    var prompts = [{
      type: 'list',
      name: 'example',
      message: 'Which example do you want to install?',
      choices: []
    }];

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

NodeWebkitGenerator.prototype.nodeWebkitSubgenerator = function createFolder() {
  var done = this.async();
  this.invoke("node-webkit:download", {}, function () {
    done();
  });
};

NodeWebkitGenerator.prototype.processProjectfiles = function processProjectfiles() {
  this.copy('editorconfig', '.editorconfig');
  this.copy('jshintrc', '.jshintrc');
  this.copy('gitignore', '.gitignore');
  this.copy('_bower.json', 'bower.json');
  this.copy('mac/dmgStyler.applescript', 'resources/mac/dmgStyler.applescript');
  this.copy('mac/package.sh', 'resources/mac/package.sh');
  this.copy('mac/background.png', 'resources/mac/background.png');
  this.template('_package.json', 'package.json');
  this.template('_Gruntfile.js', 'Gruntfile.js');
  this.template('mac/_Info.plist.tmp', 'resources/mac/Info.plist.tmp');
};

NodeWebkitGenerator.prototype.processAppFiles = function processAppFiles() {
  var done = this.async();
  if (this.installExamples) {
    this.examplesAPI.downloadAndInstallExamples(this.example)
      .then(function() {
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
