var path = require('path');
var temp = require('temp');
var helpers = require('yeoman-generator').test;
var expect = require('chai').expect;

describe('Test prompt validations', function () {

  var app, workspace;

  beforeEach(function (done) {
    workspace = temp.mkdirSync();
    helpers.testDirectory(workspace, function (err) {
      if (err) {
        return done(err);
      }
      app = helpers.createGenerator('node-webkit:app', [
        path.resolve(__dirname, '../app')
      ]);

      app.options['skip-install'] = true;
      app.options['skip-welcome-message'] = true;

      done();
    });
  });

  afterEach(function () {
    temp.cleanup();
  });

  it('App name has invalid character and should fail', function (done) {

    helpers.mockPrompt(app, {
      'appName': 'Test App',
      'appDescription': 'Test App Description',
      'githubUser': 'someuser',
      downloadNodeWebkit: false,
      'platforms': ['Linux64']
    });

    app.run({}, function () {
      expect(app.prompt.errors).not.to.be.an('undefined');
      expect(app.prompt.errors).to.have.length(1);
      expect(app.prompt.errors).to.have.deep.property('[0].name', 'appName');
      expect(app.prompt.errors).to.have.deep.property('[0].message', 'The application name should only consist of the following characters a-z, A-Z and 0-9.');
      done();
    });
  });

  it('App name has valid character and should not fail', function (done) {

    helpers.mockPrompt(app, {
      'appName': 'TestApp',
      'appDescription': 'Test App Description',
      'githubUser': 'someuser',
      downloadNodeWebkit: false,
      'platforms': ['Linux64']
    });

    app.run({}, function () {
      expect(app.prompt.errors).to.be.an('undefined');
      done();
    });
  });
});