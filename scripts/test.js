'use strict';

// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'test';
process.env.NODE_ENV = 'test';
process.env.PUBLIC_URL = '';


// Can't load ts from here, need another way
// import {onFailureDiff} from "../src/manifold-dx/types/StateMutationDiagnostics";
// import {onFailureDefault} from "../src/manifold-dx/types/StateMutationCheck";
// onFailureDefault = onFailureDiff;


// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', err => {
  throw err;
});

// Ensure environment variables are read.
require('../config/env');

const jest = require('jest');
const argv = process.argv.slice(2);

// Watch unless on CI or in coverage mode, --forceExit allows us to debug locally
if (!process.env.CI && argv.indexOf('--coverage') < 0 && argv.indexOf('--forceExit') < 0) {
  argv.push('--watch');
}


jest.run(argv);
