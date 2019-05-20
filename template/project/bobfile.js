/**
 * {%= date %}
 * Buildfile.
 */
/** List jshint ignore directives here. **/
/* jshint undef: true, unused: true */
/* jslint node: true */
/* jshint esversion: 6 */
/* eslint-env es6 */

const Q = require('q');
const copy = require('promise-file-copy');
const concat = require('promise-file-concat');
const empty = require('promise-empty-dir');
const replace = require('promise-file-replace');

const build = module.exports = function (bob) { // jshint ignore:line
   /**
    * Set the current working directory for this bob for bob.resolve().
    */
   bob.cwd(__dirname);

   // Create the 'build' job.
   const o_job = bob.createJob('build');

   // Create the "build" job for widgets.
   const o_job_widgets = bob.createJob('widgets');

   // Add the dependencies from the widgets.
   o_job_widgets.addDependencies('build', [
      // bob.resolve('./widgets/my-widget')
   ], {});
   
   // Define what happens if the build fails.
   o_job.fail(function ( /*err*/) {
      console.log('Failed to build {%= name %}!');
      console.log('\n\n');
   });

   // Clean the build directories.
   o_job.addTask('empty', function () {
      return empty([
         './build',
         './temp'
      ], true);
   });

   // Add module build task.
   o_job.addTask('build-widgets', function(){
      return o_job_widgets.run();
   });

   // Concatenate the main js files for this app.
   o_job.addTask('concat', function() {
      return Q.all([

         // Copy independant files to temp.
         copy([
            './src/{%= name %}.html'
         ], './temp/index.html'),


         // Concat all of the css files together.
         concat([
            // './widgets/my-widget/build/my-widget.css',
            './src/{%= name %}.css'
         ],
            './temp/{%= name %}.css', {
            prependSourcePath: true,
            prependDatetime: true
         }),

         // Concat all of the js files together.
         concat([
            './node_modules/jquery-ui/ui/widget.js',
            './components/ui-state/ui-state.js',
            './components/ui-template/ui-template.js',
            // './widgets/my-widget/build/my-widget.js',
            './src/{%= name %}.js'
         ],
            './temp/{%= name %}.js', {
            prependSourcePath: true,
            prependDatetime: true,
            header: '(function( $, undefined ){\n',
            footer: '\n}( jQuery ));'
         })

      ]);

   });

   // Make replacements.
   o_job.addTask('replace-build', function () {
      return replace('./temp/index.html',
         [{
            search: /\{%= build-dist-folder %\}/g,
            replace: 'build'
         }, {
            search: /\{%= random %\}/g,
            replace: generateRandomString()
         }]);
   });

   // Copy temp to output folder.
   o_job.addTask('copy-build', function () {
      return copy('./temp', './public');
   });


   const oJobWatch = bob.createJob('watch');
   oJobWatch.addTask('watch', function () {
      // Run the main build job.
      return o_job.run()

         .then(function () {

            // Add an event listener on this bob for changes.
            bob.on('change', function ( /*bob, cPathChanged*/) {
               o_job.run();
            });
            // Setup the watcher for the main source.
            return bob.watch([
               // './widgets/my-widget',
               './src'
            ]);
         });
   });

   // Always return bob. :)
   return bob;
};// /build()

// Generate a random string.
const generateRandomString = function () {
   const cRandom = ''.concat(
      // Time stamp.
      new Date().getTime(),

      '-',

      // Eight character random integer.
      Math.round(Math.random() * 100000000)
   );

   return cRandom;
};// /generateRandomString()