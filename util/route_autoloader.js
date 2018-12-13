//	PROJECT: 		Core-v4
// 	Name: 			Rolando Javier
// 	File: 			route_autoloader.js
// 	Date Created: 	September 11, 2018
// 	Last Modified: 	September 11, 2018
// 	Details:
// 					This file contains a convenient route autoloader for both APIs and web apps
//					within this project. Its primary use is to enable the loading of sub-apps
//					without the need for modification of core server files, enabling drag and drop
//					of API skeletons for automatic routing. Its intended use case is invocation
//					within the server.js file, and any other app.js file
// 	Dependencies:
//					NodeJS v6.9.1
// 					ExpressJS 4.x
// 					body-parser (NPM middleware req'd by ExpressJS 4.x to acquire POST data parameters: "npm install --save body-parser")

"use strict";

// Includes
// var express = require( "express" );
var settings = require( "./settings.js" );
var ef = require( `${settings.util}/error_formats` );
var logger = require( `${settings.util}/logger` );
var fs = require( "fs" );

// Globals
// n/a

// Container
const autoloader = {
	"api": {},		// contains api endpoint loading logic
	"route": {}		// contains route loading logic
};



// BEGIN autoloader config documentation
// @config			autoloader_ignore.json
// @description		A file that tells the autoloader which subapplications to ignore when mounting
//					APIs or Server Routes. The appropriate location of this file is contextual:
//						1.)	Seting API ignores: To set api directory ignores for API routes, this
//							file must be within the "/api/app/routes" directory, i.e. at the same
//							level as the api directory(ies) you wish to ignore.
//						2.)	Setting Server Route ignores: To set server route directory ignores
//							for server routes, this file must be within the same directory as
//							the server route directory(ies) you wish to ignore, i.e. the specified
//							"routes" directory given to autoloader.route.load() or the server root
//							directory if the "routes" argument is omitted.
// @parameters		(array) ignore			An array of strings whose contents are the directory
//											names (NOT full paths) of the API or Server Route
//											directories you wish to ignore.
// @example
//				"autoloader_ignore.json":
//
//					{
//						"ignore": [
//							"routeDirectory1",
//							"routeDirectory2",
//							...,
//							"routeDirectoryN"
//						]
//					}

// @config			autoloader_alias.json
// @description		A file that tells the autoloader which subapplications should be aliased, and
//					what their mount path's alias should be. This is useful for mounting a subapp
//					to a route whose name is different from the subapp's containing directory
//					name. It can also be used to control the ordering or endpoint mounting by
//					modifying the array position of each alias. Currently, this configuration file
//					is only supported for use with server routes, NOT APIs. The appropriate
//					location of this file is therefore within the same directory as the server
//					route directory(ies) you wish to alias, i.e. the specified "routes" directory
//					given to autoloader.route.load() or the server root directory if the "routes"
//					argument is omitted.
// @parameters		(array) alias			An array whose contents are objects. Each object will
//											be a key:value pair where the key is the name of the
//											route directory, and the value is the alias used to
//											mount the route directory's subapp.
//					(~object) options		An optional JSON object whose members dictate the
//											behavior of alias generation. This object may take any
//											of the following members
//							(~bool) afterOthers		A boolean that controls the way ordering is
//													performed if the provided aliases only cover
//													a subset of the total amount of aliases. If
//													"true", server routes without aliases will be
//													mapped first, followed by the provided route
//													aliases mapped in their array order. If
//													"false", the provided route aliases will be
//													mapped first, followed by any server routes
//													that do not have an alias. If omitted, this
//													defaults to false;
// @example
//					Given the following directory structure:
//
//						+ /public
//						|---- /dir1
//						|---- /dir2
//						|---- /dir3
//						|---- /dir4
//						|---- /dir5
//
//					Consider the following "autoloader_alias.json":
//
//						{
//							"alias": [
//								{ "dir1": "alias1" },
//								{ "dir2": "alias2" }
//							],
//							"afterOthers": true
//						}
//
//					The above alias JSON object will map the following directories to the
//					following paths in the following order:
//
//					=============================================================================
//					| order:	| path:						| alias:			| routed to:	|
//					=============================================================================
//					| 1			| /public/dir3/app/app.js	| n/a				| dir3			|
//					-----------------------------------------------------------------------------
//					| 2			| /public/dir4/app/app.js	| n/a				| dir4			|
//					-----------------------------------------------------------------------------
//					| 3			| /public/dir5/app/app.js	| n/a				| dir5			|
//					-----------------------------------------------------------------------------
//					| 4			| /public/dir1/app/app.js	| alias1			| alias1		|
//					-----------------------------------------------------------------------------
//					| 5			| /public/dir2/app/app.js	| alias2			| alias2		|
//					-----------------------------------------------------------------------------
//
//					Note that the un-aliased directories are not ordered in any particular way;
//					it should be assumed that their mapping order is random
// END autoloader config documentation



