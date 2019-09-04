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
var minimist = require( "minimist" );						// import easy command line arg reader
var https = require( "https" );
var fs = require( "fs" );
var bodyParser = require( "body-parser" );					// import POST request data parser
var settings = require( "./util/settings" );				// import server system settings
var ssl = require( settings.security );						// import https ssl certifications
var logger = require( `${ settings.util }/logger` );		// import event log system
var autoloader = require( `${settings.util}/route_autoloader` );

/* Globals */
var margs = minimist( process.argv.slice( 2 ) );			// acquire all args except "node" &
															// "server"
var port = margs.port ? margs.port : margs.P ? margs.P : false;		// allow custom ports
var handlerTag = { "src": "server" };
var ssl_settings = {
	"key": fs.readFileSync( ssl.prvkey, 'utf8' ),
	"cert": fs.readFileSync( ssl.cert, 'utf8' ),
	"ca": fs.readFileSync( ssl.ca, 'utf8' ),
	"passphrase": ssl.passphrase,
	"requestCert": false,
	"rejectUnauthorized": false
};



/* Check for help option */
if( margs.h || margs.help ) {

	// Show help prompt and leave
	help();
	return;
} else {

	// Show startup text by itself
	console.log( "\n" + fs.readFileSync( `${settings.util}/common/startup.txt` ).toString() );
}



/* Initialize logging (and check if verbose logging is requested) */
if( !margs.v && !margs.verbose ) {
	console.log( `Running in non-verbose logging mode...` );
	logger.logToConsole = false;
}
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



/* Set Endpoints
	Note: Endpoints are search in the order they are loaded. In this case, a request to the server
	will attempt to resolve to the first endpoint loaded here, and then continue on until the end
	of the endpoint list is reached (i.e. the last "app.use()" call).
*/
/* Initialize RJS Core API sub-app */
var apiApp = require( "./api/app/app.js" );
app.use( "/api", apiApp );



/* Initialize MongoDB Interface sub-app */
var mdbiApp = require( "./mdbi/app" );		// intended as a DBAL (not a web/rest api)
app.use( "/mdbi", mdbiApp );				// use a subapp to handle database requests via the "/mdbi" endpoint



/* Initialize Skeleton sub-app */
// var skeletonApp = require( "./public/skeleton/app/app.js" );
// app.use( "/skeleton", skeletonApp );



/* Define Main Server Route (RESTful) */
logger.log( `Routing server endpoints...`, handlerTag );
// var homeApp = require( "./public/home/app/app.js" );
// app.use( "/", homeApp );				// GET request of the main login page

// TODO: 	Experiment with the autoloader to automate route loading for server endpoints instead
//			of API endpoints
autoloader.route.load( app );



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

/* Help Prompt */
function help() {
	console.log( "\n" + fs.readFileSync( `${settings.util}/common/startup.txt` ).toString() );
	console.log( `rjserver Help Prompt` );
	console.log( `\nCommand Synopsis:` );
	console.log( `\n\tnode server.js [options]` );
	console.log( `\nOptions:` );
	console.log( `\n\t-h, --help` );
	console.log( `\n\t\tShows this help prompt` );
	console.log( `\n\t-P, --port` );
	console.log( `\n\t\tSets the server port to a number other than the default "8080"` );
	console.log( `\n\t-v, --verbose` );
	console.log( `\n\t\tEnables verbose logging to console. Logging to log files is done regardless` );
	console.log( `\n\t` );
}
// END server.js 
