'use strict';

var path = require('path');
var assert = require('yeoman-generator').assert;
var helpers = require('yeoman-generator').test;
var fs = require('fs-extra');
var expect = require('chai').expect;

describe('node-webkit:app', function () {
  var defaultOptions = {
      'appname': 'TestApp',
      'description': 'Test Description',
      'username': 'Test User',
      'examples': false
    },
    testDirectoryPath = path.join(__dirname, 'app.tmp'),
    testDirectory = helpers.setUpTestDirectory(testDirectoryPath),
    deps = ['../../generators/app', [helpers.createDummyGenerator(), 'node-webkit:download']];

  beforeEach(function (done) {
    testDirectory(function () {
      fs.emptyDirSync(testDirectoryPath);
      fs.writeJsonSync(testDirectoryPath + '/.yo-rc.json', {'generator-node-webkit': {}});
      fs.symlinkSync(__dirname + '/fixtures/node_modules', testDirectoryPath + '/node_modules');
      done();
    });
  });

  afterEach(function (done) {
    fs.remove(testDirectoryPath, done);
  });

  describe('Running app', function () {

    describe('with correct prompt answers', function () {
      var gen;

      beforeEach(function () {
        gen = helpers.createGenerator('node-webkit:app', deps, [], {
          'skip-install': true,
          'skip-welcome': true
        });
        helpers.mockPrompt(gen, defaultOptions);
      });

      it('should add all necessary files', function (done) {
        gen.run(function () {
          assert.file([
            'package.json',
            'resources/mac/Info.plist.tmp',
            'resources/mac/background.png',
            'resources/mac/dmgStyler.applescript',
            'resources/mac/icon.icns',
            'resources/mac/package.sh',
            'Gruntfile.js',
            '.editorconfig',
            '.jshintrc',
            '.gitignore'
          ]);
          done();
        });
      });

      it('should add correct values to package json', function (done) {
        gen.run(function () {
          fs.readJSON(testDirectoryPath + '/package.json', function (error, pkg) {
            if (error) {
              done(error);
            }

            expect(pkg.name).to.be.equal(defaultOptions.appname);
            expect(pkg.description).to.be.equal(defaultOptions.description);
            done();
          });

        });
      });


      it('should add correct values to plist file', function (done) {
        gen.run(function () {
          fs.readFile(testDirectoryPath + '/resources/mac/Info.plist.tmp', {'encoding': 'utf8'}, function (error, plist) {
            if (error) {
              done(error);
            }

            expect(plist).to.match(/<string>TestApp<\/string>/);
            expect(plist).to.match(/<string><%= nwExecutable %><\/string>/);
            expect(plist).to.match(/<string><%= version %><\/string>/);
            done();
          });

        });
      });
    });

  });
});
