//	PROJECT: 		RJS
// 	Name: 			Rolando Javier
// 	File: 			db_setup.js
// 	Date Created: 	Decembers 9, 2018
// 	Last Modified: 	Decembers 9, 2018
// 	Details:
// 					This file contains a setup routine that automates the setup of the database.
//					It uses the schemaManager class to acquire a list of schemas that are required
//					in the database pointed to by "mongo_settings.js". The script can be run using
//					the command "node db_setup.js [option]", where various options can be used.
//					Use the "--help" option for more details on what options can be used in which
//					context.
// 	Dependencies:
//					mongo_settings.js
// 					MongoDB v3.4.x+

"use strict"

// Includes
var args = process.argv;
var mongo_settings = require("../mongo_settings");
var fs = require( "fs" );
var schemaManager = require( "../schemaManager/schemaManager" );	// acquire schemaManager class
var settings = require("../../util/settings");
var logger = require( `${settings.util}/logger` );
var credentials = require(settings.credentials).mdbi;
var cryptic = require(`${settings.util}/cryptic`);
var syskey = require(settings.credentials).syskey;
var assert = require("assert");
var mongo = require("mongodb").MongoClient;
var mdb = require("../mongoWrapper");								// acquire MongoDB API Wrappers
var sm = new schemaManager();										// initialize a schema manager

// Globals
var mongoOptions = {
	"appname": "RJS DB Setup v0.0.0"
};
var url = `mongodb://${ encodeURIComponent(credentials.user) }:${ encodeURIComponent(credentials.pwd) }@${ mongo_settings.hostname }:${ mongo_settings.port }/${ mongo_settings.database }?authSource=${ mongo_settings.database }`;



// BEGIN Main Logic
// Ignore logger messages from the schema manager
logger.ignore( ["schemaManager.load()"] );

// Load database schemas using the schema manager
sm.load();

// Determine appropriate action based on option argument
if( args.includes("--stats") ) {

	// If database statistics are requested, run the statistics routine
	getStats();
} else if( args.includes("--format") ) {

	// If database format is requested, destroy database
	formatDatabase();
} else if( args.includes("--init") ) {

	// If an init is requested, run the schema init routine
	initDatabase();
} else {

	// Otherwise, print a help prompt
	help();
}
// END Main Logic

// BEGIN Option Logic
// @function		getStats()
// @description		This function contains the statistics acquisition logic
// @parameters		n/a
// @returns			n/a
function getStats() {
	
	// First, connect to the database
	console.log( "Connecting to MongoDB Server..." );
	mongo.connect( url, mongoOptions, function( err, db ) {

		// Check for successful database authentication
		if( err ) {

			// Report error if any
			console.log( `Auth Failed: ${err}` );
			if( db ) {
				endSession( db );
			}
		} else {

			// Issue command to acquire database statistics
			console.log( "Getting db statistics..." );
			db.command( {"dbStats": 1}, function( err, results ) {

				// Check for errors
				if( err ) {
					
					// If error, report it
					console.log( (typeof err === "object") ? JSON.stringify( err ) : err );
				} else {
					console.log( results );
				}

				// End database connection
				endSession( db );
			} );
		}
	} );
}

