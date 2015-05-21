# [NWJS](https://github.com/nwjs/nw.js) generator [![Build Status](https://secure.travis-ci.org/Dica-Developer/generator-node-webkit.png?branch=sparrow)](https://travis-ci.org/Dica-Developer/generator-node-webkit)

> Generator to easily maintain cross platform apps. The generator helps to setup a new project and package the app for different OS's and [nwjs](https://github.com/nwjs/nw.js) versions.

## Usage

Install ```generator-node-webkit```:

```
npm install -g generator-node-webkit
```

Make a new directory, and cd into it:

```
mkdir my-new-project && cd $_
```

Run ```yo node-webkit```:

```
yo node-webkit
```

## Generators

Available generators:

* App
    * [node-webkit](#app) (aka node-webkit:app)
* Download
    * [node-webkit:download](#download)
* Examples
    * [node-webkit:examples](#examples)
    
### App

Sets up a new nwjs app, generating all the boilerplate you need to get started.

Example:

```
yo node-webkit
```

### Download

Downloads a specific nwjs version for an OS of your choice.
Generates needed grunt task to build the final app.

Example: 

```
yo node-webkit:download
[?] Please specify which version of node-webkit you want to download: (v0.12.0)
[?] Which platform you develop on? (Use arrow keys)
    ❯ MacOS32
      MacOS64
      Linux32
      Linux64
      Windows32
```