// BEGIN autoloader logic

// @function		api.load
// @description		This function loads API endpoints. It has a contextual use and can be used in
//					two ways:
//						1.)	If "routes" argument is omitted, this function searches the "dir"
//							directory for the first "/routes" folder and creates routes for each
//							"index.js" within the "/routes" folder. These routes would be assigned
//							to a parent route whose name matches its direct parent directory's
//							name. For example, if the route_autoloader is launched from
//							"/api/app/app.js" and finds the routing file "/api/app/routes/user/
//							index.js", it will map the file's routes to a parent URL path
//							"/api/user", a merger of both the app.js file's parent directory and
//							the index.js file's parent directory.
//						2.) If "routes" argument is given, this function uses the argument to
//							determine where the router files (i.e. "index.js" files) are found,
//							as well the parent URL path they will map to.
// @parameters		(object) app			The ExpressJS app object to map endpoints to. This
//											type of object is returned from a call to express().
//					(mixed) routes			1.) If "routes" is a string, it is assumed to be a
//											path to the directory containing "/routes" directory.
//											2.) If "routes" is an array, it shall house the
//											collection of routes that will be mounted onto the
//											provided ExpressJS app object. Each member is an
//											object representing a set of routes to map to the
//											provided application. Each array member is an object
//											taking all of the following members:
//							(string) endpoint		The name of the route enpoint to associate
//													with the provided index file
//							(string) indexPath		The relative path to the desired "index.js"
//													router file which houses the endpoints for
//													this route
// @returns			(object) result			A JSON object representing the result of the auto-
//											loading operation. It has the following members
//							(number) total			The total number of modules that were loaded
//													successfully
//							(array) unloaded		An array of API routes that were not loaded
//													(i.e. the intended API route URL paths)
autoloader.api.load = function ( app, routes ) {

	var handlerTag = { "src": "route_autoloader.api.load" };

	// Perform different logic based on this function's use context
	switch ( typeof routes ) {

		// If specific routes were defined
		case "object": {

			// Check if it's an array
			if ( Array.isArray( routes ) ) {

				// If it's an array, simply load with the given directories
				routes.forEach( function( route ) {

					autoloader.api.linkSingle( app, route.endpoint, route.indexPath );
				} );
			} else {

				// If not, throw an error
				var msg = ef.asCommonStr( ef.struct.coreErr, {
					"msg": `Autoloader cannot load an object unless it's an Array`
				} );
				logger.log( msg, handlerTag );
				throw msg;
			}
			break;
		}

		// If a routes path string was defined
		case "string": {

			// First, search the current directory for a "routes" folder
			var dirs = fs.readdirSync( routes );
			if ( dirs.indexOf( "routes" ) === -1 ) {

				// If the "routes directory" is not found, throw an error
				var msg = ef.asCommonStr( ef.struct.coreErr, {
					"msg": `Autoloader failed to find path '${dir}/routes'`
				} );
				logger.log( msg, handlerTag );
				throw msg;
			} else {

				// Otherwise, proceed to link routes to paths
				autoloader.api.linkRoutes( app, `${routes}/routes` );
			}
			break;
		}

		// If not one of the other types
		default: {

			// Throw an error
			var msg = ef.asCommonStr( ef.struct.coreErr, {
				"msg": `Invalid argument type "${typeof routes}" in parameter "routes"`
			} );
			logger.log( msg, handlerTag );
			throw msg;
			break;
		}
	}
};

