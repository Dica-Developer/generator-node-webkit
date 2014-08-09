/*global describe, beforeEach, it, after*/
'use strict';

var path = require('path');
var helpers = require('yeoman-generator').test;
var expect = require('chai').expect;

describe('Test file creation', function () {
  var app,
    deps = [
      [helpers.createDummyGenerator(), 'node-webkit:download']
    ];

  beforeEach(function () {
    app = helpers.run(path.join(__dirname, '../app'))
      .inDir(path.join(__dirname, './tmp'))
      .withOptions({ 'skip-install': true, 'skip-welcome-message': true })
      .withGenerators(deps)
      .withPrompts({
        'appName': 'TestApp',
        'appDescription': 'Test App Description',
        'githubUser': 'someuser'
      });
  });

  it('Creates dot files', function (done) {
    var expected = [
      '.jshintrc',
      '.editorconfig',
      '.gitignore'
    ];

    app.on('end', function () {
      expect(app.generator.prompt.errors).to.be.an('undefined');
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

    app.on('end', function () {
      expect(app.generator.prompt.errors).to.be.an('undefined');
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

    app.on('end', function () {
      expect(app.generator.prompt.errors).to.be.an('undefined');
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

    app.on('end', function () {
      expect(app.generator.prompt.errors).to.be.an('undefined');
      helpers.assertFile(expected);
      done();
    });
  });
});