// @function		formatDatabase()
// @description		This function contains database formatting logic
// @parameters		n/a
// @returns			n/a
function formatDatabase() {

	// First, connect to the database
	console.log( "Connecting to MongoDB Server..." );
	mongo.connect( url, mongoOptions, function( err, db ) {

		// Check for successful database authentication
		if( err ) {

			// Report error if any
			console.log( `Auth Failed: ${err}` );
			if( db ) {
				endSession( db );
			}
		} else {

			// Acquire user confirmation
			console.log( `WARNING: You're about to delete all records in the ${ mongo_settings.database } database! Are you sure? (Yes/no)` );
			process.stdin.on( "readable", function() {
		
				// Process user input
				const chunk = process.stdin.read();
				if( chunk !== null ) {
		
					// Determine action based on user's answer
					var answer = chunk.slice( 0, chunk.length - 1 ).toString().toLowerCase();
					if( answer === "no" ) {
		
						// On a no answer, don't do anything
						console.log( "Aborting...");
						process.kill( process.pid, "SIGINT" );
					} else if ( answer === "yes" ) {
						
						// On a yes answer, acquire a list of all collection names, and use it to create
						// promises that drop each collection
						var collectionNames = sm.getSchemaNames();
						var deletionPromises = [];
						collectionNames.forEach( function( name ) {
							
							// Create a promise that deletes the schema with name "name"
							var tempPromise = new Promise( function( resolve, reject ) {
		
								// In this promise, send a command to delete the specified collection
								db.dropCollection( name, null, function( err, result ) {
		
									// Check for errors in the collection drop
									if( err ) {
		
										// If error, print error
										console.log( `Failed to drop ${name} collection: ${err}` );
										
										// End promise with failure
										reject();
									} else {
		
										// Print result
										console.log( `Collection ${name} dropped?: ${JSON.stringify( result )}` );
		
										// End promise with success
										resolve();
									}
								} );
							} );
		
							// Append a new promise to the deletion promise array
							deletionPromises.push( tempPromise );
						} );
		
						// Finally, execute all generated promises
						Promise.all( deletionPromises ).then( function( results ) {
		
							// On success, end
							console.log( `Database format complete: ${results}` );
							endSession( db );
							process.kill( process.pid, "SIGINT" );
						} ).catch( function( err ) {
		
							// On failure, end
							console.log( `Failed to complete database format: ${ err ? err : "Unknown Cause; here are a few things you could check:\n\t1.) Ensure your configuration has the right database name and credentials\n\t2.) Check that at least one of the above collections exist before formatting\n\t3.) Check the above error messages for further clues" }` );
							endSession( db );
							process.kill( process.pid, "SIGINT" );
						} );

						// Bug Fix: Some Mongo Errors produce unhandled rejections that escape the
						// catch block. This block is a work-around
						process.on( "unhandledRejection", function( reason, promise ) {
							console.log( `Unhandled rejection: Promise ${promise}\nReason: ${reason}` );
							endSession( db );
							process.kill( process.pid, "SIGINT" );
						} );
					} else {
		
						// On an unexpected answer, do nothing and wait for a valid answer
						console.log( `Unexpected answer "${answer}". Please say "Yes" or "no"...` );
					}
				}
			} );
		}
	} );

}

// @function		initDatabase()
// @description		This function contains database initialization logic
// @parameters		n/a
// @returns			n/a
function initDatabase() {

	// First, connect to the database
	console.log( "Connecting to MongoDB Server..." );
	mongo.connect( url, mongoOptions, function( err, db ) {

		// Check for successful database authentication
		if( err ) {

			// Report error if any
			console.log( `Auth Failed: ${err}` );
			if( db ) {
				endSession( db );
			}
		} else {

			// Store database reference to the loaded mongo wrapper module
			console.log( "Initializing db to requested specifications..." );
			mdb.database = db;

			// Acquire descriptions of the schemas and views to apply
			var schemas = sm.getSchemaDefinitions();	// views are also represented as schemas

			// Generate schema/view initialization promises
			var schemaPromises = [];
			var viewPromises = [];
			Object.keys( schemas ).forEach( function( schemaName ) {

				// Determine action based on schema type
				var schemaDef = schemas[ schemaName ];
				if( schemaDef.type === "view" ) {

					// TODO: Generate a view creation promise
					viewPromises.push( getViewCreatorPromise(
						schemaDef.name,
						db,
						schemaDef
					) );
				} else {

					// Generate a collection creation promise and store it
					schemaPromises.push( getCollectionCreatorPromise(
						schemaDef.name,
						db,
						generatePlaceholder( schemaDef )
					) );
				}
			} );

			// Run schema/view promises and evaluate results
			Promise.all( schemaPromises ).then( function( message ) {
				
				// Run view promises (since views require schemas to exist first)
				Promise.all( viewPromises ).then( function( message ) {
					
					// End with success
					console.log( `Successfully initialized database "${mongo_settings.database}"...` );
					endSession( db );
				} ).catch( function( error ) {

					// End with failure
					console.log( `Failed to apply view(s): ${error}` );
					if( db ) endSession( db );
				} );
			} ).catch( function( error ) {

				// End with failure
				console.log( `Failed to apply schema(s): ${error}` );
				if( db ) endSession( db );
			} );
		}
	} );
}
// END Option Logic

// BEGIN Utility Functions
// @function		generatePlaceholder()
// @description		This function generates a placeholder that conforms to the given schema
//					definition object's members
// @parameters		(object) def		A schema definition object to use for placeholder creation
// @returns			(object) doc		A document that matches the generated schema
function generatePlaceholder( def ) {

	// Acquire the datatypes for the schema's members
	var memberTypes = def.members;

	// Generate the placeholder document
	var doc = {};
	Object.keys( memberTypes ).forEach( function( key ) {

		// Assign a value corresponding to the member's type
		switch( memberTypes[ key ] ) {

			// String
			case "string": {
				doc[ key ] = "placeholder";
				break;
			}

			// Boolean
			case "boolean": {
				doc[ key ] = false;
				break;
			}

			// Null
			case "null": {
				doc[ key ] = null;
				break;
			}

			// Undefined
			case "undefined": {
				doc[ key ] = undefined;
				break;
			}

			// Number
			case "number": {
				doc[ key ] = 0;
				break;
			}

			// Object
			case "object": {
				doc[ key ] = {};
				break;
			}

			// Symbol
			case "symbol": {
				doc[ key ] = Symbol();
				break;
			}
		}
	} );

	// Return the placeholder
	return doc;
}