// @function		api.linkRoutes
// @description		This function links routes with index files located inside the given "/routes"
//					directory's sub-folders. If the directory contains a "autoloader_ignore.json"
//					file, it will ignore the directories specified in that file when routing.
// @parameters		(object) app		The ExpressJS app object to map endpoints to. This type of
//										object is returned from a call to express().
//					(string) path		A string denoting the path of the nearest "/routes"
//										directory. This is where the function begins its search
//										for "index.js" file directories
// @returns			(object) result		An object representing the outcome of the routing. It has
//										the following members:
//							(boolean) success	A boolean representing the success of the routing
//												operation
//							(array) loaded		An array of obsjects representing all routes that
//												have been successfully linked
//							(array) failed		An array of objects representing all routes that
//												failed to link
autoloader.api.linkRoutes = function ( app, path ) {

	var handlerTag = { "src": "route_autoloader.api.linkRoutes" };

	// Begin by reading the directory names within the given "/routes" directory "path"
	var dirs = fs.readdirSync( path );
	var dirsToIgnore = false;

	// Also acquire the list of directories to ignore, if any
	logger.log( `Linking routes in path "${path}"`, handlerTag );
	if ( dirs.indexOf( "autoloader_ignore.json" ) !== -1 ) {

		// Remove the autoloader file from the dir list
		// dirs.splice( dirs.indexOf( "autoloader_ignore.json" ), 1 );

		// Place a try-catch block to catch errors
		try {

			// If there is a "autoloader_ignore.json" file, load its contents
			var ignoreFile = fs.readFileSync( `${path}/autoloader_ignore.json`, {
				"encoding": "utf8"
			} );

			// Store its contents in an array by converting to JSON
			dirsToIgnore = JSON.parse( ignoreFile ).ignore;
			logger.log( "Ignoring \"" + JSON.stringify( dirsToIgnore ) + "\"", handlerTag );
		} catch( exception ) {

			// If something went wrong, throw an error
			var msg = ef.asCommonStr( ef.struct.coreErr, {
				"exception": exception
			} );
			logger.log( msg, handlerTag );
			throw msg;
		}
	}

	// Filter out the dirs to ignore, if any
	if ( Array.isArray( dirsToIgnore ) && dirsToIgnore.length > 0 ) {

		// Traverse the dirsToIgnore array in search of any directories in dirs to ignore
		dirsToIgnore.forEach( function( dir ) {

			// Check if the current directory is in the dirs list
			var index = dirs.indexOf( dir );
			if( index !== -1 ) {

				// Remove the dir from the dirs array
				dirs.splice( index, 1 );
			}
		} );
	}

	// Ensure that the only contents in the dir array are the names of directories (not files)
	dirs.forEach( function( element, index ) {

		// Get information about this element
		var info = fs.statSync( `${path}/${element}` );

		// If this element is not a directory
		if ( !info.isDirectory() ) {

			// Remove it from dirs
			dirs.splice( index, 1 );
		}
	} );

	// Load each index file with its parent directory name as the endpoint name
	// logger.log( "dirs: " + JSON.stringify( dirs ), handlerTag );	// debug
	dirs.forEach( function( dir ) {

		app.use( `/${dir}`, require( `${path}/${dir}/index.js` ) );
	} );
	
}

// @function		api.linkSingle
// @description		This function links a single route explicitly, instead of searching for routes
//					within a specified directory. This funciton is useful for directly mapping a
//					route to a custom endpoint name instead of the default behavior where the
//					autoloader assumes the endpoint name is the name of an "index.js" file's
//					parent directory
// @parameters		(object) app		The ExpressJS app object to map endpoints to. This type of
//										object is returned from a call to express().
//					(string) endpoint	The name of the route enpoint to associate with the
//										provided index file
//					(string) indexPath	The path to the "index.js" whose routes will be linked to
//										the specified endpoint
// @returns			(object) result		A JSON object representing the outcome of the routing. It
//										has the following members:
//							(boolean) success	A boolean representing the success of the routing
//												operation
//							(~object) response	An error object if any error or exception occurred
//												Otherwise, a response object
autoloader.api.linkSingle = function( app, endpoint, indexPath ) {

	var handlerTag = { "src": "route_autoloader.api.linkSingle" };
	var success = false;
	var response = {};
	try {

		// Acquire the routes defined in the index file.
		logger.log( `Requiring route index "${indexPath}"`, handlerTag );
		var routes = require( indexPath );
		
		// Route the specified index path to the provided endpoint
		app.use( endpoint, routes );

		// Set a successful response
		success = true;
		response.msg = "Linked \"" + indexPath + "\" to endpoint \"" + endpoint + "\"";
		logger.log( response.msg, handlerTag );
	} catch ( exception ) {

		// If an exception occurred, return the exception
		response = JSON.parse( ef.asCommonStr( ef.struct.coreErr, {
			"exception": exception
		} ) );
		logger.log(
			"Unable to route index \"" + indexPath +"\": " + JSON.stringify(
				response.eobj.exception
			),
		handlerTag );
	}

	return {
		"success": success,
		"response": response
	};
};

