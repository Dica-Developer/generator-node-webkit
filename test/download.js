'use strict';

var path = require('path'),
  assert = require('yeoman-generator').assert,
  helpers = require('yeoman-generator').test,
  fs = require('fs-extra'),
  chai = require('chai'),
  expect = chai.expect,
  nock = require('nock'),
  sinon = require('sinon'),
  sinonChai = require("sinon-chai"),

  logMethodMap = {
    'write': sinon.stub(),
    'writeln': sinon.stub(),
    'ok': sinon.stub(),
    'error': sinon.stub(),
    'skip': sinon.stub(),
    'force': sinon.stub(),
    'create': sinon.stub(),
    'invoke': sinon.stub(),
    'conflict': sinon.stub(),
    'identical': sinon.stub(),
    'info': sinon.stub(),
    'table': sinon.stub()
  },
  nwjsBaseUrl = 'http://dl.nwjs.io';

chai.use(sinonChai);

function createLogStubs(generator) {
  Object.keys(logMethodMap).forEach(function (logMethodName) {
    generator.log[logMethodName] = logMethodMap[logMethodName].returns(logMethodMap);
  });
}

function restoreLog(generator) {
  Object.keys(logMethodMap).forEach(function (logMethodName) {
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
    var packageUrlPath = '/v0.10.0/node-webkit-v0.10.0-linux-x64.tar.gz';

    it('should call "node-webkit" url', function (done) {
      var scope = nock(nwjsBaseUrl)
        .get(packageUrlPath)
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
      nock(nwjsBaseUrl)
        .get(packageUrlPath)
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
      nock(nwjsBaseUrl)
        .get(packageUrlPath)
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

    it('should log that a new grunt task is created', function (done) {
      nock(nwjsBaseUrl)
        .get(packageUrlPath)
        .replyWithFile(200, __dirname + '/package_fixtures/node-webkit-v0.10.0-linux-x64.tar.gz');

      helpers.mockPrompt(gen, {
        'version': 'v0.10.0',
        'platform': 'Linux64'
      });

      gen.run(function () {
        expect(gen.log.ok).to.have.been.calledWith('New grunt task generated.');
        expect(gen.log.info).to.have.been.calledWith('grunt Linux64_v0.10.0');
        done();
      });
    });
  });

  describe('with version >= v0.12.0', function () {
    var packageUrlPath = '/v0.12.0/nwjs-v0.12.0-linux-x64.tar.gz',
      version = 'v0.12.0';

    it('should call "nwjs" url', function (done) {
      var scope = nock(nwjsBaseUrl)
        .get(packageUrlPath)
        .reply(200, {});

      helpers.mockPrompt(gen, {
        'version': version,
        'platform': 'Linux64'
      });

      gen.run(function () {
        expect(scope.isDone()).to.be.true;
        done();
      });
    });

    it('should create create correct Gruntfile', function (done) {
      nock(nwjsBaseUrl)
        .get(packageUrlPath)
        .reply(200, {});

      helpers.mockPrompt(gen, {
        'version': version,
        'platform': 'Linux64'
      });

      gen.run(function () {
        assert.file(testDirectoryPath + '/grunt-tasks/Linux64_v0.12.0.js');
        done();
      });
    });

    it('should expand archive in correct folder', function (done) {
      nock(nwjsBaseUrl)
        .get(packageUrlPath)
        .replyWithFile(200, __dirname + '/package_fixtures/nwjs-v0.12.0-linux-x64.tar.gz');

      helpers.mockPrompt(gen, {
        'version': version,
        'platform': 'Linux64'
      });

      gen.run(function () {
        assert.file(
          [
            testDirectoryPath + '/nwjs/nwjs-v0.12.0-linux-x64/credits.html',
            testDirectoryPath + '/nwjs/nwjs-v0.12.0-linux-x64/icudtl.dat',
            testDirectoryPath + '/nwjs/nwjs-v0.12.0-linux-x64/libffmpegsumo.so',
            testDirectoryPath + '/nwjs/nwjs-v0.12.0-linux-x64/nw',
            testDirectoryPath + '/nwjs/nwjs-v0.12.0-linux-x64/nw.pak'
          ]);
        done();
      });
    });

    it('should log that a new grunt task is created', function (done) {
      nock(nwjsBaseUrl)
        .get(packageUrlPath)
        .replyWithFile(200, __dirname + '/package_fixtures/nwjs-v0.12.0-linux-x64.tar.gz');

      helpers.mockPrompt(gen, {
        'version': version,
        'platform': 'Linux64'
      });

      gen.run(function () {
        expect(gen.log.ok).to.have.been.calledWith('New grunt task generated.');
        expect(gen.log.info).to.have.been.calledWith('grunt Linux64_v0.12.0');
        done();
      });
    });
  });

});
