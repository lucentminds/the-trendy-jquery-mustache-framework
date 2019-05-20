#!/usr/bin/env node

/** List jshint ignore directives here. **/
/* jshint node:true */
/* jshint esversion:6 */
/* eslint-env es6 */

const Q = require( 'q' );
// const deferred = Q.defer();
// const Module = module.exports = {};

const argv = require('minimist')(process.argv.slice(2),{
   default: {
      help: false,
      make: null,
      desc: '',
      
   }
});

const c_command = argv._[0];

switch( c_command ){
case 'make':
   require( './lib/cmd_make' )( argv );
   break;

default:
console.error( `Invalid command: ${c_command}` );
}// /switch()