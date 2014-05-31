/*global describe, beforeEach, it, after*/
'use strict';

var path = require('path');
var temp = require('temp');
var helpers = require('yeoman-generator').test;
var expect = require('chai').expect;

describe('Test file creation', function () {
  var app;

  after(function () {
    temp.cleanup();
  });

  beforeEach(function (done) {
    var workspace = temp.mkdirSync();
    helpers.testDirectory(workspace, function (err) {
      if (err) {
        return done(err);
      }

      app = helpers.createGenerator('node-webkit:app', [
        path.resolve(__dirname, '../app')
      ]);

      helpers.mockPrompt(app, {
        'appName': 'TestApp',
        'appDescription': 'Test App Description',
        'githubUser': 'someuser',
        downloadNodeWebkit: false,
        'platforms': ['Linux64']
      });
      app.options['skip-install'] = true;
      app.options['skip-welcome-message'] = true;
      done();
    });
  });

  it('Creates dot files', function (done) {
    var expected = [
      '.jshintrc',
      '.editorconfig'
    ];

    app.run({}, function () {
      expect(app.prompt.errors).to.be.an('undefined');
      helpers.assertFile(expected);
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

    app.run({}, function () {
      expect(app.prompt.errors).to.be.an('undefined');
      helpers.assertFile(expected);
      done();
    });
  });

  it('Creates app files', function (done) {
    var expected = [
      'app/css/main.css',
      'app/js/index.js',
      'app/package.json',
      'app/views/index.html'
    ];

    app.run({}, function () {
      expect(app.prompt.errors).to.be.an('undefined');
      helpers.assertFile(expected);
      done();
    });
  });

  it('Creates resource files', function (done) {
    var expected = [
      'resources/mac/dmgStyler.applescript',
      'resources/mac/package.sh',
      'resources/mac/background.png',
      'resources/mac/Info.plist.tmp',
      'resources/mac/Info.plist'
    ];

    app.run({}, function () {
      expect(app.prompt.errors).to.be.an('undefined');
      helpers.assertFile(expected);
      done();
    });
  });
});