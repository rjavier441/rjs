//	PROJECT: 		MEANserver
// 	Name: 			Rolando Javier
// 	File: 			smci_settings.js
// 	Date Created: 	January 9, 2018
// 	Last Modified: 	January 12, 2018
// 	Details:
// 					The Sce Mail Chimp Interface (SMCI) Settings. This file contains the MailChimp API's Settings in JSON.
// 	Dependencies:
// 					n/a

"use strict"



// Container
var smci_settings = {};



// Members
/*
	@member 	accountEmail
	@details 	This is the email associated with the MailChimp account used by SMCI
*/
smci_settings.accountEmail = "[Enter your account name here]";	// temporary; will replace with real credentials after testing completes

/*
	@member 	apikey
	@details 	This is the api key I'm using to run the smci wrappers.
*/
smci_settings.apikey = "[Enter you api key here]";

/*
	@member 	apiDataCenter
	@details 	This member signifies the data center that handles all mailchimp requests.
*/
smci_settings.apiDataCenter = "us15";

/*
	@member 	apiVersion
	@details 	This member signifies the current working version of MailChimp API that this module is using.
*/
smci_settings.apiVersion = "3.0";

/*
	@member 	anystring
	@details 	This is a temporary signature used to identify api transactions (i.e. a username).
*/
smci_settings.anystring = "[Enter any string here]";

/*
	@member 	appAccessToken
	@details 	This is the OAuth2 Access Token given by recently linking the app to MailChimp's "rj_my_test_app"
	@note 		Everytime you wish to re-register the SMCI with MailChimp, you must use smci.postAuthorizedApp() and replace this access token with the new one returned from MailChimp!
*/
smci_settings.appAccessToken = "[Enter your api access token here]";

/*
	@member 	appViewerToken
	@details 	This is the OAuth2 Viewer Token given by recently linking the app to MailChimp's "rj_my_test_app"
	@note 		Everytime you wish to re-register the SMCI with MailChimp, you must use smci.postAuthorizedApp() and replace this viewer token with the new one returned from MailChimp!
*/
smci_settings.appViewerToken = "[Enter your app viewer token here]";



module.exports = smci_settings;
// END smci_settings.js
