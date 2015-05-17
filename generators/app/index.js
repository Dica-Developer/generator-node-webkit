'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var _ = require('lodash');

module.exports = yeoman.generators.Base.extend({
  prompting: function () {
    var done = this.async();
    // Have Yeoman greet the user.
    this.log(yosay(
      'Welcome to the outstanding ' + chalk.red('NodeWebkit') + ' generator!'
    ));

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
        name: 'nwjs',
        message: 'Do you want to download node-webkit?',
        default: true
      },
      {
        type: 'confirm',
        name: 'examples',
        message: 'Do you want to install one of the node-webkit examples?',
        default: false
      }
    ];

    this.prompt(prompts, function (props) {
      this.appname = props.appname;
      this.description = props.description;
      this.username = props.username;
      this.examples = props.examples;
      this.nwjs = props.nwjs;
      done();
    }.bind(this));
  },

  compose: function () {
    if(this.nwjs){
      this.composeWith('node-webkit:download');
    }

    if(this.examples){
      this.composeWith('node-webkit:examples');
    }
  },

  writing: {
    app: function () {
      this.fs.copyTpl(
        this.templatePath('_package.json'),
        this.destinationPath('package.json'),
        this
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
    }
  },

  install: function () {
    this.installDependencies();
  }
});
