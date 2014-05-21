var when = require('when');
var GitHubApi = require('github');
var request = require('request');
var fs = require('fs-extra');
var DecompressZip = require('decompress-zip');

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

function Examples(yeoman) {
  this.yeoman = yeoman;
  this.entries = [];
}

Examples.prototype.getExamplesOverview = function () {
  var defer = when.defer();
  github.gitdata.getTree(
    {
      'user': 'zcbenz',
      'repo': 'nw-sample-apps',
      'sha': 'master'
    },
    function(err, resp){
      defer.resolve(resp);
    }
  );
  return defer.promise;
};

Examples.prototype.getExampleList = function () {
  var _this = this;
  var defer = when.defer();
  this.getExamplesOverview()
    .then(function(resp){
      var list = [];
      resp.tree.forEach(function(treeEntry){
        if('tree' === treeEntry.type){
          list.push(treeEntry.path);
          _this.entries.push(treeEntry);
        }
      });
      defer.resolve(list);
    });
  return defer.promise;
};



Examples.prototype.downloadAndInstallExamples = function downloadAndInstallExamples(example) {
  this.example = example;
  var defer = when.defer();

  this.downloadExamples()
    .then(this.unzipExamples.bind(this))
    .then(this.installExamples.bind(this))
    .then(function(){
      defer.resolve();
    });

  return defer.promise;
};

Examples.prototype.downloadExamples = function downloadExamples() {
  var defer = when.defer();
  var _this = this;
  if (!fs.existsSync('tmp/node-webkit-examples.zip')) {
    this.yeoman.log.info('Downloading node-webkit examples');

    var writeStream = fs.createWriteStream('tmp/node-webkit-examples.zip');
    var req = request('https://github.com/zcbenz/nw-sample-apps/archive/master.zip')
      .pipe(writeStream);
    req.on('error', function (err) {
      _this.yeoman.log.conflict(err);
    });
    writeStream.on('finish', function () {
      defer.resolve();
    });

  } else {
    this.yeoman.log.ok('Node-webkit examples already downloaded');
    defer.resolve();
  }
  return defer.promise;
};

Examples.prototype.unzipExamples = function unzipExamples() {
  var defer = when.defer();
  var _this = this;
  if (fs.existsSync('tmp/node-webkit-examples.zip')) {
    this.yeoman.log.info('Unzip examples.');
    var unzipper = new DecompressZip('tmp/node-webkit-examples.zip');

    unzipper.on('error', function (error) {
      _this.yeoman.log.conflict('Error while unzipping "tmp/node-webkit-examples.zip"', error);
      defer.reject(error);
    });

    unzipper.on('extract', function () {
      _this.yeoman.log.ok('Examples successfully unzipped');
      defer.resolve();
    });

    unzipper.extract({
      path: 'tmp'
    });
  } else {
    defer.resolve();
  }
  return defer.promise;
};

Examples.prototype.installExamples = function installExamples() {
  var _this = this;
  var defer = when.defer();
  fs.copy('tmp/nw-sample-apps-master/'+ this.example, 'app', function(err){
    if(err){
      _this.yeoman.log.conflict('Error while copying example', err);
      defer.reject(err);
    }
    defer.resolve();
  });
  return defer.promise;
};

module.exports = Examples;
