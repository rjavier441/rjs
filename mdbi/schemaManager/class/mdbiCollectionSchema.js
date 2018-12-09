//	PROJECT: 		RJS
// 	Name: 			Rolando Javier
// 	File: 			mdbiCollectionSchema.js
// 	Date Created: 	December 2, 2018
// 	Last Modified: 	December 2, 2018
// 	Details:
// 					This file contains a utility class that represents a collection schema.
//					This class is used in tandem with the schemaManager to represent or modify
//					existing collection schemas, or create new ones.
// 	Dependencies:
// 					MongoDB v3.4+

"use strict";		// allow use of JS Classes

// Includes
var settings = require( "../../../util/settings.js" );



// BEGIN schema definition documentation
// @config			Schema Definitions (aka schema description files)
// @description		Schema definitions are stored in JSON files, and take the form of JSON objects
//					identical to that of mdbiCollectionSchema instances. Consequently, they look
//					much like the example provided below.
// @members			(string) name		The name of the collection this schema definition
//										describes
//					(~string) desc		An optional description of the schema
//					(object) members	A JSON object whose keys are document field names for a
//										BSON document that will be inserted into the database.
//										Each key's value is a string describing the data type of
//										field.
//					(~string) ppk		The name of a member within the "members" object to use as
//										a ppk (preferred primary key) for the collection. If
//										omitted, it is assumed that the collection will use
//										"__docId__" as its primary key for all documents
// @example
//					Contents of a typcial schema definition file named "myCollection.json":
//
//						{
//							"name": "myCollection"
//							"desc": "This is a test schema definition for a test collection"
//							"members": {
//								"a": "string",
//								"b": "number",
//								"c": "object",
//							}
//							"ppk": "a"
//						}
// BEGIN schema definition documentation

// BEGIN class mdbiCollectionSchema
// @class			mdbiCollectionSchema
// @description		This class represents a MongoDB collection schema, since shcemas aren't
//					inherently built in with the current version of the database
// @note			This is a schema for a COLLECTION, not a DATABASE. Thus, it only defines
//					the "column structure" (a.k.a. document keys and their types) of all documents
//					in a collection, whereas the latter would define a set of collection schemas
//					for an entire database. Keep this distinction in mind.
// @ctor args		(~object) template	An optional object that configures general information
//										about the schema. It takes the following parameters:
//							(string) name		The name of the collection described by this
//												collection schema
//							(~string) desc		An optional description of the collection
//							(object) members	A JSON object whose members are objects describing
//												the member name and its corresponding data type.
//							(~string) ppk		The name of a member within the "members" object
//												to use as a ppk (preferred primary key) for the
//												collection. If omitted, it is assumed that the
//												collection will use "__docId__" as its primary key
//												for all documents
// @example
//					var template = {
//						"name": "user_info",
//						"members": {
//							"dateOfBirth": "string",	// datetime string
//							"bio": "string",
//							"username": "string",
//							"password": "string",
//							"age": "number",
//							...
//						},
//						"ppk": "username"		// this collection uses "username" as primary key
//					}
class mdbiCollectionSchema {

	// ctor
	constructor ( template ) {

		this.name = typeof template.name === "undefined" ? "" : template.name;
		this.desc = typeof template.desc === "undefined" ? "" : template.desc;
		this.members = ( typeof template.members !== "object" || Array.isArray( template.members ) ) ?
			{} : template.members;
		this.ppk = typeof template.ppk !== "string" ? "__docId__" : template.ppk;
	}
}

// @function		checkConformity()
// @description		This function checks whether the given object conforms to the schema
//					represented by the schema instance. It performs a check of the object's keys
//					and does a strict comparison of the key values' data types, as well as the
//					presence of all keys. If any one key in the schema is missing from the
//					document to insert, this function treats it as a conformity failure. This
//					function is useful to ensure that all objects inserted into a MongoDB
//					collection follow a specific format (i.e. schema).
// @parameters		(object) item		The item whose schema conformity will be checked
// @returns			(bool) conformity	A boolean representing the conformity of the given object
//										to this collection schema
mdbiCollectionSchema.prototype.checkConformity = function( item ) {

	var success = true;

	// Acquire the keys of the item
	var itemkeys = Object.keys( item );

	// Compare the item's keys with this collection schema's keys
	var ptr = this;
	Object.keys( this.members ).forEach( function( key ) {

		// Check if the current key is included in the item's keys and is the correct type
		if( !itemkeys.includes( key ) || typeof item[ key ] !== ptr.members[ key ] ) {

			success = false;
		}
	} );

	// Return result
	return success;
};
// END class mdbiCollectionSchema



module.exports = mdbiCollectionSchema;
// END mdbiCollectionSchema.js
