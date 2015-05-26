'use strict';

var path = require('path');
var assert = require('yeoman-generator').assert;
var helpers = require('yeoman-generator').test;
var fs = require('fs-extra');
var expect = require('chai').expect;
var exec = require('child_process').exec;

describe('grunt task', function () {
  var defaultOptions = {
      'appname': 'TestApp',
      'description': 'Test Description',
      'username': 'Test User',
      'examples': false
    },
    testDirectoryPath = path.join(__dirname, 'grunt.tmp'),
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


  describe('bumb', function () {
    var gen;

    beforeEach(function () {
      gen = helpers.createGenerator('node-webkit:app', deps, [], {
        'skip-install': true,
        'skip-welcome': true
      });
      helpers.mockPrompt(gen, defaultOptions);
    });

    it('should should set new patch version to package.json if no argument is given', function (done) {
      gen.run(function () {
        exec('grunt bump', function (error) {
          expect(error).to.be.null;
          fs.readJson(testDirectoryPath + '/package.json', function (error, packageObj) {
            if (error) {
              done(error);
            }

            expect(packageObj.version).to.equal('0.0.1');
            done();
          });
        });
      });
    });

    it('should should set new minor version to package.json if argument is "minor"', function (done) {
      gen.run(function () {
        exec('grunt bump:minor', function (error) {
          expect(error).to.be.null;
          fs.readJson(testDirectoryPath + '/package.json', function (error, packageObj) {
            if (error) {
              done(error);
            }

            expect(packageObj.version).to.equal('0.1.0');
            done();
          });
        });
      });
    });

    it('should should set new major version to package.json if argument is "major"', function (done) {
      gen.run(function () {
        exec('grunt bump:major', function (error) {
          expect(error).to.be.null;
          fs.readJson(testDirectoryPath + '/package.json', function (error, packageObj) {
            if (error) {
              done(error);
            }

            expect(packageObj.version).to.equal('1.0.0');
            done();
          });
        });
      });
    });
  });
});
