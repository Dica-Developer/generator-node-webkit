module.exports = function (grunt) {
  'use strict';

  grunt.config.merge({
    clean: {
      '${taskname}': {
        files: [{
          dot: true,
          src: ['${'<%= paths.tmp %>'}/*', '${'<%= paths.dist %>'}/${taskname}/*']
        }]
      }
    },
    copy: {
      '${taskname}': {
        files: [
          {
            expand: true,
            cwd: '${'<%= paths.nwjsSource %>'}/${srcFolder}',
            dest: '${'<%= paths.tmp %>'}/${taskname}',
            src: '**'
          },
          {
            expand: true,
            cwd: '${'<%= paths.app %>'}',
            dest: '${'<%= paths.tmp %>'}/${taskname}/${nwExecutable}.app/Contents/Resources/app.nw',
            src: '**'
          }
        ]
      }
    }
  });

  grunt.registerTask('plist-${taskname}', 'set node webkit and app relevant information to a new plist file', function () {
    var paths = grunt.config.get('paths');
    var infoPlistTmp = grunt.file.read(paths.resources + '/mac/Info.plist.tmp', {encoding: 'UTF8'}),
      infoPlist = grunt.template.process(infoPlistTmp, {data: {nwExecutable: '${nwExecutable}'}});

    grunt.file.write(paths.tmp + '/${taskname}/${nwExecutable}.app/Contents/Info.plist', infoPlist, {
      encoding: 'UTF8'
    });
  });

  grunt.registerTask('chmod-${taskname}', 'Add lost Permissions.', function () {
    var fs = require('fs'),
      paths = grunt.config.get('paths'),
      path = paths.tmp + '/${taskname}/${nwExecutable}.app/Contents/';

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