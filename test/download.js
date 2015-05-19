'use strict';

var path = require('path');
var assert = require('yeoman-generator').assert;
var helpers = require('yeoman-generator').test;
var fs = require('fs-extra');
var expect = require('chai').expect;
var nock = require('nock');
var sinon = require('sinon');

var logMethodNames = [
  'write',
  'writeln',
  'ok',
  'error',
  'skip',
  'force',
  'create',
  'invoke',
  'conflict',
  'identical',
  'info',
  'table'
];

function createLogStubs(generator) {
  logMethodNames.forEach(function (logMethodName) {
    generator.log[logMethodName] = sinon.stub().returns(generator.log);
  });
}

function restoreLog(generator) {
  logMethodNames.forEach(function (logMethodName) {
    generator.log[logMethodName].reset();
  });
}

describe('node-webkit:download', function () {
  var gen, testDirectoryPath = path.join(__dirname, 'tmp'),
    testDirectory = helpers.setUpTestDirectory(testDirectoryPath),
    deps = ['../../generators/download'];

  beforeEach(function (done) {
    testDirectory(function () {
      fs.emptyDirSync(testDirectoryPath);
      fs.writeJsonSync(testDirectoryPath + '/.yo-rc.json', {'generator-node-webkit': {}});
      fs.symlinkSync(__dirname + '/fixtures/node_modules', testDirectoryPath + '/node_modules');
      gen = helpers.createGenerator('node-webkit:download', deps, [], {
        'skip-install': true,
        'skip-welcome': true
      });
      createLogStubs(gen);
      done();
    });

  });

  afterEach(function () {
    restoreLog(gen)
  });


  describe('with version < v0.12.0', function () {

    it('should call "node-webkit" url', function (done) {
      var scope = nock('http://dl.nwjs.io')
        .get('/v0.10.0/node-webkit-v0.10.0-linux-x64.tar.gz')
        .reply(200, {});

      helpers.mockPrompt(gen, {
        'version': 'v0.10.0',
        'platform': 'Linux64'
      });

      gen.run(function () {
        expect(scope.isDone()).to.be.true;
        done();
      });
    });

    it('should create create correct Gruntfile', function (done) {
      nock('http://dl.nwjs.io')
        .get('/v0.10.0/node-webkit-v0.10.0-linux-x64.tar.gz')
        .reply(200, {});

      helpers.mockPrompt(gen, {
        'version': 'v0.10.0',
        'platform': 'Linux64'
      });

      gen.run(function () {
        assert.file(testDirectoryPath + '/grunt-tasks/Linux64_v0.10.0.js');
        done();
      });
    });

    it('should expand archive in correct folder', function (done) {
      nock('http://dl.nwjs.io')
        .get('/v0.10.0/node-webkit-v0.10.0-linux-x64.tar.gz')
        .replyWithFile(200, __dirname + '/package_fixtures/node-webkit-v0.10.0-linux-x64.tar.gz');

      helpers.mockPrompt(gen, {
        'version': 'v0.10.0',
        'platform': 'Linux64'
      });

      gen.run(function () {
        assert.file(
          [
            testDirectoryPath + '/nwjs/node-webkit-v0.10.0-linux-x64/credits.html',
            testDirectoryPath + '/nwjs/node-webkit-v0.10.0-linux-x64/icudtl.dat',
            testDirectoryPath + '/nwjs/node-webkit-v0.10.0-linux-x64/libffmpegsumo.so',
            testDirectoryPath + '/nwjs/node-webkit-v0.10.0-linux-x64/nw',
            testDirectoryPath + '/nwjs/node-webkit-v0.10.0-linux-x64/nw.pak'
          ]);
        done();
      });
    });
  });

  describe('with version >= v0.12.0', function () {

    it('should call "nwjs" url', function (done) {
      var scope = nock('http://dl.nwjs.io')
        .get('/v0.12.0/nwjs-v0.12.0-linux-x64.tar.gz')
        .reply(200, {});

      helpers.mockPrompt(gen, {
        'version': 'v0.12.0',
        'platform': 'Linux64'
      });

      gen.run(function () {
        expect(scope.isDone()).to.be.true;
        done();
      });
    });
  });

});
