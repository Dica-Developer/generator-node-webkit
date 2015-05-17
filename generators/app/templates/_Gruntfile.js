module.exports = function (grunt) {
  'use strict';

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
    copy: {}
  });

  grunt.loadTasks('./grunt-tasks');
};