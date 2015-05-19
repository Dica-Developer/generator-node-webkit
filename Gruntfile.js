'use strict';
var shell = require('shelljs'),
  process = require('child_process'),
  fs = require('fs-extra'),
  path = require('path');

module.exports = function (grunt) {
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    mochacov: {
      local: {
        options: {
          reporter: 'spec'
        },
        all: ['test/*.js']
      },
      travis: {}
    }
  });

  grunt.registerTask('updateFixtures', 'updates package and bower fixtures', function () {
    var done = this.async(),
      packageJson = fs.readFileSync(path.resolve('generators/app/templates/_package.json'), 'utf8');

    fs.ensureDirSync(__dirname + '/test/fixtures');

    // replace package name
    packageJson = grunt.template.process(packageJson, {
      appname: 'TestApp',
      description: 'Test Description'
    });

    fs.writeFile(path.resolve(__dirname + '/test/fixtures/package.json'), packageJson, done);
  });

  grunt.registerTask('installFixtures', 'install package and bower fixtures', function () {
    var done = this.async();

    shell.cd('test/fixtures');
    grunt.log.ok('installing npm dependencies for generated app');
    process.exec('npm install --quiet', {cwd: '../fixtures'}, function (error, stdout, stderr) {
      shell.cd('../../');
      done();
    });

  });

  grunt.registerTask('test', ['updateFixtures', 'installFixtures', 'mochacov:local']);
  grunt.registerTask('travis', ['updateFixtures', 'installFixtures', 'mochacov:travis']);
};