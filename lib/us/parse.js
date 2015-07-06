( function () {
	"use strict";

	var parse = require( "parse-address");
	var clean = require( "./clean" );

	var streetType = require( "./streetType" );
	var streetPrefix = require( "./streetPrefix" );
	var streetSuffix = require( "./streetSuffix" );
	var statePossessionAbbreviations = require( "./statePossessionAbbreviations" );

	module.exports.parseLocation = function ( addressString ) {
		var addressObject = parse.parseLocation( addressString );
		var newValue;

		if ( addressObject ) {

			if ( addressObject.hasOwnProperty( "street" ) ) {
				newValue = clean( addressObject.street );
				if ( newValue ) {
					addressObject.street = newValue;
				}
				else {
					delete addressObject.street;
				}
			}

			if ( addressObject.hasOwnProperty( "street1" ) ) {
				newValue = clean( addressObject.street1 );
				if ( newValue ) {
					addressObject.street1 = newValue;
				}
				else {
					delete addressObject.street1;
				}
			}

			if ( addressObject.hasOwnProperty( "street2" ) ) {
				newValue = clean( addressObject.street2 );
				if ( newValue ) {
					addressObject.street2 = newValue;
				}
				else {
					delete addressObject.street2;
				}
			}

			if ( addressObject.hasOwnProperty( "type" ) ) {
				newValue = streetType( addressObject.type, true );
				if ( newValue ) {
					addressObject.type = newValue;
				}
				else {
					delete addressObject.type;
				}
			}

			if ( addressObject.hasOwnProperty( "type1" ) ) {
				newValue = streetType( addressObject.type1, true );
				if ( newValue ) {
					addressObject.type1 = newValue;
				}
				else {
					delete addressObject.type1;
				}
			}

			if ( addressObject.hasOwnProperty( "type2" ) ) {
				newValue = streetType( addressObject.type2, true );
				if ( newValue ) {
					addressObject.type2 = newValue;
				}
				else {
					delete addressObject.type2;
				}
			}

			if ( addressObject.hasOwnProperty( "prefix" ) ) {
				newValue = streetPrefix( addressObject.prefix, true );
				if ( newValue ) {
					addressObject.prefix = newValue;
				}
				else {
					delete addressObject.suffix;
				}
			}

			if ( addressObject.hasOwnProperty( "suffix" ) ) {
				newValue = streetSuffix( addressObject.suffix, true );
				if ( newValue ) {
					addressObject.suffix = newValue;
				}
				else {
					delete addressObject.suffix;
				}
			}

			if ( addressObject.hasOwnProperty( "city" ) ) {
				newValue = clean( addressObject.city, true );
				if ( newValue ) {
					addressObject.city = newValue;
				}
				else {
					delete addressObject.city;
				}
			}

			if ( addressObject.hasOwnProperty( "state" ) ) {
				newValue = statePossessionAbbreviations( addressObject.state, true );
				if ( newValue ) {
					addressObject.state = newValue;
				}
				else {
					delete addressObject.state;
				}
			}
		}

		return addressObject;
	};

} ).call( this );

