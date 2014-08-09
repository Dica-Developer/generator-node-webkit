var path = require('path');
var helpers = require('yeoman-generator').test;
var expect = require('chai').expect;

describe('Test prompt validations', function () {

  var app,
    deps = [
      [helpers.createDummyGenerator(), 'node-webkit:download']
    ];

  beforeEach(function () {
    app = helpers.run(path.join(__dirname, '../app'))
      .inDir(path.join(__dirname, './tmp'))
      .withOptions({ 'skip-install': true, 'skip-welcome-message': true })
      .withGenerators(deps);
  });

  it('App name has invalid character and should fail', function (done) {

    app
      .withPrompts({
        'appName': 'Test App',
        'appDescription': 'Test App Description',
        'githubUser': 'someuser'
      })
      .on('end', function () {
        expect(app.generator.prompt.errors).not.to.be.an('undefined');
        expect(app.generator.prompt.errors).to.have.length(1);
        expect(app.generator.prompt.errors).to.have.deep.property('[0].name', 'appName');
        expect(app.generator.prompt.errors).to.have.deep.property('[0].message', 'The application name should only consist of the following characters a-z, A-Z and 0-9.');
        done();
      });
  });

  it('App name has valid character and should not fail', function (done) {

    app
      .withPrompts({
        'appName': 'TestApp',
        'appDescription': 'Test App Description',
        'githubUser': 'someuser'
      })
      .on('end', function () {
        expect(app.generator.prompt.errors).to.be.an('undefined');
        done();
      });
  });
});