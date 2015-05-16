'use strict';
var yeoman = require('yeoman-generator');
var GitHubApi = require('github');
var DecompressZip = require('decompress-zip');
var request = require('request');
var fs = require('fs');
var fsExtra = require('fs-extra');

var proxy = process.env.http_proxy || process.env.HTTP_PROXY || process.env.https_proxy || process.env.HTTPS_PROXY || null;
var githubOptions = {
  version: '3.0.0'
};

if (proxy) {
  githubOptions.proxy = {};
  githubOptions.proxy.host = url.parse(proxy).hostname;
  githubOptions.proxy.port = url.parse(proxy).port;
}

var github = new GitHubApi(githubOptions);
var EXAMPLE_DOWNLOAD_URL = 'https://github.com/zcbenz/nw-sample-apps/archive/master.zip';

module.exports = yeoman.generators.Base.extend({
  exampleList: [],
  EXAMPLES_ZIP_DESTINATION_PATH: '',
  EXAMPLES_EXTRACT_DESTINATION_PATH: '',
  initializing: {
    setup: function () {
      this.EXAMPLES_ZIP_DESTINATION_PATH = this.destinationPath('tmp/node-webkit-examples.zip');
      this.EXAMPLES_EXTRACT_DESTINATION_PATH = this.destinationRoot();
      this.EXAMPLES_PATH = 'nw-sample-apps-master';
    },
    fetchExamplesList: function () {
      var done = this.async();

      var exampleListReducer = function (exampleList, treeEntry) {
        if ('tree' === treeEntry.type) {
          exampleList.push(treeEntry.path);
        }
        return exampleList;
      };

      var githubCallback = function (err, resp) {
        this.exampleList = resp.tree.reduce(exampleListReducer, []);
        done();
      };

      github.gitdata.getTree({
        'user': 'zcbenz',
        'repo': 'nw-sample-apps',
        'sha': 'master'
      }, githubCallback.bind(this));
    }
  },
  prompting: function () {
    var done = this.async();

    var prompts = [{
      type: 'list',
      name: 'exampleName',
      message: 'Which example do you want to install?',
      choices: this.exampleList,
      save: true
    }];

    this.prompt(prompts, function (props) {
      this.exampleName = props.exampleName;
      done();
    }.bind(this));
  },

  download: function () {
    var self = this,
      done = this.async(),
      log = this.log.write();

    if (fs.existsSync(this.EXAMPLES_ZIP_DESTINATION_PATH)) {
      log.ok('Examples already downloaded. Skip to next step.');
      done();
      return;
    }

    log.info('... Fetching %s ...', EXAMPLE_DOWNLOAD_URL)
      .info('This might take a few moments');

    var writeStream = fs.createWriteStream(this.EXAMPLES_ZIP_DESTINATION_PATH);
    request
      .get(EXAMPLE_DOWNLOAD_URL)
      .on('error', function (err) {
        self.log.conflict(err);
      })
      .on('data', function () {
        log.write('.');
      })
      .pipe(writeStream);


    writeStream.on('finish', function () {
      log.write().ok('Done in ' + self.EXAMPLES_ZIP_DESTINATION_PATH).write();
      done();
    });
  },

  unzip: function () {
    var done = this.async(),
      unzipper = new DecompressZip('tmp/node-webkit-examples.zip'),
      log = this.log.write();

    if (fs.existsSync(this.EXAMPLES_EXTRACT_DESTINATION_PATH)) {
      log.ok('Examples already extracted. Skip to next step.');
      done();
      return;
    }

    log.info('... Unzipping examples in %s ...', this.EXAMPLES_EXTRACT_DESTINATION_PATH);

    unzipper.on('error', function (error) {
      this.log.conflict('Error while unzipping "tmp/node-webkit-examples.zip"', error);
    }.bind(this));

    unzipper.on('extract', function () {
      log.write().ok('Done unzipping examples.').write();
      done();
    }.bind(this));

    unzipper.extract({
      path: this.EXAMPLES_EXTRACT_DESTINATION_PATH
    });
  },

  installExample: function () {
    var done = this.async(),
      exampleSourcePath = this.destinationPath(this.EXAMPLES_PATH + '/' + this.exampleName);

    fsExtra.copy(exampleSourcePath, this.destinationPath('app'), function (error) {
      if (error) {
        self.log.conflict(error);
      }
      done();
    }.bind(this));
  }
});
