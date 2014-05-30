/*global describe, beforeEach, it, after*/
'use strict';

var path = require('path');
var temp = require('temp');
var helpers = require('yeoman-generator').test;
var assert = require('yeoman-generator').assert;
var fs = require('fs-extra');

describe('Test github prompt', function () {
  var app, workspace;

  beforeEach(function (done) {
    workspace = temp.mkdirSync();
    app = helpers.createGenerator('node-webkit:app', [
      path.resolve(__dirname, '../app')
    ]);
    app.options['skip-install'] = true;
    app.options['skip-welcome-message'] = true;
    helpers.testDirectory(workspace, function (err) {
      if (err) {
        return done(err);
      }

      done();
    });
  });

  afterEach(function () {
    temp.cleanup();
  });

  it('Should retrieve github information for given name if user exists', function (done) {
    helpers.mockPrompt(app, {
      'appName': 'TestApp',
      'appDescription': 'Test App Description',
      'githubUser': 'JayGray',
      downloadNodeWebkit: false,
      'platforms': ['Linux64']
    });
    app.run({}, function () {
      assert.ok(typeof app.prompt.errors === 'undefined', 'This should fail if the app name contains a space.');
      assert.ok(app.github, 'This should fail if app.github is set to false.');
      assert.ok(app.githubUser === 'JayGray', 'This should fail if app.githubUser is not "JayGray".');
      assert.ok(app.realname === 'Jörg Weber', 'This should fail if the app.realname is not "Jörg Weber".');
      assert.ok(app.githubUrl === 'https://github.com/JayGray', 'This should fail if the app.githubUrl is not "https://github.com/JayGray".');
      done();
    });
  });

  it('Should skip retrieving github information if given name is default', function (done) {
    helpers.mockPrompt(app, {
      'appName': 'TestApp',
      'appDescription': 'Test App Description',
      'githubUser': 'someuser',
      downloadNodeWebkit: false,
      'platforms': ['Linux64']
    });
    app.run({}, function () {
      assert.ok(typeof app.prompt.errors === 'undefined', 'This should fail if the app name contains a space.');
      assert.strictEqual(app.github, false, 'This should fail if app.github is set to false.');
      assert.strictEqual(app.github, false, 'This should fail if app.github is set to false.');
      assert.strictEqual(app.githubUser, 'someuser', 'This should fail if app.githubUser is not "someuser".');
      assert.strictEqual(app.realname, void 0, 'This should fail if the app.realname is not "undefined".');
      assert.strictEqual(app.githubUrl, void 0, 'This should fail if the app.githubUrl is not "undefined".');
      done();
    });
  });

  it('Should set app.github to false if given name is not known by github', function (done) {
    helpers.mockPrompt(app, {
      'appName': 'TestApp',
      'appDescription': 'Test App Description',
      'githubUser': 'HopefullyNotExistingUser',
      downloadNodeWebkit: false,
      'platforms': ['Linux64']
    });
    app.run({}, function () {
      assert.ok(typeof app.prompt.errors === 'undefined', 'This should fail if the app name contains a space.');
      assert.strictEqual(app.github, false, 'This should fail if app.github is set to true.');
      assert.strictEqual(app.githubUser, 'HopefullyNotExistingUser', 'This should fail if app.githubUser is not "HopefullyNotExistingUser".');
      assert.strictEqual(app.realname, void 0, 'This should fail if the app.realname is not "undefined".');
      assert.strictEqual(app.githubUrl, void 0, 'This should fail if the app.githubUrl is not "undefined".');
      done();
    });
  });

  it('Should write retrieved github informations correct in package.json', function (done) {
    helpers.mockPrompt(app, {
      'appName': 'TestApp',
      'appDescription': 'Test App Description',
      'githubUser': 'JayGray',
      downloadNodeWebkit: false,
      'platforms': ['Linux64']
    });
    app.run({}, function () {
      var packageJson = fs.readJsonFileSync('package.json');
      assert.equal(packageJson.author.name, 'Jörg Weber', 'Should fail if author name is not "Jörg Weber"');
      assert.equal(packageJson.author.url, 'https://github.com/JayGray', 'Should fail if author url is not "https://github.com/JayGray"');
      assert.equal(packageJson.homepage, 'https://github.com/JayGray/testapp', 'Should fail if homepage is not "https://github.com/JayGray/testapp"');
      assert.equal(packageJson.bugs, 'https://github.com/JayGray/testapp/issues', 'Should fail if bugs url is not "https://github.com/JayGray/testapp"');
      done();
    });
  });

  it('Should no entry in package.json if no github information are available', function (done) {
    helpers.mockPrompt(app, {
      'appName': 'TestApp',
      'appDescription': 'Test App Description',
      'githubUser': 'someuser',
      downloadNodeWebkit: false,
      'platforms': ['Linux64']
    });
    app.run({}, function () {
      var packageJson = fs.readJsonFileSync('package.json');
      assert.equal(packageJson.author, void 0, 'Should fail if author name is not "undefined"');
      assert.equal(packageJson.homepage, void 0, 'Should fail if homepage is not "undefined"');
      assert.equal(packageJson.bugs, void 0, 'Should fail if bugs url is not "undefined"');
      done();
    });
  });

});