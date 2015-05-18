module.exports = function (grunt) {
  'use strict';

  var paths = grunt.config.get('paths'),
    pkg = grunt.config.get('pkg');

  grunt.config.merge({
    clean: {
      '${taskname}': {
        files: [{
          dot: true,
          src: ['${'<%= paths.dist %>'}/${taskname}/*', '.build']
        }]
      },
      'build-dir-${taskname}': {
        files: [{
          dot: true,
          src: ['.build/app.nw', '.build/nw.exe']
        }]
      }
    },
    copy: {
      '${taskname}': {
        options: {
          mode: true
        },
        files: [
          {
            expand: true,
            cwd: '${'<%= paths.nwjsSource %>'}/${srcFolder}',
            dest: '.build',
            src: '**'
          }
        ]
      }
    },
    compress: {
      'to-tmp-${taskname}': {
        options: {
          archive: '.build/app.nw',
          mode: 'zip'
        },
        files: [{
          expand: true,
          cwd: '${'<%= paths.app %>'}',
          src: ['**']
        }]
      },
      'final-app-${taskname}': {
        options: {
          archive: '${'<%= paths.dist %>'}/${taskname}/${'<%= pkg.name %>'}.zip'
        },
        files: [{
          expand: true,
          cwd: '.build',
          src: ['**']
        }]
      }
    }
  });

  grunt.registerTask('create-app-${taskname}', 'Create windows distribution.', function () {
    var done = this.async(),
      concat = require('concat-files');
    concat([
      '.build/nw.exe',
      '.build/app.nw'
    ], '.build/' + pkg.name + '.exe', function (error) {
      if(error){
        grunt.log.error(error);
        done(error);
      }
      done();
    });
  });

  grunt.registerTask('${taskname}', function(){
    grunt.task.run([
      'clean:${taskname}',
      'copy:${taskname}',
      'compress:to-tmp-${taskname}',
      'create-app-${taskname}',
      'clean:build-dir-${taskname}',
      'compress:final-app-${taskname}'
    ]);
  });

};
