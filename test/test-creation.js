/*global describe, beforeEach, it*/
'use strict';

var path    = require('path');
var helpers = require('yeoman-generator').test;


describe('node-webkit generator', function () {
  beforeEach(function (done) {
    helpers.testDirectory(path.join(__dirname, 'temp'), function (err) {
      if (err) {
        return done(err);
      }

      this.app = helpers.createGenerator('node-webkit:app', [
        '../../app'
      ]);

      helpers.mockPrompt(this.app, {
        'appName': 'Test App',
        'appDescription': 'Test App Description',
        'githubUser': 'someUser',
        'platforms': []
      });
      this.app.options['skip-install'] = true;

      done();
    }.bind(this));
  });

  it('Creates dot files', function (done) {
    var expected = [
      '.jshintrc',
      '.editorconfig'
    ];

    this.app.run({}, function () {
      helpers.assertFiles(expected);
      done();
    });
  });

  it('Creates main package files', function (done) {
    var expected = [
      // add files you expect to exist here.
      'Gruntfile.js',
      'package.json',
      'bower.json'
    ];

    this.app.run({}, function () {
      helpers.assertFiles(expected);
      done();
    });
  });
});