// @function		route.load
// @description		This function loads Server Route endpoints. It has a contextual use and can be
//					used in two ways:
//						1.)	If "routes" argument is omitted, this function searches for a
//							"/app/app.js" file in each directory within the server root. If the
//							file cannot be found, the directory is ignored. If it is found, the
//							file's express application will be mounted on a route whose endpoint
//							name is "/a", where "a" is the directory name. For example, assume the
//							server has the server root set to "/var/www/html/public", and its only
//							content is the directory "/myApp", which has the app file 
//							"/myApp/app/app.js". If the server file "/var/www/html/server.js"
//							calls this function and omits "routes", this function will mount the
//							app.js application to "http[s]://www.[your hostname].[domain]/myApp"
//						2.) If "routes" is a string, it is assumed to be a custom server root
//							directory (i.e. useful if you want to use a server root other than the
//							default "/public"). This function will automatically search that
//							directory for any subdirectories containing an "/app/app.js" file.
//							Those that have one are mounted according to usage context 1 above.
// @parameters		(object) app		The ExpressJS app object to map endpoints to. This type of
//										object is returned from a call to express().
//					(~mixed) routes		1.) If "routes" is a string, it is assumed to be a custom
//											server root directory (i.e. useful if you want to
//											use a server root other than the default "/public").
//											This function will automatically search that directory
//											for any subdirectories containing an "/app/app.js"
//											file. Those that have one are mounted according to
//											usage context 1 in the description.
// @returns			(object) result			A JSON object representing the result of the auto-
//											loading operation. It has the following members
//							(number) total			The total number of modules that were loaded
//													successfully
//							(array) unloaded		An array of API routes that were not loaded
//													(i.e. the intended API route URL paths)
autoloader.route.load = function( app, routes ) {

	var handlerTag = { "src": "route_autoloader.route.load" };

	// If routes is omitted, give it the defaut server root value
	if( typeof routes === "undefined" ) {

		routes = settings.root;
	}

	// Perform different logic based on this function's use context
	switch ( typeof routes ) {

		// If a routes path string was defined
		case "string": {

			// First, acquire the list of directories within the given path. Also create space
			// to record directories to ignore and aliases for any directories found
			var dirs = fs.readdirSync( routes );
			var ignoreDirs = [];
			var aliasMap = [];
			var afterOthers = false;

			// Next, check to see if there is an "autoloader_ignore.json" file. If any errors
			// occur while reading the file, continue without processing ignores
			try {
				
				// Attempt to read the ignore file
				var ignoreFileFound = dirs.includes( "autoloader_ignore.json" );
				ignoreDirs = ignoreFileFound ?
					JSON.parse( fs.readFileSync( `${routes}/autoloader_ignore.json` ) ).ignore : [];

				// Remove the ignore file from the directory list if it was found
				if( ignoreFileFound ) {

					dirs.splice( dirs.indexOf( "autoloader_ignore.json" ), 1 );
				}

				// Then, remove all dirs that are requested for ignore
				ignoreDirs.forEach( function( dirname ) {
					if( dirs.includes( dirname ) ) {
						dirs.splice( dirs.indexOf( dirname ), 1 );
					}
				} );
			} catch( error ) {

				// As a failsafe, set ignoreDirs
				ignoreDirs = [];

				// Send an error, but continue without ignores
				var msg = ef.asCommonStr( ef.struct.coreErr, {
					"msg": `Autoloader failed to parse ignore file. Continuing without ignores...`
				} );
				logger.log( msg, handlerTag );
			}
			
			// DEBUG
			// console.log( "IgnoreDirs:", ignoreDirs );
			// console.log( "dirs:", dirs );

			// Next, check to see if there is an "autoloader_alias.json" file. If any errors
			// occur while reading the file, continue without processing ignores
			try {

				// Check for the alias file
				var aliasFileFound = dirs.includes( "autoloader_alias.json" );
				if( aliasFileFound ) {
				
					// If it is found, read the file
					var tempjson = JSON.parse( fs.readFileSync( `${routes}/autoloader_alias.json` ) );
					
					// Assign relevant alias settings if provided
					aliasMap = Array.isArray( tempjson.alias ) ? tempjson.alias : [];
					afterOthers = typeof tempjson.afterOthers !== "undefined" ?
						tempjson.afterOthers : false;

					// Remove the alias file from the directory list if it was found
					dirs.splice( dirs.indexOf( "autoloader_alias.json" ), 1 );

					// Then remove any aliased directories from the directory list
					aliasMap.forEach( function( aliasObject ) {

						// Check if the alias object's directory name is within the dirs list
						var aliasedDirName = Object.keys( aliasObject )[0];
						if( dirs.includes( aliasedDirName ) ) {

							// If it does, remove the dir from the list, since it is already
							// covered by the alias map
							dirs.splice( dirs.indexOf( aliasedDirName ), 1 );
						}
					} );
				}
			} catch( error ) {

				// As a failsafe, set aliasMap
				aliasMap = [];

				// Send an error, but continue without aliases
				var msg = ef.asCommonStr( ef.struct.coreErr, {
					"msg": `Autoloader failed to parse alias file. Continuing without aliases...`
				} );
				logger.log( msg, handlerTag );
			}

			// Convert the objects in dirs to alias objects
			dirs.forEach( function( dir, index, array ) {

				// Replace the current dir string with an alias object whose alias is the same
				// as the dir name
				array[ index ] = {};
				array[ index ][ dir ] = `/${dir}`;
			} );
			
			// At this point, we should now have an aliasMap array and a list of dirs whose items
			// are not already in the aliasMap. We can now combine the dirs and aliasMap based on
			// the requested alias ordering scheme
			if( !afterOthers ) dirs = dirs.reverse();
			dirs.forEach( function( dirObject ) {

				// Place the current alias object to the appropriate end of the aliasMap
				if( !afterOthers ) aliasMap.push( dirObject );		// place items at end
				else aliasMap.splice( 0, 0, dirObject );			// place items in reverse at
																	// the front
			} );

			// DEBUG
			// console.log( "Dirs:", dirs );
			// console.log( "aliasMap:", aliasMap );
			// return;

			// Finally, traverse the finalized aliasMap to route the directories to their
			// corresponding server route endpoint names
			aliasMap.forEach( function( aliasObject ) {

				// Check to see if the app file exists
				try{

					var dirname = Object.keys( aliasObject )[0];

					// If the file doesn't exist or doesn't have permissions that allow the server
					// to access it, this function throws an error
					var assumedPath = `${routes}/${dirname}/app/app.js`;
					fs.accessSync( assumedPath );

					// If no errors were thrown, we can now mount the application file to the
					// corresponding server route endpoint name
					var endpointName = aliasObject[ dirname ];
					autoloader.route.linkSingle( app, endpointName, assumedPath );
				} catch( error ) {

					// Send an error message, but continue to process other routes
					var msg = ef.asCommonStr( ef.struct.coreErr, {
						"msg": `Autoloader failed to access ${routes}/${dir}/app/app.js. Does the \
						file exist? Are your permissions correct?`
					} );
					logger.log( msg, handlerTag );
				}
			} );
			break;
		}

		// If not one of the other types
		default: {

			// Throw an error
			var msg = ef.asCommonStr( ef.struct.coreErr, {
				"msg": `Invalid argument type "${typeof routes}" in parameter "routes"`
			} );
			logger.log( msg, handlerTag );
			throw msg;
			break;
		}
	}
};

