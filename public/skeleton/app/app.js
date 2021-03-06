//	PROJECT: 		Skeleton
// 	Name: 			Rolando Javier
// 	File: 			skeleton/app/app.js
// 	Date Created: 	November 18, 2018
// 	Last Modified: 	November 18, 2018
// 	Details:
// 					This file contains a skeleton sub-application that can be mounted at any desired endpoint by the server.
// 	Dependencies:
// 					ExpressJS 4.x
// 					body-parser (NPM middleware req'd by ExpressJS 4.x to acquire POST data parameters: "npm install --save body-parser")

"use strict"

// Includes
var express = require( "express" );
var settings = require( "../../../util/settings" );		// import server system settings
var logger = require( `${ settings.util }/logger` );	// import event log system
var bodyParser = require( "body-parser" );				// import POST request data parser
var routes = require( "./routes" );						// import SCE Core routes

// Globals
var handlerTag = { "src": "skeletonRouter" };



// Initialize Skeleton Test Page App
logger.log( `Initializing skeleton router...`, handlerTag );
var app = express();
app.use( bodyParser.json( {			// support JSON-encoded request bodies
	strict: true
} ) );
app.use( bodyParser.urlencoded( {	// support URL-encoded request bodies
	extended: true
} ) );



// Test Page Route
app.use( "/", routes );				// serves the skeleton route endpoints



module.exports = app;
// END skeleton/app/app.js
