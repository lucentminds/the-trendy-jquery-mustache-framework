/**
 * 09-06-2016
 * The best app ever..
 * ~~ Scott Johnson
 */


/** List jshint ignore directives here. **/
/* jslint node: true */

var path = require( 'path' );
var fs = require( 'fs' );
var prompt = require( 'prompt' );
var colors = require( 'colors/safe' );
var fse = require( 'fs-extra' );
var klaw = require( 'klaw' );
var extend = Object.assign;
var Q = require( 'q' );

var ProjectInit = module.exports = function( oOptions ){
   var self;
   var oSettings = extend( {
      colors: true,
      delimiter: '',
      message: ''.concat( '[',colors.green( '?' ), '] ' )
   }, oOptions );
   
   extend( prompt, oSettings );
   self = extend({}, ProjectInit.prototypes );

   // Required to start the prompt on the screen.
   prompt.start();
   return self;
};// /ProjectInit()

ProjectInit.prototypes = {};
ProjectInit.util = {};


// Start prompting
ProjectInit.prototypes.get = function( oDefaults/* , fnCallback */ ){
   var i, deferred = Q.defer();
   /* var self = this; */

   var onPromptsComplete = function( err, oResult ){
      var i;
      
      if ( err ) {
         if ( err.message && err.message == 'canceled' ) {
            console.log( ' ' );
            console.log( colors.red( 'Abort: SIGINT detected.' ) );
            process.exit( 1 );
         }
         
         deferred.reject( err );
         return;
      }

      // Update the defaults with the latest values.
      for( i in oResult ) {
         oDefaults.properties[ i ]['default'] = oResult[i];
      }// /oDefaults()

      if ( oResult.changes.toLowerCase() == 'y' ) {
         oDefaults.properties.changes['default'] = 'n';
         console.log( ' ' );
         prompt.get( oDefaults, onPromptsComplete );
         return;
      }

      deferred.resolve( oResult );
   };// /onPromptsComplete()

   oDefaults.properties.changes = {
      description: 'Do you need to make any changes to the above before continuing? y/N',
      pattern: /y|n/i,
      'default': 'n', 
      required: false
   };

   for( i in oDefaults.properties ) {
      oDefaults.properties[ i ].description = colors.reset( oDefaults.properties[ i ].description );
   }// /for()
   
   prompt.get( oDefaults, onPromptsComplete );

   return deferred.promise;
};// /get()

/**
 * This method replaces all templated tokens found in a string with values found
 * in this instance's settings.
 */
ProjectInit.prototypes._replaceTokens = function( cString ) {
   var n, r;

   /**
    * Loop over each setting and make a replacement with it's corresponding
    * template token in this string if any. If there is not corresponding token
    * name, we will leave it alone.
    */
   for( n in this.oSettings ){
      r = new RegExp( ''.concat( '{%= ',n,' %}' ), 'g' );
      cString = cString.replace( r, this.oSettings[n] );
   }// /for()

   return cString;
};// /_replaceTokens()

ProjectInit.prototypes._createPathMap = function( oSettings ) {
   var deferred = Q.defer();
   var self = this;
   var cPathRelative, oStatIn, aMap = [];
   //var cPathSourceDir = oSettings.path_source.concat( '\\' );
   var cPathSourceDir = oSettings.path_source.concat( path.sep );
   var cReplacementPath;

   //fse.walk( oSettings.path_source )
   klaw( oSettings.path_source )
      .on( 'data', function( oItem ) {
         oStatIn = fs.lstatSync( oItem.path );
         cPathRelative = oItem.path
            .replace( cPathSourceDir, '' )
            .replace( /\\/g, '/' );

         if ( oStatIn.isDirectory() ) {
            return;
         }


         cReplacementPath = oSettings.rename[ cPathRelative ];
         if( cReplacementPath ){
            cPathRelative = self._replaceTokens( cReplacementPath );
         }

         aMap.push({
            extension: path.extname( oItem.path ).toLowerCase(),
            path_destination: path.join( oSettings.path_destination, cPathRelative ),
            path_relative: cPathRelative,
            path_source: oItem.path
         });
         //
         //console.log( ' ' );
         //console.log( oItem.path );

      })
      .on( 'end', function() {
         /* var cFilepath = ''; */
         //console.log( oSettings );
         //console.log( ' ' );
         //console.log( aMap );
         //console.log( ' ' );
         //process.exit();

         deferred.resolve( aMap );

      }.bind( this ));

   return deferred.promise;
};// /_createPathMap()

/**
 * This function is called after we've completed collecting all of the prompt
 * information.
 */
