/*global describe, beforeEach, it*/
'use strict';

var path = require('path');
var temp = require('temp');
var helpers = require('yeoman-generator').test;
var assert = require('yeoman-generator').assert;

describe('Test prompt validations', function () {

  var app;

  after(function () {
    temp.cleanup();
  });

  it('App name has invalid character and should fail', function(done){
    var workspace = temp.mkdirSync();
    helpers.testDirectory(workspace, function (err) {
      if (err) {
        return done(err);
      }

      app = helpers.createGenerator('node-webkit:app', [
        path.resolve(__dirname, '../app')
      ]);

      helpers.mockPrompt(app, {
        'appName': 'Test App',
        'appDescription': 'Test App Description',
        'githubUser': 'someuser',
        downloadNodeWebkit: false,
        'platforms': ['Linux64']
      });
      app.options['skip-install'] = true;

      app.run({}, function () {
        assert.ok(typeof app.errors !== 'undefined', 'This should fail if the app name contains a space.');
        assert.ok(app.errors.length === 1, 'There should be only 1 error.');
        assert.ok(app.errors[0].name === 'appName', 'The appName property should be wrong.');
        assert.ok(app.errors[0].message === 'The application name should only consist of the following characters a-z, A-Z and 0-9.', 'The appName property should be wrong.');
        done();
      });
    });
  });
});


describe('node-webkit generator', function () {
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
      assert.ok(typeof app.errors === 'undefined', 'Validation errors in prompt values');
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
      assert.ok(typeof app.errors === 'undefined', 'Validation errors in prompt values');
      helpers.assertFile(expected);
      done();
    });
  });
});
