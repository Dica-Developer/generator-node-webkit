/*global describe, beforeEach, it, after*/
'use strict';

var path = require('path');
var helpers = require('yeoman-generator').test;
var assert = require('yeoman-generator').assert;
var fs = require('fs-extra');

describe('Test github prompt', function () {
  var app,
    deps = [
      [helpers.createDummyGenerator(), 'node-webkit:download']
    ];

  beforeEach(function () {
    app = helpers.run(path.join(__dirname, '../app'))
      .inDir(path.join(__dirname, './tmp'))
      .withOptions({ 'skip-install': true, 'skip-welcome-message': true })
      .withGenerators(deps);
  });

  it('Should retrieve github information for given name if user exists', function (done) {
    app
      .withPrompts({
        'appName': 'TestApp',
        'appDescription': 'Test App Description',
        'githubUser': 'JayGray'
      })
      .on('end', function () {
        assert.ok(typeof app.generator.prompt.errors === 'undefined', 'This should fail if the app name contains a space.');
        assert.ok(app.generator.github, 'This should fail if app.github is set to false.');
        assert.ok(app.generator.githubUser === 'JayGray', 'This should fail if app.githubUser is not "JayGray".');
        assert.ok(app.generator.realname === 'Jörg Weber', 'This should fail if the app.realname is not "Jörg Weber".');
        assert.ok(app.generator.githubUrl === 'https://github.com/JayGray', 'This should fail if the app.githubUrl is not "https://github.com/JayGray".');
        done();
      });

  });

  it('Should skip retrieving github information if given name is default', function (done) {
    app
      .withPrompts({
        'appName': 'TestApp',
        'appDescription': 'Test App Description',
        'githubUser': 'someuser'
      })
      .on('end', function () {
        assert.ok(typeof app.generator.prompt.errors === 'undefined', 'This should fail if the app name contains a space.');
        assert.strictEqual(app.generator.github, false, 'This should fail if app.github is set to false.');
        assert.strictEqual(app.generator.github, false, 'This should fail if app.github is set to false.');
        assert.strictEqual(app.generator.githubUser, 'someuser', 'This should fail if app.githubUser is not "someuser".');
        assert.strictEqual(app.generator.realname, void 0, 'This should fail if the app.realname is not "undefined".');
        assert.strictEqual(app.generator.githubUrl, void 0, 'This should fail if the app.githubUrl is not "undefined".');
        done();
      });
  });

  it('Should set app.github to false if given name is not known by github', function (done) {
    app
      .withPrompts({
        'appName': 'TestApp',
        'appDescription': 'Test App Description',
        'githubUser': 'HopefullyNotExistingUser',
        downloadNodeWebkit: false,
        'platforms': ['Linux64']
      })
      .on('end', function () {
        assert.ok(typeof app.generator.prompt.errors === 'undefined', 'This should fail if the app name contains a space.');
        assert.strictEqual(app.generator.github, false, 'This should fail if app.github is set to true.');
        assert.strictEqual(app.generator.githubUser, 'HopefullyNotExistingUser', 'This should fail if app.githubUser is not "HopefullyNotExistingUser".');
        assert.strictEqual(app.generator.realname, void 0, 'This should fail if the app.realname is not "undefined".');
        assert.strictEqual(app.generator.githubUrl, void 0, 'This should fail if the app.githubUrl is not "undefined".');
        done();
      });
  });

  it('Should write retrieved github informations correct in package.json', function (done) {
    app
      .withPrompts({
        'appName': 'TestApp',
        'appDescription': 'Test App Description',
        'githubUser': 'JayGray'
      })
      .on('end', function () {
        var packageJson = fs.readJsonFileSync('package.json');
        assert.equal(packageJson.author.name, 'Jörg Weber', 'Should fail if author name is not "Jörg Weber"');
        assert.equal(packageJson.author.url, 'https://github.com/JayGray', 'Should fail if author url is not "https://github.com/JayGray"');
        assert.equal(packageJson.homepage, 'https://github.com/JayGray/testapp', 'Should fail if homepage is not "https://github.com/JayGray/testapp"');
        assert.equal(packageJson.bugs, 'https://github.com/JayGray/testapp/issues', 'Should fail if bugs url is not "https://github.com/JayGray/testapp"');
        done();
      });
  });

  it('Should no entry in package.json if no github information are available', function (done) {
    app
      .withPrompts({
        'appName': 'TestApp',
        'appDescription': 'Test App Description',
        'githubUser': 'someuser'
      })
      .on('end', function () {
          var packageJson = fs.readJsonFileSync('package.json');
          assert.equal(packageJson.author, void 0, 'Should fail if author name is not "undefined"');
          assert.equal(packageJson.homepage, void 0, 'Should fail if homepage is not "undefined"');
          assert.equal(packageJson.bugs, void 0, 'Should fail if bugs url is not "undefined"');
          done();
        });
      });
  });