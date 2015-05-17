module.exports = function (grunt) {
  'use strict';

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
        files: [
          {
            expand: true,
            cwd: '${'<%= paths.nwjsSource %>'}/${srcFolder}',
            dest: '${'<%= paths.dist %>'}/${taskname}',
            src: '**'
          },
          {
            expand: true,
            cwd: '${'<%= paths.app %>'}',
            dest: '${'<%= paths.dist %>'}/${taskname}/${nwExecutable}.app/Contents/Resources/app.nw',
            src: '**'
          },
          {
            expand: true,
            cwd: '${'<%= paths.resources %>'}/mac',
            dest: '${'<%= paths.dist %>'}/${taskname}/${nwExecutable}.app/Contents/Resources',
            filter: 'isFile',
            src: '*.icns'
          }
        ]
      }
    }
  });

  grunt.registerTask('plist-${taskname}', 'set node webkit and app relevant information to a new plist file', function () {
    var paths = grunt.config.get('paths'),
      pkg = grunt.config.get('pkg');
    var infoPlistTmp = grunt.file.read(paths.resources + '/mac/Info.plist.tmp', {encoding: 'UTF8'}),
      infoPlist = grunt.template.process(infoPlistTmp, {
        data: {
          nwExecutable: '${nwExecutable}',
          version: pkg.version
        }
      });

    grunt.file.write(paths.dist + '/${taskname}/${nwExecutable}.app/Contents/Info.plist', infoPlist, {
      encoding: 'UTF8'
    });
  });

  grunt.registerTask('chmod-${taskname}', 'Add lost Permissions.', function () {
    var fs = require('fs'),
      paths = grunt.config.get('paths'),
      path = paths.dist + '/${taskname}/${nwExecutable}.app/Contents/';

    fs.chmodSync(path + 'Frameworks/${nwExecutable} Helper EH.app/Contents/MacOS/${nwExecutable} Helper EH', '555');
    fs.chmodSync(path + 'Frameworks/${nwExecutable} Helper NP.app/Contents/MacOS/${nwExecutable} Helper NP', '555');
    fs.chmodSync(path + 'Frameworks/${nwExecutable} Helper.app/Contents/MacOS/${nwExecutable} Helper', '555');
    fs.chmodSync(path + 'MacOS/${nwExecutable}', '555');
  });

  grunt.registerTask('${taskname}', [
    'clean:${taskname}',
    'copy:${taskname}',
    'plist-${taskname}',
    'chmod-${taskname}'
  ]);

};