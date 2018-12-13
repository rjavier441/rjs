//	PROJECT: 		Core-v4
// 	Name: 			Rolando Javier
// 	File: 			skeleton/app/routes/index.js
// 	Date Created: 	November 18, 2018
// 	Last Modified: 	November 18, 2018
// 	Details:
// 					This file contains logic to service all routes requested under the skeleton
//					app
// 	Dependencies:
// 					ExpressJS 4.x
// 					body-parser (NPM middleware req'd by ExpressJS 4.x to acquire POST data parameters: "npm install --save body-parser")

"use strict";

// Includes
var express = require("express");
var https = require("https");
var fs = require("fs");
var router = express.Router();
var settings = require("../../../../util/settings");// import server system settings
var ef = require(`${settings.util}/error_formats`);	// import error formatter
var ssl = require(settings.security);				// import https ssl credentials
var credentials = require(settings.credentials);	// import server system credentials
var www = require(`${settings.util}/www`);			// import custom https request wrappers
var logger = require(`${settings.util}/logger`);	// import event log system

// Options
var options = {
	root: settings.root,	// Server root directory (i.e. where server.js is located)
	dotfiles: "deny",
	headers: {
		"x-timestamp": Date.now(),
		"x-sent": true
	}
};
var ssl_user_agent = new https.Agent({
	"port": settings.port,
	"ca": fs.readFileSync(ssl.cert)
});



// BEGIN Main Routes
/*
	@endpoint	/
	@parameter	request - the web request object provided by express.js
	@parameter	response - the web response object provided by express.js
	@returns	n/a
	@details 	This function serves the root endpoint of the skeleton app
	@note		Since the server routes "/" to this endpoint and this endpoint is under an extra
				directory "/skeleton", this endpoint requires a path offset to cover the
				"/skeleton" directory,
*/
var pathOffset = "/skeleton";
router.get( "/", function ( request, response ) {

	// Log the access to this endpoint
	var handlerTag = { "src": "skeletonRootHandler" };
	logger.log( `Skeleton requested from client @ ip ${ request.ip }\nRaw Headers:${ request.rawHeaders }`, handlerTag );
	logger.log( request.toString(), handlerTag );

	// Send a response to the request
	response.set( "Content-Type", "text/html" );
	response.sendFile( `${ pathOffset }/skeleton.html`, options, function ( error ) {
		if ( error ) {
			logger.log( error, handlerTag );
			response.status( 500 ).send( ef.asCommonStr( ef.struct.coreErr, error ) ).end();
		} else {
			logger.log( `Sent skeleton.html to ${ settings.port }`, handlerTag );
			response.status( 200 ).end();
		}
	});
});
// END Main Routes



// BEGIN Error Handling Routes
/*
	@endpoint 	NOTFOUND (404)
	@parameter 	n/a
	@returns 	n/a
	@details 	This function handles any endpoint requests that do not exist under the "/test" endpoint
*/
router.use(function (request, response) {

	// Log 404 error
	var handlerTag = {"src": "/NOTFOUND"};
	logger.log(`Non-existent endpoint "${request.path}" requested from client @ ip ${request.ip}\nRaw Headers:${ request.rawHeaders }` ,handlerTag);

	// Send 404 response
	response.status( 404 ).send( ef.asCommonStr(
		ef.struct.nonexistentEndpoint,
		{
			"status": 404
		}
	) ).end();
});

/*
	@endpoint 	ERROR (for any other errors)
	@parameter 	n/a
	@returns 	n/a
	@details 	This function sends an error status (500) if an error occurred forcing the other methods to not run.
*/
router.use(function (err, request, response) {
	
	// Log 500 error
	var handlerTag = {"src": "/ERROR"};
	logger.log(`Error occurred with request from client @ ip ${request.ip}\nRaw Headers:${ request.rawHeaders }`);

	// Send 500 response
	response.status( 500 ).send( ef.asCommonStr(
		ef.struct.coreErr,
		{
			"status": 500,
			"msg": err.message
		}
	) ).end();
});
// END Error Handling Routes



// BEGIN Utility Functions
// END Utility Functions



module.exports = router;
// END core/app/routes/index.js
