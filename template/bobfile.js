/**
 * {%= date %}
 * Buildfile.
 */

/** List jshint ignore directives here. **/
/* jshint undef: true, unused: true */
/* jslint node: true */
/* jshint esversion: 6 */
/* eslint-env es6 */

var Q = require( 'q' );
var copy = require( 'promise-file-copy' );
var concat = require( 'promise-file-concat' );
var empty = require( 'promise-empty-dir' );
var jsify = require( 'promise-file-jsify' );
var write = require( 'promise-file-write' );
//var replace = require( 'promise-file-replace' );

var build = module.exports = function( bob ){ // jshint ignore:line
   // Create the 'build' job for all.
   var oJobBuild = bob.createJob( 'build' );

   var onBuildFail = function( /*err*/ ){
      console.log( 'Failed to build {%= name %}!' );
      console.log( '\n\n' );
   };// /onBuildFail()

   /**
    * Set the current working directory for this bob for bob.resolve().
    */
   bob.cwd( __dirname );

   // Clean the build directories.
   oJobBuild.addTask( 'empty', function(){
      return empty([
         bob.resolve( './build' ),
         bob.resolve( './temp' )
      ], true );
   });

   // Jsify the html files for this plugin.
   oJobBuild.addTask( 'jsify', function(){
      // Jsify and minify.
      return jsify( bob.resolve( './src/{%= name %}.htm' ), true )
      .then(function( cResult ){

         var cJs;

         cResult = cResult.replace( /'/g, '\\\'' );

         cJs = "var cTemplate='".concat( cResult, "';");
         return write( bob.resolve( './temp/{%= name %}-htm.js' ), cJs );
      });
   });

   // Concatenate the main js files for this plugin.
   oJobBuild.addTask( 'concat', function(){



      return Q.all([

         

         copy( bob.resolve('./src/{%= name %}.css' ), bob.resolve( './build' ) ),



         concat( [

            bob.resolve( './temp/{%= name %}-htm.js' ),
            bob.resolve( './src/{%= name %}.js' ),
         ], bob.resolve( './build/{%= name %}.js' ), {
            prependDatetime: true,
            prependSourcePath: true,
            header: '(function( window, undefined ){\n',
            footer: '\n}( window ));'
         } )



      ]);
   });

   oJobBuild.fail( onBuildFail );

   // Always return bob. :)
   return bob;

};// /build()
