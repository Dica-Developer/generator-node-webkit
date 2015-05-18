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
      options: {
        mode: true
      },
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
    },
    rename: {
      '${taskname}': {
        files: [{
          src: '${'<%= paths.dist %>'}/${taskname}/${nwExecutable}.app',
          dest: '${'<%= paths.dist %>'}/${taskname}/${'<%= pkg.name %>'}.app'
        }]
      }
    }
  });

  grunt.registerTask('plist-${taskname}', 'set node webkit and app relevant information to a new plist file', function () {
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

  grunt.registerTask('dmg-${taskname}', 'Create dmg from previously created app folder in dist.', function () {
    var done = this.async(),
      createDmgCommand = 'resources/mac/package.sh "'+ pkg.name +'" "'+ paths.dist +'/${taskname}"',
      fs = require('fs'),
      exec = require('child_process').exec;

    fs.chmodSync('resources/mac/package.sh', '555');
    exec(createDmgCommand, function (error, stdout, stderr) {
      var result = true;
      if (stdout) {
        grunt.log.write(stdout);
      }
      if (stderr) {
        grunt.log.write(stderr);
      }
      if (error !== null) {
        grunt.log.error(error);
        result = false;
      }
      done(result);
    });
  });

  grunt.registerTask('${taskname}', function(dmg){
    grunt.task.run([
      'clean:${taskname}',
      'copy:${taskname}',
      'plist-${taskname}',
      'rename:${taskname}'
    ]);

    if(dmg){
      grunt.task.run('dmg-${taskname}');
    }
  });

};