'use strict';

var semver = require('semver');

module.exports = function (grunt) {

  require('load-grunt-tasks')(grunt);
  require('time-grunt')(grunt);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    paths: {
      'nwjsSource': 'nwjs',
      'tmp': 'tmp',
      'app': 'app',
      'dist': 'dist',
      'resources': 'resources'
    },
    clean: {},
    copy: {},
    rename: {}
  });

  grunt.registerTask('bump', 'bump app version', function (type) {
    var packageContent = grunt.config.get('pkg');
    packageContent.version = semver.inc(packageContent.version, type || 'patch');
    grunt.file.write('package.json', JSON.stringify(packageContent, null, 2));
    grunt.config.set('pkg', grunt.file.readJSON('package.json'));
    grunt.log.ok('Version bumped to ' + packageContent.version);
  });

  grunt.loadTasks('./grunt-tasks');
};