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
var chai = require("chai");
var assert = chai.assert;
const mdbiCollectionSchema = require( "../mdbi/schemaManager/class/mdbiCollectionSchema.js" );



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

	// @test			schemaManager
	// @description		?
	describe( "schemaManager.load" );
} );
// END schemaManager




// END test_schemaManager.js