// @function		route.linkSingle
// @description		This function links a single express application to a server route
// @parameters		(object) app		The ExpressJS app object to map endpoints to. This type of
//										object is returned from a call to express().
//					(string) endpoint	The name of the server route endpoint to associate with
//										the given express application file.
//					(string) indexPath	The path to the app.js file housing the express application
// @returns			(object) result		A JSON object representing the outcome of the routing. It
//										has the following members:
//							(boolean) success	A boolean representing the success of the routing
//												operation
//							(~object) response	An error object if any error or exception occurred
//												Otherwise, a response object
autoloader.route.linkSingle = function( app, endpoint, indexPath ) {

	var handlerTag = { "src": "route_autoloader.route.linkSingle" };
	var success = false;
	var response = {};
	try {

		// Acquire the routes defined in the index file.
		logger.log( `Requiring route index "${indexPath}"`, handlerTag );
		var routes = require( indexPath );
		
		// Route the specified index path to the provided endpoint
		app.use( endpoint, routes );

		// Set a successful response
		success = true;
		response.msg = "Linked \"" + indexPath + "\" to endpoint \"" + endpoint + "\"";
		logger.log( response.msg, handlerTag );
	} catch ( exception ) {

		// If an exception occurred, return the exception
		response = JSON.parse( ef.asCommonStr( ef.struct.coreErr, {
			"exception": exception
		} ) );
		logger.log(
			"Unable to route index \"" + indexPath +"\": " + JSON.stringify(
				response.eobj.exception
			),
		handlerTag );
	}

	return {
		"success": success,
		"response": response
	};
};
// END autoloader logic



module.exports = autoloader;
// END route_autoloader.js