ProjectInit.prototypes.copyFiles = function( oProps ) {
   var deferred = Q.defer();
   var self = this;
   var oFileMap, i,l, cContent, cFileIn, cFileOut, cFileExt, oStatIn;
   var cPathType, cFilePathRelative;

   self.oSettings = extend({
      // Determines which file extensions we should ignore and NOT copy.
      ignoreExtensions: [],

      // Determines the path to copy the source files to.
      path_destination: '',

      // Determines the path to copy the source files from.
      path_source: '',

      // Determines the list of file renames.
      rename: {}
   }, oProps );


   /**
    * First create a map of all path_source file names to all path_destination
    * file names.
    */
   this._createPathMap( this.oSettings )
   .then(function( aMap ){
      /**
       * Loop over each file in the files directory and copy them to the new
       * project location.
       */
      for( i = 0, l = aMap.length; i < l; i++ ) {
         oFileMap = aMap[ i ];
         cFilePathRelative = oFileMap.path_relative;
         cFileExt = oFileMap.extension;

         // Ignore certain file types that might have been generated by vfp.
         if ( self.oSettings.ignoreExtensions.indexOf( cFileExt ) > -1 ) {
            // This is an ignored file type.
            console.log( ' ' );
            console.log( 'continue:', cFilePathRelative );
            console.log( ' ' );
            continue;
         }

         cFileIn = oFileMap.path_source;
         cFileOut = oFileMap.path_destination;
         oStatIn = fs.lstatSync( cFileIn );

         switch( true ){
         case oStatIn.isDirectory():
            cPathType = 'directory';
            break;

         case oStatIn.isFile():
            cPathType = 'file';
            break;

         default:
            cPathType = '*unknown*';
         }// /switch()



         console.log( 'Adding', cPathType, cFileOut, '...' );
         
         // Make sure the full destination path exists.
         fse.ensureFileSync( cFileOut );

         if ( cFileExt == '.dbf' ) {
            // This is NOT a text file.
            fse.copySync( cFileIn, cFileOut );

         }
         else {
            cContent = fse.readFileSync( cFileIn, 'utf8' );
            cContent = self._replaceTokens( cContent );
            fse.writeFileSync( cFileOut, cContent, 'utf8' );
            
         }
      }// /for()
      
      deferred.resolve();
   }).done();

   return deferred.promise;
};// /copyFiles()

ProjectInit.util.dateToMDY = function(){
   var PAD_STRING = '00';
   var oD = new Date();
   var month = ''.concat( oD.getMonth()+1 );
   var date = ''.concat( oD.getDate() );

   month = PAD_STRING.substring( 0, 2 - month.length ).concat( month );
   date = PAD_STRING.substring( 0, 2 - date.length ).concat( date );

   return [month,date,oD.getFullYear()].join( '-' );
}; // /dateToMDY()



ProjectInit.util.dateToYMD = function(){
   var PAD_STRING = '00';
   var oD = new Date();
   var month = ''.concat( oD.getMonth()+1 );
   var date = ''.concat( oD.getDate() );

   month = PAD_STRING.substring( 0, 2 - month.length ).concat( month );
   date = PAD_STRING.substring( 0, 2 - date.length ).concat( date );

   return [oD.getFullYear(),month,date].join( '-' );
};// /dateToYMD()

//http://stackoverflow.com/questions/2970525/converting-any-string-into-camel-case
ProjectInit.util.toCamelCase = function( str ) {
    str = str.replace(/[^a-z,A-Z,0-9](.)/g, function($1) { return $1.toUpperCase(); });
    str = str.replace(/[^a-z,A-Z,0-9]/g, '');
    return str;
};// /toCamelCase()


/**
 * This method creates a locale-based formatted datetime string for logging.
 */
ProjectInit.util.dateToLocaleISOString = function(){
   var PAD_STRING = '00';
   var oD = new Date();
   var month = ''.concat( oD.getMonth()+1 );
   var date = ''.concat( oD.getDate() );
   var h = ''.concat( oD.getHours() );
   var m = ''.concat( oD.getMinutes() );
   var s = ''.concat( oD.getSeconds() );

   month = PAD_STRING.substring( 0, 2 - month.length ).concat( month );
   date = PAD_STRING.substring( 0, 2 - date.length ).concat( date );
   h = PAD_STRING.substring( 0, 2 - h.length ).concat( h );
   m = PAD_STRING.substring( 0, 2 - m.length ).concat( m );
   s = PAD_STRING.substring( 0, 2 - s.length ).concat( s );

   return ''.concat( [oD.getFullYear(),month,date].join( '-' ),' ',[h,m,s].join( ':' ) );
};// /dateToLocaleISOString()


ProjectInit.util.lowerCaseFirstLetter = function( string ) {
  return string.charAt(0).toLowerCase() + string.slice(1);
};// /lowerCaseFirstLetter()