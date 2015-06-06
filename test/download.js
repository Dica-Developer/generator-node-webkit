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
  exec = require('child_process').exec,

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
  var gen, testDirectoryPath = path.join(__dirname, 'download.tmp'),
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

  afterEach(function (done) {
    restoreLog(gen);
    fs.remove(testDirectoryPath, done);
  });

  describe('package download url', function () {

    describe('for version >= v0.12.0', function () {
      var PLATFORMS_MAP = {
          'MacOS32': 'osx-ia32.zip',
          'MacOS64': 'osx-x64.zip',
          'Linux32': 'linux-ia32.tar.gz',
          'Linux64': 'linux-x64.tar.gz',
          'Windows32': 'win-ia32.zip'
        },
        version = 'v0.12.0';

      Object.keys(PLATFORMS_MAP).forEach(function (platform) {

        it('should call "' + nwjsBaseUrl + '/' + version + '/nwjs-' + version + '-' + PLATFORMS_MAP[platform], function (done) {
          var scope = nock(nwjsBaseUrl)
            .get('/' + version + '/nwjs-' + version + '-' + PLATFORMS_MAP[platform])
            .reply(200, {});

          helpers.mockPrompt(gen, {
            'nwjsVersion': version,
            'platform': platform
          });

          gen.run(function () {
            expect(scope.isDone()).to.be.true;
            done();
          });
        });

      });

    });

    describe('for version < v0.12.0', function () {
      var PLATFORMS_MAP = {
          'MacOS32': 'osx-ia32.zip',
          'MacOS64': 'osx-x64.zip',
          'Linux32': 'linux-ia32.tar.gz',
          'Linux64': 'linux-x64.tar.gz',
          'Windows32': 'win-ia32.zip'
        },
        version = 'v0.10.0';

      Object.keys(PLATFORMS_MAP).forEach(function (platform) {

        it('should call "' + nwjsBaseUrl + '/' + version + '/node-webkit-' + version + '-' + PLATFORMS_MAP[platform], function (done) {
          var scope = nock(nwjsBaseUrl)
            .get('/' + version + '/node-webkit-' + version + '-' + PLATFORMS_MAP[platform])
            .reply(200, {});

          helpers.mockPrompt(gen, {
            'nwjsVersion': version,
            'platform': platform
          });

          gen.run(function () {
            expect(scope.isDone()).to.be.true;
            done();
          });
        });

      });
    });
  });

  //describe('package extract', function () {
  //});

  describe('grunt task', function () {

    var defaultOptions = {
        'appname': 'TestApp',
        'description': 'Test Description',
        'username': 'Test User',
        'exampleName': 'Continue without an example',
        'platform': false,
        'nwjsVersion': false
      },
      appGeneratorDeps = ['../../generators/app', [helpers.createDummyGenerator(), 'node-webkit:download']];

    describe('for linux', function () {

      beforeEach(function (done) {

        var appGenerator = helpers.createGenerator('node-webkit:app', appGeneratorDeps, [], {
          'skip-install': true,
          'skip-welcome': true
        });

        nock(nwjsBaseUrl)
          .get('/v0.12.0/nwjs-v0.12.0-linux-x64.tar.gz')
          .replyWithFile(200, __dirname + '/package_fixtures/nwjs-v0.12.0-linux-x64.tar.gz');

        helpers.mockPrompt(appGenerator, defaultOptions);
        helpers.mockPrompt(gen, {
          'nwjsVersion': 'v0.12.0',
          'platform': 'Linux64'
        });

        appGenerator.run(done);
      });

      it('should copy nwjs source into dist folder', function (done) {
        gen.run(function () {
          exec('grunt Linux64_v0.12.0', function (error) {
            expect(error).to.be.null;
            assert.file(
              [
                'dist/Linux64_v0.12.0/icudtl.dat',
                'dist/Linux64_v0.12.0/nw',
                'dist/Linux64_v0.12.0/nw.pak'
              ]
            );
            done();
          });
        });
      });

      it('should copy app files into dist folder', function (done) {
        gen.run(function () {
          fs.ensureDirSync(testDirectoryPath + '/app');
          fs.writeJsonFile(testDirectoryPath + '/app/shouldExist.json', {'should-exist': true}, function () {
            exec('grunt Linux64_v0.12.0', function (error) {
              expect(error).to.be.null;
              assert.file([testDirectoryPath + '/dist/Linux64_v0.12.0/app.nw/shouldExist.json']);
              done();
            });
          });
        });
      });

      it('should create correct dist folder', function (done) {
        gen.run(function () {
          exec('grunt Linux64_v0.12.0', function (error, stdout) {
            expect(error).to.be.null;
            expect(stdout).to.match(/clean:Linux64_v0\.12\.0/);
            expect(stdout).to.match(/copy:Linux64_v0\.12\.0/);
            expect(stdout).to.match(/Done, without errors\./);
            expect(fs.existsSync(testDirectoryPath + '/dist/Linux64_v0.12.0')).to.be.true;
            done();
          });
        });
      });

    });

    describe('for mac', function () {

      beforeEach(function (done) {

        var appGenerator = helpers.createGenerator('node-webkit:app', appGeneratorDeps, [], {
          'skip-install': true,
          'skip-welcome': true
        });

        nock(nwjsBaseUrl)
          .get('/v0.12.0/nwjs-v0.12.0-osx-x64.zip')
          .replyWithFile(200, __dirname + '/package_fixtures/nwjs-v0.12.0-osx-x64.zip');

        helpers.mockPrompt(appGenerator, defaultOptions);
        helpers.mockPrompt(gen, {
          'nwjsVersion': 'v0.12.0',
          'platform': 'MacOS64'
        });

        appGenerator.run(done);
      });

      it('should create correct dist folder', function (done) {
        gen.run(function () {
          exec('grunt MacOS64_v0.12.0', function (error, stdout) {
            expect(error).to.be.null;
            expect(stdout).to.match(/clean:MacOS64_v0\.12\.0/);
            expect(stdout).to.match(/copy:MacOS64_v0\.12\.0/);
            expect(stdout).to.match(/Done, without errors\./);
            expect(fs.existsSync(testDirectoryPath + '/dist/MacOS64_v0.12.0')).to.be.true;
            done();
          });
        });
      });

      it('should copy nwjs source into dist folder', function (done) {
        gen.run(function () {
          exec('grunt MacOS64_v0.12.0', function (error) {
            expect(error).to.be.null;
            assert.file([
              'dist/MacOS64_v0.12.0/credits.html',
              'dist/MacOS64_v0.12.0/nwjc',
              'dist/MacOS64_v0.12.0/TestApp.app'
            ]);
            done();
          });
        });
      });

      it('should copy app files into dist folder', function (done) {
        gen.run(function () {
          fs.ensureDirSync(testDirectoryPath + '/app');
          fs.writeJsonFile(testDirectoryPath + '/app/shouldExist.json', {'should-exist': true}, function () {
            exec('grunt MacOS64_v0.12.0', function (error) {
              expect(error).to.be.null;
              assert.file([testDirectoryPath + '/dist/MacOS64_v0.12.0/TestApp.app/Contents/Resources/app.nw/shouldExist.json']);
              done();
            });
          });
        });
      });

      // does only work on Mac OS
      it.skip('should create dmg if parameter is given', function (done) {
        this.timeout('35000');
        gen.run(function () {
          fs.ensureDirSync(testDirectoryPath + '/app');
          fs.writeJsonFile(testDirectoryPath + '/app/shouldExist.json', {'should-exist': true}, function () {
            exec('grunt MacOS64_v0.12.0:dmg', function (error) {
              expect(error).to.be.null;
              assert.file([testDirectoryPath + '/dist/MacOS64_v0.12.0/TestApp.dmg']);
              done();
            });
          });
        });
      });

    });

    describe('for windows', function () {

      beforeEach(function (done) {

        var appGenerator = helpers.createGenerator('node-webkit:app', appGeneratorDeps, [], {
          'skip-install': true,
          'skip-welcome': true
        });

        nock(nwjsBaseUrl)
          .get('/v0.12.0/nwjs-v0.12.0-win-ia32.zip')
          .replyWithFile(200, __dirname + '/package_fixtures/nwjs-v0.12.0-win-ia32.zip');

        helpers.mockPrompt(appGenerator, defaultOptions);
        helpers.mockPrompt(gen, {
          'nwjsVersion': 'v0.12.0',
          'platform': 'Windows32'
        });

        appGenerator.run(done);
      });

      it('should create correct dist folder', function (done) {
        gen.run(function () {
          exec('grunt Windows32_v0.12.0', function (error, stdout) {
            expect(error).to.be.null;
            expect(stdout).to.match(/Done, without errors\./);
            expect(fs.existsSync(testDirectoryPath + '/dist/Windows32_v0.12.0')).to.be.true;
            done();
          });
        });
      });

      it('should create an app zip file', function (done) {
        gen.run(function () {
          exec('grunt Windows32_v0.12.0', function (error) {
            expect(error).to.be.null;
            assert.file('dist/Windows32_v0.12.0/TestApp.zip');
            done();
          });
        });
      });
    });
  });

  describe('with version < v0.12.0', function () {
    var packageUrlPath = '/v0.10.0/node-webkit-v0.10.0-linux-x64.tar.gz';

    it('should call "node-webkit" url', function (done) {
      var scope = nock(nwjsBaseUrl)
        .get(packageUrlPath)
        .reply(200, {});

      helpers.mockPrompt(gen, {
        'nwjsVersion': 'v0.10.0',
        'platform': 'Linux64'
      });

      gen.run(function () {
        expect(scope.isDone()).to.be.true;
        done();
      });
    });

    it('should create correct Gruntfile', function (done) {
      nock(nwjsBaseUrl)
        .get(packageUrlPath)
        .reply(200, {});

      helpers.mockPrompt(gen, {
        'nwjsVersion': 'v0.10.0',
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
        'nwjsVersion': 'v0.10.0',
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
        'nwjsVersion': 'v0.10.0',
        'platform': 'Linux64'
      });

      gen.run(function () {
        expect(gen.log.ok).to.have.been.calledWith('New grunt task generated.');
        expect(gen.log.info).to.have.been.calledWith('grunt Linux64_v0.10.0');
        done();
      });
    });

    it('should skip download if extracted package folder already exists', function (done) {
      var scope = nock(nwjsBaseUrl)
        .get(packageUrlPath)
        .reply(200, {});

      helpers.mockPrompt(gen, {
        'nwjsVersion': 'v0.10.0',
        'platform': 'Linux64'
      });

      fs.mkdirs(testDirectoryPath + '/nwjs/node-webkit-v0.10.0-linux-x64', function (error) {
        if (error) {
          done(error);
        }

        gen.run(function () {
          expect(scope.isDone()).to.be.false;
          expect(gen.log.ok).to.have.been.calledWith('NWJS already downloaded. Skip to next step.');
          fs.remove(testDirectoryPath + '/nwjs/node-webkit-v0.10.0-linux-x64', done);
        });
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
        'nwjsVersion': version,
        'platform': 'Linux64'
      });

      gen.run(function () {
        expect(scope.isDone()).to.be.true;
        done();
      });
    });

    it('should create correct Gruntfile', function (done) {
      nock(nwjsBaseUrl)
        .get(packageUrlPath)
        .reply(200, {});

      helpers.mockPrompt(gen, {
        'nwjsVersion': version,
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
        'nwjsVersion': version,
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
        'nwjsVersion': version,
        'platform': 'Linux64'
      });

      gen.run(function () {
        expect(gen.log.ok).to.have.been.calledWith('New grunt task generated.');
        expect(gen.log.info).to.have.been.calledWith('grunt Linux64_v0.12.0');
        done();
      });
    });

    it('should skip download if extracted package folder already exists', function (done) {
      var scope = nock(nwjsBaseUrl)
        .get(packageUrlPath)
        .reply(200, {});

      helpers.mockPrompt(gen, {
        'nwjsVersion': version,
        'platform': 'Linux64'
      });

      fs.mkdirs(testDirectoryPath + '/nwjs/nwjs-v0.12.0-linux-x64', function (error) {
        if (error) {
          done(error);
        }

        gen.run(function () {
          expect(scope.isDone()).to.be.false;
          expect(gen.log.ok).to.have.been.calledWith('NWJS already downloaded. Skip to next step.');
          fs.remove(testDirectoryPath + '/nwjs/nwjs-v0.12.0-linux-x64', done);
        });
      });
    });
  });

});
