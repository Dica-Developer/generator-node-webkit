/*global describe, beforeEach, it, after*/
'use strict';

var path = require('path');
var temp = require('temp');
var helpers = require('yeoman-generator').test;
var assert = require('yeoman-generator').assert;
var fs = require('fs-extra');

describe('Test prompt validations', function () {

  var app;

  after(function () {
    temp.cleanup();
  });

  it('App name has invalid character and should fail', function (done) {
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
        assert.ok(typeof app.prompt.errors !== 'undefined', 'This should fail if the app name contains a space.');
        assert.ok(app.prompt.errors.length === 1, 'There should be only 1 error.');
        assert.ok(app.prompt.errors[0].name === 'appName', 'The appName property should be wrong.');
        assert.ok(app.prompt.errors[0].message === 'The application name should only consist of the following characters a-z, A-Z and 0-9.', 'The appName property should be wrong.');
        done();
      });
    });
  });
});

describe('Test github prompt', function(){
  var app;

  after(function () {
    temp.cleanup();
  });

  it('Should retrieve github information for given name if user exists', function (done) {
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
        'githubUser': 'JayGray',
        downloadNodeWebkit: false,
        'platforms': ['Linux64']
      });
      app.options['skip-install'] = true;
      app.run({}, function () {
        assert.ok(typeof app.prompt.errors === 'undefined', 'This should fail if the app name contains a space.');
        assert.ok(app.github, 'This should fail if app.github is set to false.');
        assert.ok(app.githubUser === 'JayGray', 'This should fail if app.githubUser is not "JayGray".');
        assert.ok(app.realname === 'Jörg Weber', 'This should fail if the app.realname is not "Jörg Weber".');
        assert.ok(app.githubUrl === 'https://github.com/JayGray', 'This should fail if the app.githubUrl is not "https://github.com/JayGray".');
        done();
      });
    });
  });

  it('Should skip retrieving github information if given name is default', function (done) {
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
      app.run({}, function () {
        assert.ok(typeof app.prompt.errors === 'undefined', 'This should fail if the app name contains a space.');
        assert.strictEqual(app.github, false, 'This should fail if app.github is set to false.');
        assert.strictEqual(app.githubUser, 'someuser', 'This should fail if app.githubUser is not "someuser".');
        assert.strictEqual(app.realname, void 0, 'This should fail if the app.realname is not "undefined".');
        assert.strictEqual(app.githubUrl, void 0, 'This should fail if the app.githubUrl is not "undefined".');
        done();
      });
    });
  });

  it('Should set app.github to false if given name is not known by github', function (done) {
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
        'githubUser': 'HopefullyNotExistingUser',
        downloadNodeWebkit: false,
        'platforms': ['Linux64']
      });
      app.options['skip-install'] = true;
      app.run({}, function () {
        assert.ok(typeof app.prompt.errors === 'undefined', 'This should fail if the app name contains a space.');
        assert.strictEqual(app.github, false, 'This should fail if app.github is set to true.');
        assert.strictEqual(app.githubUser, 'HopefullyNotExistingUser', 'This should fail if app.githubUser is not "HopefullyNotExistingUser".');
        assert.strictEqual(app.realname, void 0, 'This should fail if the app.realname is not "undefined".');
        assert.strictEqual(app.githubUrl, void 0, 'This should fail if the app.githubUrl is not "undefined".');
        done();
      });
    });
  });

  it('Should write retrieved github informations correct in package.json', function (done) {
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
        'githubUser': 'JayGray',
        downloadNodeWebkit: false,
        'platforms': ['Linux64']
      });
      app.options['skip-install'] = true;
      app.run({}, function () {
        var packageJson = fs.readJsonFileSync('package.json');
        console.log(packageJson);
        assert.equal(packageJson.author.name, 'Jörg Weber', 'Should fail if author name is not "Jörg Weber"');
        assert.equal(packageJson.author.url, 'https://github.com/JayGray', 'Should fail if author url is not "https://github.com/JayGray"');
        assert.equal(packageJson.homepage, 'https://github.com/JayGray/testapp', 'Should fail if homepage is not "https://github.com/JayGray/testapp"');
        assert.equal(packageJson.bugs, 'https://github.com/JayGray/testapp/issues', 'Should fail if bugs url is not "https://github.com/JayGray/testapp"');
        done();
      });
    });
  });
});


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