// @function		getCollectionCreatorPromise()
// @description		This function creates a collection initialization Promise that simply creates
//					the specified collection with the given placeholder document.
// @parameters		(string) name		The name of the collection to create
//					(object) db			The MongoDB database object provided to the callback of
//										"mongo.connect()"
//					(object) doc		The document to insert as a placeholder
// @returns			(Promise) p			A promise that creates the specified collection
function getCollectionCreatorPromise( name, db, doc ) {

	return new Promise( function( resolve, reject ) {

		// Create the collection and insert the placeholder document
		db.collection( name ).insertOne( doc, null, function( error, result ) {

			// Check for errors
			if( error ) {

				// Log error and end with failure
				console.log( `Error creating collection "${name}": ${error}` );
				reject();
			} else {

				// End with success
				console.log( `Created collection "${name}": ${result}` );
				resolve();
			}
		} );
	} );
}

// @function		getViewCreatorPromise()
// @description		This function creates a view initialization Promise that simply creates
//					the specified view with the given properties.
// @parameters		(string) name		The name of the view to create
//					(object) db			The MongoDB database object provided to the callback of
//										"mongo.connect()"
//					(object) schemaDef	The schema definition object of the view to create
// @returns			(Promise) p			A promise that creates the specified view
function getViewCreatorPromise( name, db, schemaDef ) {

	return new Promise( function( resolve, reject ) {

		// Create a view creation command with the given properties
		var viewCreationCommand = {
			"create": name,
			"viewOn": schemaDef.view.source,
			"pipeline": schemaDef.view.pipeline
		};

		// Attempt to execute the view creation command; this may fail if the user doesn't have
		// the appropriate database privileges/roles
		try {
			db.command( viewCreationCommand, null, function( error, result ) {

				// Check for errors
				if( error ) {

					// End with failure
					console.log( `Error creating view "${name}: ${error}` );
					reject();
				} else {

					// End with success
					console.log( `Created view "${name}"...` );
					resolve();
				}
			} );
		} catch( e ) {

			// Handle any exception
			console.log( `Error executing view creation command: ${e}` );
			reject();
		}
	} );
}

// @function		endSession()
// @description		This function ends the MongoDB session by first logging the authenticated user
//					out and explicitly closing the connection.
// @parameters		(object) db			The MongoDB database object provided to the callback of
//										"mongo.connect()"
//					(~function) cb		An optional callback function to run after the session is
//										closed. It is not passed any arguments.
function endSession ( db, cb ) {
	console.log( "Ending session..." );

	db.logout();
	db.close();

	if ( typeof cb === "function" ) {
		cb();
	}
}

// @function		help()
// @description		This function prints the setup script's help prompt
// @parameters		n/a
// @returns			n/a
function help() {
	
	// Print logo
	console.log( fs.readFileSync( `${__dirname}/res/promptlogo.txt` ).toString() );

	// Generate help prompt message
	var msg = "";
	msg += "Command Synopsis:";
	msg += "\n\t\"node db_setup.js [option]\"";
	msg += "\n\nOptions:";
	msg += "\n\t--stats";
	msg += "\n\t\tAcquires current MongoDB database statistics for the database";
	msg += "\n\t\tpointed to by \"mdbi/schemaManager/schema_config.json\"";
	msg += "\n\t--init";
	msg += "\n\t\tInitializes the database with collections described by the schema";
	msg += "\n\t\tmanager in \"mdbi/schemaManager\". See the schemaManager source";
	msg += "\n\t\tcode documentation for more details.";
	msg += "\n\t--mock";
	msg += "\n\t\tSame as \"--init\", but adds various \"fake\" documents to the";
	msg += "\n\t\tdatabase for testing/simulation purposes";
	msg += "\n\t--help";
	msg += "\n\t\tThe default behavior if no options are given; runs this help";
	msg += "\n\t\tprompt";
	msg += "\n\t--format";
	msg += "\n\t\tWARNING: This command does a complete wipe of the database";
	msg += "\n";

	// Print help prompt message
	console.log(msg);
}
// END Utility Functions



// END db_setup.js
