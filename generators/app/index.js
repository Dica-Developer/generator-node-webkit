'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var _ = require('lodash');
var optionOrPrompt = require('yeoman-option-or-prompt');

module.exports = yeoman.generators.Base.extend({

  _optionOrPrompt: optionOrPrompt,

  _messageForDefaultAppCreation: 'I will create a node webkit app with the following defaults for you.',

  inializing: function () {
    this.defaults = {};
    this.defaults.appname = _.kebabCase(this.appname);
    this.defaults.description = '';
    this.defaults.username = '';
    this.defaults.exampleName = 'Continue without an example';
    this.defaults.nwjsVersion = 'v0.12.0';
    this.defaults.platform = (function () {
      var is64bit = process.arch === 'x64';
      if (is64bit) {
        return 'MacOS64';
      } else {
        return 'MacOS32';
      }

      if ('linux' === process.platform) {
        if (is64bit) {
          return 'Linux64';
        } else {
          return 'Linux32';
        }
      }

      if ('win32' === process.platform) {
        return 'Windows32';
      }
    }())
    this._messageForDefaultAppCreation += '\nname: ' + this.defaults.appname + '\ndescription: ' + this.defaults.description + '\ngithub username: ' + this.defaults.username + '\nnwjs version: ' + this.defaults.nwjsVersion + ' for platform ' + this.defaults.platform;
  },

  prompting: function () {
    var done = this.async();
    if(!this.options['skip-welcome']){
      this.log(yosay('Welcome to the outstanding ' + chalk.red('NodeWebkit') + ' generator!'));
    }

    var prompts = [
      {
        name: 'acceptDefaults',
        message: this._messageForDefaultAppCreation + '\nIs this what you want?',
        type: 'confirm',
        default: true
      },
      {
        name: 'appname',
        message: 'What do you want to call your app? Allowed characters ^[a-zA-Z0-9\-]+$',
        default: this.defaults.appname,
        validate: function (answer) {
          if (!/^[a-zA-Z0-9\-]+$/.test(answer)) {
            return 'The application name should only consist of the following characters a-z, A-Z and 0-9.';
          }
          return true;
        },
        when: function (properties) {
          return !properties.acceptDefaults;
        }
      },
      {
        name: 'description',
        message: 'A little description for your app?',
        when: function (properties) {
          return !properties.acceptDefaults;
        },
        default: this.defaults.description
      },
      {
        name: 'username',
        message: 'Would you mind telling me your username on GitHub?',
        when: function (properties) {
          return !properties.acceptDefaults;
        },
        default: this.defaults.username
      }
    ];

    this._optionOrPrompt(prompts, function (props) {
      this.appname = props.appname;
      this.description = props.description;
      this.username = props.username;
      this.acceptDefaults = props.acceptDefaults;
      done();
    }.bind(this));
  },

  compose: function () {
    this.composeWith('node-webkit:download', { options: {acceptDefaults: this.acceptDefaults, defaults: this.defaults } });
    this.composeWith('node-webkit:examples', { options: {acceptDefaults: this.acceptDefaults, defaults: this.defaults } });
  },

  writing: {
    app: function () {
      this.fs.copyTpl(
        this.templatePath('_package.json'),
        this.destinationPath('package.json'),
        this
      );

      this.fs.copyTpl(
        this.templatePath('resources/_Info.plist.tmp'),
        this.destinationPath('resources/mac/Info.plist.tmp'),
        {'appname': this.options.appname}
      );

      this.fs.copy(
        this.templatePath('resources/mac'),
        this.destinationPath('resources/mac')
      );

      this.fs.copy(
        this.templatePath('_Gruntfile.js'),
        this.destinationPath('Gruntfile.js')
      );
    },

    projectfiles: function () {
      this.fs.copy(
        this.templatePath('editorconfig'),
        this.destinationPath('.editorconfig')
      );
      this.fs.copy(
        this.templatePath('jshintrc'),
        this.destinationPath('.jshintrc')
      );
      this.fs.copy(
        this.templatePath('gitignore'),
        this.destinationPath('.gitignore')
      );
    }
  },

  install: function () {
    if(!this.options['skip-install']){
      this.installDependencies();
    }
  }
});
