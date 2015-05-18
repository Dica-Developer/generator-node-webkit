module.exports = function (grunt) {
  'use strict';

  var paths = grunt.config.get('paths'),
    pkg = grunt.config.get('pkg');

  grunt.config.merge({
    clean: {
      '${taskname}': {
        files: [{
          dot: true,
          src: ['${'<%= paths.dist %>'}/${taskname}/*']
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
            dest: '${'<%= paths.dist %>'}/${taskname}',
            src: 'nw.pak'
          },
          {
            expand: true,
            cwd: '${'<%= paths.nwjsSource %>'}/${srcFolder}',
            dest: '${'<%= paths.dist %>'}/${taskname}',
            src: 'nw'
          },
          {
            expand: true,
            cwd: '${'<%= paths.nwjsSource %>'}/${srcFolder}',
            dest: '${'<%= paths.dist %>'}/${taskname}',
            src: 'nw.dat'
          },
          {
            expand: true,
            cwd: '${'<%= paths.nwjsSource %>'}/${srcFolder}',
            dest: '${'<%= paths.dist %>'}/${taskname}',
            src: 'icudtl.dat'
          },
          {
            expand: true,
            cwd: '${'<%= paths.app %>'}',
            dest: '${'<%= paths.dist %>'}/${taskname}/app.nw',
            src: '**'
          }
        ]
      }
    }
  });

  grunt.registerTask('${taskname}', function(){
    grunt.task.run([
      'clean:${taskname}',
      'copy:${taskname}'
    ]);
  });

};
