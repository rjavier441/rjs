//	PROJECT: 		RJS
// 	Name: 			Rolando Javier
// 	File: 			test_schemaManager.js
// 	Date Created: 	December 4, 2018
// 	Last Modified: 	December 4, 2018
// 	Details:
// 					This file contains unit tests that test the schemaManager module and its
//					supporting classes.
// 	Dependencies:
// 					MochaJS v4.1.0
// 					ChaiJS v4.1.2

"use strict";

// Includes
var fs = require( "fs" );
var chai = require("chai");
var assert = chai.assert;
var settings = require( "../../util/settings.js" );
var logger = require( `${settings.util}/logger.js` );
const mdbiCollectionSchema = require( "../../mdbi/schemaManager/class/mdbiCollectionSchema.js" );
const schemaManager = require( "../../mdbi/schemaManager/schemaManager.js" );



// BEGIN mdbiCollectionSchema
describe( "mdbiCollectionSchema", function () {
	
	// @test			mdbiCollectionSchema.checkConformity()
	// @description		?
	describe( "mdbiCollectionSchema.checkConformity()", function() {

		var k = new mdbiCollectionSchema(
			{
				"name": "test",
				"members": {
					"num": "number",
					"str": "string",
					"obj": "object"
				},
				"ppk": "num"
			}
		);

		it( "should return true on a conforming document", function( done ) {

			assert.strictEqual( k.checkConformity(
				{
					"num": 1,
					"str": "hello world",
					"obj": {}
				}
			), true );
			done();
		} );

		it( "should return false on a non-conforming document (i.e. invalid type)", function( done ) {

			assert.strictEqual( k.checkConformity(
				{
					"num": "not a number!",
					"str": "a string",
					"obj": "not an object!"
				}
			), false );
			done();
		} );

		it( "should return false on a non-conforming document (i.e. missing key)", function( done ) {

			assert.strictEqual( k.checkConformity(
				{
					"num": 0,
					"obj": {}
				}
			), false );
			done();
		} );
	} );
});
// END mdbiCollectionSchema



// BEGIN schemaManager
describe( "schemaManager", function() {

	// Ignore all log messages from schemaManager
	logger.ignore( ["schemaManager.load()"] );

	// @test			schemaManager.load()
	// @description		?
	describe( "schemaManager.load()", function() {

		// Initialize a schema manager
		var sm = new schemaManager( __dirname );
		
		// Acquire all schema definition objects manually
		var definitions = {};
		definitions.testSchema1 = JSON.parse( fs.readFileSync( __dirname + "/schemas/testSchema1.json", {
			"encoding": "utf8"
		} ) );
		definitions.testSchema2 = JSON.parse( fs.readFileSync( __dirname + "/schemas/testSchema2.json", {
			"encoding": "utf8"
		} ) );

		// Load schemas into the schemaManager, pointed to by config file
		sm.load();

		it( "should load all schema definitions", function( done ) {

			// Check that all schema definitions have been loaded and are deeply equal to the
			// manually loaded ones.
			assert.deepEqual(
				sm.getSchemaDefinition( "testSchema1" ),
				definitions.testSchema1
			);
			assert.deepEqual(
				sm.getSchemaDefinition( "testSchema2" ),
				definitions.testSchema2
			);
			done();
		} );
	} );

	// @test			schemaManager.checkConformity()
	// @description		?
	describe( "schemaManager.checkConformity()", function() {

		// Create an object that conforms to testSchema1
		var obj1 = {
			"username": "testusername",
			"password": "abcdefg",
			"loginCount": 12
		};

		// Create an object that conforms to testSchema2 only
		var obj2 = {
			"info": "testusername",
			"sessionData": { "a": 1, "b": "asdfa" },
			"userId": 12
		};

		// Initialize a schema manager
		var sm = new schemaManager( __dirname );

		// Load schemas into the schemaManager, pointed to by config file
		sm.load();

		it( "should return true if item conforms to testSchema1", function( done ) {

			assert.strictEqual( sm.checkConformity( "testSchema1", obj1 ), true );
			done();
		});
		
		it( "should return false if item doesn't conform to testSchema1", function( done ) {
			
			assert.strictEqual( sm.checkConformity( "testSchema1", obj2 ), false );
			done();
		});
		
		it( "should return true if item conforms to testSchema2", function( done ) {
			
			assert.strictEqual( sm.checkConformity( "testSchema2", obj2 ), true );
			done();
		} );

		it( "should return false if item doesn't conform to testSchema2", function( done ) {
			
			assert.strictEqual( sm.checkConformity( "testSchema2", obj1 ), false );
			done();
		});
	} );
} );
// END schemaManager




// END test_schemaManager.js
