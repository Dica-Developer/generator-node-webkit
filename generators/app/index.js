'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var _ = require('lodash');
var optionOrPrompt = require('yeoman-option-or-prompt');

module.exports = yeoman.generators.Base.extend({

  _optionOrPrompt: optionOrPrompt,

  prompting: function () {
    var done = this.async();
    if(!this.options['skip-welcome']){
      this.log(yosay(
        'Welcome to the outstanding ' + chalk.red('NodeWebkit') + ' generator!'
      ));
    }

    var prompts = [
      {
        name: 'appname',
        message: 'What do you want to call your app? Allowed characters ^[a-zA-Z0-9\-]+$',
        default: _.kebabCase(this.appname),
        validate: function (answer) {
          if (!/^[a-zA-Z0-9\-]+$/.test(answer)) {
            return 'The application name should only consist of the following characters a-z, A-Z and 0-9.';
          }
          return true;
        }
      },
      {
        name: 'description',
        message: 'A little description for your app?'
      },
      {
        name: 'username',
        message: 'Would you mind telling me your username on GitHub?'
      },
      {
        type: 'confirm',
        name: 'examples',
        message: 'Do you want to install one of the node-webkit examples?',
        default: false
      }
    ];

    this._optionOrPrompt(prompts, function (props) {
      this.appname = props.appname;
      this.description = props.description;
      this.username = props.username;
      this.examples = props.examples;
      done();
    }.bind(this));
  },

  compose: function () {
    this.composeWith('node-webkit:download', { options: this.options });
    if(this.examples){
      this.composeWith('node-webkit:examples', { options: this.options });
    }
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
        {'appname': this.appname}
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
