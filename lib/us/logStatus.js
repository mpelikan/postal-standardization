( function () {
	"use strict";

	module.exports = function ( functionName, propertyName, value ) {
		var logString = "";
		var valueString;
		var displayLogging = false;

		if ( displayLogging ) {
			if ( arguments.length > 0 ) {
				if ( arguments.length > 2 ) {
					if ( typeof value === "object" || Array.isArray( value ) ) {
						valueString = JSON.stringify( value, null, "\t" );
					}
					else {
						valueString = "" + value;
					}
				}

				if ( functionName ) {
					logString += functionName + "()";
					if ( propertyName ) {
						logString += ": ";
					}
					else {
						if ( arguments.length > 2 ) {
							logString += " = ";
						}
					}
				}
				if ( propertyName ) {
					logString += propertyName;

					if ( arguments.length > 2 ) {
						logString += " = ";
					}
				}
				if ( arguments.length > 2 ) {
					logString += valueString;
				}
			}

			console.info( logString );
		}
	};

} ).call( this );