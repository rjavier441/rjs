//	PROJECT: 		RJS
// 	Name: 			Rolando Javier
// 	File: 			schemaManager.js
// 	Date Created: 	December ?, 2018
// 	Last Modified: 	December ?, 2018
// 	Details:
// 					This file contains software that provides various functions and utilities for
//					the MDBI to manage collection schemas and enforce collection schema conformity
// 	Dependencies:
// 					MongoDB v3.4+

"use strict";		// allow use of JS Classes

// Includes
var fs = require( "fs" );
var settings = require( "../../util/settings.js" );
var logger = require( `${settings.util}/logger` );
const collectionSchema = require( "./class/mdbiCollectionSchema.js" );



// BEGIN schema definition documentation
// @config			schema_config.json
// @description		This file contains a JSON object that configures various settings for the
//					schema manager, including the default location to look for schemas, and ?
// @members			(object) config		A JSON object that contains configuration settings. It may
//										contain any of the following members:
//							(string) path		The path to the directory containing schema
//												description files. This path is loaded relative
//												to this file
//					(~array) ignore		An array containing the names of schema description files
//										to ignore when loading schemas
// @note			See "mdbiCollectionSchema.js" for documentation describing how to format
//					schema description files
// @example
//					{
//						"config": {
//							"path": "./schemas"
//						},
//						"ignore": [ "schemaA.json" ]
//					}
// END schema definition documentation

// BEGIN class schemaManager
// @class			schemaManager
// @description		This class serves as a means for the MDBI (and virtually any other module) to
//					load schemas into memory for representation, modification, and creation
// @ctor args		(~string) path		A string representing a path to a schema_config.json file.
//										If omitted, this defaults to "./" (i.e. the same directory
//										containing this file)
class schemaManager {

	// ctor
	constructor( path = "./" ) {

		// Store the config file path here
		this.configFile = path;

		// Store the config object here
		this.config = {};

		// Store list of loaded schema definitions here
		this.loaded = {};

		// Store the loaded schemas' mdbiCollectionSchema objects here
		this.schema = {};
	}
}

// @function		load
// @description		This function searches in the designated schema directory (configured by the
//					"schema_config.json" file) for schema definition json files. Any files that
//					are found will have their schema definitions (see documentation located in
//					"class/mdbiCollectionSchema.js") loaded into memory, except for schema files
//					listed to be ignored (see schema_config.json documentation above).
// @parameters		n/a
// @returns			n/a
schemaManager.prototype.load = function() {

	// Set handler tag
	var handlerTag = { "src": "schemaManager.load()" };

	// Execute and catch any errors
	try {

		// Create a place to store a message of the result of the load
		var msg = "Load Result:\n";

		// Load configuration file at the specified path
		logger.log( `Loading schema "${this.configFile}"...`, handlerTag );
		var obj = JSON.parse( fs.readFileSync( `${__dirname}/${this.configFile}`, {
			"encoding": "utf8"
		} ) );
		this.config = typeof obj.config === "undefined" ? {} : obj.config;
		this.ignore = typeof obj.ignore === "undefined" ? [] : obj.ignore;

		// Then, acquire schema definition filenames from the specified path
		if( this.config.path ) {
			
			// Acquire schema definition filenames
			var schemaFilenames = [];
			schemaFilenames = fs.readdirSync( this.config.path, {
				"encoding": "utf8"
			} );

			// Traverse the list of ignores
			this.ignore.forEach( function( fileToIgnore ) {

				// Check if this file is in the schema filename list
				if( schemaFilenames.includes( fileToIgnore ) ) {

					// If it is, remove it from the files to load
					schemaFilenames.splice( schemaFilenames.indexOf( fileToIgnore ), 1 );
				}
			} );

			// Traverse the list of schema definition files
			schemaFilenames.forEach( function( filename ) {

				// Execute and catch any errors
				try{

					// Load the individual file's json schema definition
					var schema = JSON.parse(
						fs.readFileSync( `${__dirname}/${this.config.path}/${filename}`, {
							"encoding": "utf8"
						} )
					);

					// Store the schema definition in memory
					this.loaded[ schema.name ] = schema;

					// Create a new mdbiCollectionSchema object and store it in the schema list
					this.schema[ schema.name ] = new collectionSchema( schema );

					// Update the result message
					msg += `${filename} load success\n`;
				} catch( error ) {

					// Append to the message the name of the schema file that failed to load, and
					// the reason it failed
					msg += `${filename} load failure: ${error}\n`;
				}
			} );

			// Log results
			logger.log( msg, handlerTag );
		} else {

			// Log error, but do not stop server execution
			logger.log( `Error: No path specified in config file "${this.configFile}"`, handlerTag );
		}
	} catch( error ) {

		// Log error
		logger.log( `Error: ${error}`, handlerTag );
	}
};

// @function		checkConformity
// @description		This function checks the conformity of a JSON object to the schema name. This
//					function does this by forwarding the conformity check to the appropriate mdbi
//					collection schema object's "checkConformity()" function.
// @parameters		(string) name		The name of the schema to call
//					(object) item		The JSON object to check
// @returns			(boolean) conforms	A boolean representing whether "item" conforms to the
//										"schema". If the schema doesn't exist, or if it failed to
//										load, this defaults to false
schemaManager.prototype.checkConformity = function( name, item ) {

	// Check if the schema exists; check conformity
	var conforms = false;
	if( typeof this.schema[ name ] !== "undefined" ) {
		conforms = this.schema[ name ].checkConformity( item );
	}

	// Return the result
	return conforms;
};
// END class schemaManager

// END schemaManager.js
