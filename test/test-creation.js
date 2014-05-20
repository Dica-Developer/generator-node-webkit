/*global describe, beforeEach, it, after*/
'use strict';

var path = require('path');
var temp = require('temp');
var helpers = require('yeoman-generator').test;
var assert = require('yeoman-generator').assert;

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
      done();
    });
  });

  it('Creates dot files', function (done) {
    var expected = [
      '.jshintrc',
      '.editorconfig'
    ];

    app.run({}, function () {
      assert.ok(typeof app.prompt.errors === 'undefined', 'Validation errors in prompt values');
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
      assert.ok(typeof app.prompt.errors === 'undefined', 'Validation errors in prompt values');
      helpers.assertFile(expected);
      done();
    });
  });
});