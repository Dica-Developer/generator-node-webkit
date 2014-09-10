/*jshint camelcase: false*/

module.exports = function (grunt) {
  'use strict';

  // load all grunt tasks
  require('time-grunt')(grunt);
  require('load-grunt-tasks')(grunt);

  // configurable paths
  var config = {
    app: 'app',
    dist: 'dist',
    distMac: 'dist/MacOS',
    distLinux32: 'dist/Linux32',
    distLinux64: 'dist/Linux64',
    distWin: 'dist/Win',
    tmp: 'buildTmp',
    resources: 'resources'
  };

  grunt.initConfig({
    config: config,
    clean: {
      dist: {
        files: [{
          dot: true,
          src: [
            '<%%= config.dist %>/*',
            '<%%= config.tmp %>/*'
          ]
        }]
      },
      distMac: {
        files: [{
          dot: true,
          src: [
            '<%%= config.distMac %>/*',
            '<%%= config.tmp %>/*'
          ]
        }]
      },
      distLinux64: {
        files: [{
          dot: true,
          src: [
            '<%%= config.distLinux64 %>/*',
            '<%%= config.tmp %>/*'
          ]
        }]
      },
      distLinux32: {
        files: [{
          dot: true,
          src: [
            '<%%= config.distLinux32 %>/*',
            '<%%= config.tmp %>/*'
          ]
        }]
      },
      distWin: {
        files: [{
          dot: true,
          src: [
            '<%%= config.distWin %>/*',
            '<%%= config.tmp %>/*'
          ]
        }]
      }
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      files: '<%%= config.app %>/js/*.js'
    },
    copy: {
      appLinux: {
        files: [{
          expand: true,
          cwd: '<%%= config.app %>',
          dest: '<%%= config.distLinux64 %>/app.nw',
          src: '**'
        }]
      },
      appLinux32: {
        files: [{
          expand: true,
          cwd: '<%%= config.app %>',
          dest: '<%%= config.distLinux32 %>/app.nw',
          src: '**'
        }]
      },
      appMacos: {
        files: [{
          expand: true,
          cwd: '<%%= config.app %>',
          dest: '<%%= config.distMac %>/node-webkit.app/Contents/Resources/app.nw',
          src: '**'
        }, {
          expand: true,
          cwd: '<%%= config.resources %>/mac/',
          dest: '<%%= config.distMac %>/node-webkit.app/Contents/',
          filter: 'isFile',
          src: '*.plist'
        }, {
          expand: true,
          cwd: '<%%= config.resources %>/mac/',
          dest: '<%%= config.distMac %>/node-webkit.app/Contents/Resources/',
          filter: 'isFile',
          src: '*.icns'
        }, {
          expand: true,
          cwd: '<%%= config.app %>/../node_modules/',
          dest: '<%%= config.distMac %>/node-webkit.app/Contents/Resources/app.nw/node_modules/',
          src: '**'
        }]
      },
      webkit: {
        files: [{
          expand: true,
          cwd: '<%%=config.resources %>/node-webkit/MacOS',
          dest: '<%%= config.distMac %>/',
          src: '**'
        }]
      },
      copyWinToTmp: {
        files: [{
          expand: true,
          cwd: '<%%= config.resources %>/node-webkit/Windows/',
          dest: '<%%= config.tmp %>/',
          src: '**'
        }]
      }
    },
    compress: {
      appToTmp: {
        options: {
          archive: '<%%= config.tmp %>/app.zip'
        },
        files: [{
          expand: true,
          cwd: '<%%= config.app %>',
          src: ['**']
        }]
      },
      finalWindowsApp: {
        options: {
          archive: '<%%= config.distWin %>/<%= appName %>.zip'
        },
        files: [{
          expand: true,
          cwd: '<%%= config.tmp %>',
          src: ['**']
        }]
      }
    },
    rename: {
      macApp: {
        files: [{
          src: '<%%= config.distMac %>/node-webkit.app',
          dest: '<%%= config.distMac %>/<%= appName %>.app'
        }]
      },
      zipToApp: {
        files: [{
          src: '<%%= config.tmp %>/app.zip',
          dest: '<%%= config.tmp %>/app.nw'
        }]
      }
    }
  });

  grunt.registerTask('chmod', 'Add lost Permissions.', function () {
    var fs = require('fs'),
      path = config.distMac + '<%= appName %>.app/Contents/';
    fs.chmodSync(path + 'Frameworks/node-webkit Helper EH.app/Contents/MacOS/node-webkit Helper EH', '555');
    fs.chmodSync(path + 'Frameworks/node-webkit Helper NP.app/Contents/MacOS/node-webkit Helper NP', '555');
    fs.chmodSync(path + 'Frameworks/node-webkit Helper.app/Contents/MacOS/node-webkit Helper', '555');
    fs.chmodSync(path + 'MacOS/node-webkit', '555');
  });

  grunt.registerTask('createLinuxApp', 'Create linux distribution.', function (version) {
    var done = this.async();
    var childProcess = require('child_process');
    var exec = childProcess.exec;
    var path = './' + (version === 'Linux64' ? config.distLinux64 : config.distLinux32);
    exec('mkdir -p ' + path + '; cp resources/node-webkit/' + version + '/nw.pak ' + path + ' && cp resources/node-webkit/' + version + '/nw ' + path + '/node-webkit', function (error, stdout, stderr) {
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

  grunt.registerTask('createWindowsApp', 'Create windows distribution.', function () {
    var done = this.async();
    var concat = require('concat-files');
    concat([
      'buildTmp/nw.exe',
      'buildTmp/app.nw'
    ], 'buildTmp/<%= appName %>.exe', function () {
      var fs = require('fs');
      fs.unlink('buildTmp/app.nw', function (error, stdout, stderr) {
        if (stdout) {
          grunt.log.write(stdout);
        }
        if (stderr) {
          grunt.log.write(stderr);
        }
        if (error !== null) {
          grunt.log.error(error);
          done(false);
        } else {
          fs.unlink('buildTmp/nw.exe', function (error, stdout, stderr) {
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
        }
      });
    });
  });

  grunt.registerTask('setVersion', 'Set version to all needed files', function (version) {
    var config = grunt.config.get(['config']);
    var appPath = config.app;
    var resourcesPath = config.resources;
    var mainPackageJSON = grunt.file.readJSON('package.json');
    var appPackageJSON = grunt.file.readJSON(appPath + '/package.json');
    var infoPlistTmp = grunt.file.read(resourcesPath + '/mac/Info.plist.tmp', {
      encoding: 'UTF8'
    });
    var infoPlist = grunt.template.process(infoPlistTmp, {
      data: {
        version: version
      }
    });
    mainPackageJSON.version = version;
    appPackageJSON.version = version;
    grunt.file.write('package.json', JSON.stringify(mainPackageJSON, null, 2), {
      encoding: 'UTF8'
    });
    grunt.file.write(appPath + '/package.json', JSON.stringify(appPackageJSON, null, 2), {
      encoding: 'UTF8'
    });
    grunt.file.write(resourcesPath + '/mac/Info.plist', infoPlist, {
      encoding: 'UTF8'
    });
  });

  grunt.registerTask('dist-linux', [
    'jshint',
    'clean:distLinux64',
    'copy:appLinux',
    'createLinuxApp:Linux64'
  ]);

  grunt.registerTask('dist-linux32', [
    'jshint',
    'clean:distLinux32',
    'copy:appLinux32',
    'createLinuxApp:Linux32'
  ]);

  grunt.registerTask('dist-win', [
    'jshint',
    'clean:distWin',
    'copy:copyWinToTmp',
    'compress:appToTmp',
    'rename:zipToApp',
    'createWindowsApp',
    'compress:finalWindowsApp'
  ]);

  grunt.registerTask('dist-mac', [
    'jshint',
    'clean:distMac',
    'copy:webkit',
    'copy:appMacos',
    'rename:macApp',
    'chmod'
  ]);

  grunt.registerTask('check', [
    'jshint'
  ]);

  grunt.registerTask('dmg', 'Create dmg from previously created app folder in dist.', function () {
    var done = this.async();
    var createDmgCommand = 'resources/mac/package.sh "<%= appName %>"';
    require('child_process').exec(createDmgCommand, function (error, stdout, stderr) {
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

};
