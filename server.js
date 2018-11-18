// PROJECT: 		MEANserver
// Name: 			Rolando Javier
// File: 			server.js
// Date Created: 	October 17, 2017
// Last Modified: 	January 9, 2018
// Details:
// 					This file comprises the MEAN Stack server to be used in PROJECT: Core-v4 (based on the server from PROJECT: SkillMatch and PROJECT: MEANserver)
// Dependencies:
// 					NodeJS v6.9.1
// 					ExpressJS 4.16.2
// 					body-parser (NPM middleware req'd by ExpressJS 4.x to acquire POST data parameters: "npm install --save body-parser")

"use strict"

/* NodeJS+ExpressJS Server */
var https = require( "https" );
var fs = require( "fs" );
var bodyParser = require( "body-parser" );					// import POST request data parser
var settings = require( "./util/settings" );				// import server system settings
var ssl = require( settings.security );						// import https ssl certifications
var logger = require( `${ settings.util }/logger` );		// import event log system
var port = process.argv[2];									// allow custom ports

/* Globals */
var handlerTag = { "src": "server" };
var ssl_settings = {
	"key": fs.readFileSync( ssl.prvkey ),
	"cert": fs.readFileSync( ssl.cert ),
	"passphrase": ssl.passphrase,
	"requestCert": false,
	"rejectUnauthorized": false
};



/* Initialize logging */
logger.log( `Initializing...`, handlerTag );



/* Create server instance */
const express = require( "express" );
const app = express();
app.locals.title = "rj_server";
app.locals.email = "test@test.com";



/* Define logs to ignore */
logger.ignore( [
	"bodyParser.json.Reviver",
	"delintRequestBody",
	"error_formats.common"
] );



/* Define Static Asset Locations (i.e. includes/js/css/img files) */
logger.log( `Preparing static assets...`, handlerTag );
app.use( bodyParser.json( {							// support JSON-encoded request bodies
	strict: true
} ) );
app.use( bodyParser.urlencoded( {					// support URL-encoded request bodies
	extended: true
} ) );
app.use( express.static( settings.root ) );			// server root (recursively include all)



/* Define Main Server Route (RESTful) */
logger.log( `Routing server endpoints...`, handlerTag );
var homeApp = require( "./public/home/app/app.js" );
app.use( "/", homeApp );				// GET request of the main login page



/* Initialize SCE Core API sub-app */
var apiApp = require( "./api/app/app.js" );
app.use( "/api", apiApp );



/* Initialize MongoDB Interface sub-app */
var mdbiApp = require( "./mdbi/app" );
app.use( "/mdbi", mdbiApp );				// use a subapp to handle database requests via the "/mdbi" endpoint



/*
	Main Server Routine - Listen for requests on specified port
*/
if ( !port ) {
	logger.log( `Using default port ${ settings.port }`, handlerTag );
	port = settings.port;
} else {
	logger.log( `Using custom port ${ port }`, handlerTag );
	settings.port = port;
}

var server = https.createServer( ssl_settings, app );
server.listen( port, function () {
	logger.log( `Now listening on port ${ port }`, handlerTag );
} );
// END server.js 
