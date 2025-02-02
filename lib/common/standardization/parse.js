( function () {
	"use strict";

	var clean = require( "../clean" );
	var country = require( "./country" );
	var zipcode = require( "./zipcode" );
	var state = require( "./statePossessionAbbreviations" );
	var number = require( "./number" );
	var street = require( "./street" );
	var unitType = require( "./unitType" );
	var logStatus = require( "../logStatus" );

	//	Internal DNA location codes
	//		x = Unknown
	//		C = Country
	//		Z = Zip
	//		S = State
	//		c = City Name
	//		n = Number
	//		p = Street Prefix
	//		f = Street Suffix
	//		s = Street Name
	//		t = Street Type
	//		u = Unit
	//		U = Unit with value

	module.exports = function ( addressString, callback ) {

		function processAddress() {

			function parseAddressLines() {

				function calculateLocationScore( location ) {

					function getMarkerScore( marker ) {

						if ( !marker ) {
							return 0;
						}

						switch ( marker ) {
							case "Z":
								return 10;
							case "S":
								return 7;
							case "C":
								return 6;
							case "x":
								return 1;
							case ",":
								return 0;
							default:
								return 2;
						}
					}

					var score = 0;
					var i;
					var length;

					length = location ? location.length : 0;

					for ( i = 0; i < length; i++ ) {
						score += getMarkerScore( location[ i ] );
					}

					return score;
				}

				function getBestLocationString() {

					function removeLocationsWithMatch( regExp ) {
						var property;

						if ( regExp ) {
							for ( property in locationsObj ) {
								if ( locationsObj.hasOwnProperty( property ) ) {
									if ( regExp.test( property ) ) {
										delete locationsObj[ property ];
									}
								}
							}
						}
					}

					function removeLocationsWithoutMatch( regExp ) {
						var property;

						if ( regExp ) {
							for ( property in locationsObj ) {
								if ( locationsObj.hasOwnProperty( property ) ) {
									if ( !regExp.test( property ) ) {
										delete locationsObj[ property ];
									}
								}
							}
						}
					}

					function getLocationsWithMatch( regExp ) {
						var property;
						var properties = null;

						if ( regExp ) {
							for ( property in locationsObj ) {
								if ( locationsObj.hasOwnProperty( property ) ) {
									if ( regExp.test( property ) ) {
										if ( !properties ) {
											properties = [];
										}
										properties[ property ] = locationsObj[ property ];
									}
								}
							}
						}

						return properties;
					}

					function getHighestLocationScore() {
						var highestScore = 0;
						var score;
						var location;

						for ( location in locationsObj ) {
							if ( locationsObj.hasOwnProperty( location ) ) {
								score = locationsObj[ location ];
								logStatus( "getHighestLocationScore", "[" + location + "]", score );
								if ( score > highestScore ) {
									highestScore = score;
								}
							}
						}

						return highestScore;
					}

					function removeLocationsWithoutHighestScore() {
						var highestScore = getHighestLocationScore();
						var location, score;

						logStatus( "removeLocationsWithoutHighestScore", "removing those without score of: " + highestScore );

						for ( location in locationsObj ) {
							if ( locationsObj.hasOwnProperty( location ) ) {
								score = locationsObj[ location ];
								if ( score !== highestScore ) {
									delete locationsObj[ location ];
								}
							}
						}
					}

					function getLowestLocationUnknowns() {
						var lowestUnknown;
						var count;
						var location;
						var match;

						for ( location in locationsObj ) {
							if ( locationsObj.hasOwnProperty( location ) ) {
								match = location.match( /x/gi );
								count = match ? match.length : 0;
								if ( lowestUnknown === undefined || count < lowestUnknown ) {
									lowestUnknown = count;
								}
							}
						}

						return lowestUnknown;
					}

					function removeLocationsWithHigherUnknowns() {
						var lowestUnknown = getLowestLocationUnknowns();
						var location, count;
						var match;

						for ( location in locationsObj ) {
							if ( locationsObj.hasOwnProperty( location ) ) {
								match = location.match( /x/gi );
								count = match ? match.length : 0;
								if ( count !== lowestUnknown ) {
									delete locationsObj[ location ];
								}
							}
						}
					}

					var regExp;

					if ( Object.keys( locationsObj ).length <= 1 ) {
						return;
					}

					regExp = /^(u{0,2},?)(?:(n*p?)([nx]+?(?:t?n+)?)(t?n?f?))??(?:(,?u{0,2},?))(x*)(,?S*,?Z*,?C*)$/;
					removeLocationsWithoutMatch( regExp );
					logStatus( "getBestLocationString", "valid locationsObj", locationsObj );

					//	See if country on its own.
					regExp = /^C*$/;
					if ( getLocationsWithMatch( regExp ) ) {
						removeLocationsWithoutMatch( regExp );

						logStatus( "getBestLocationString", "Found country by its own." );

						if ( Object.keys( locationsObj ).length === 1 ) {
							return;
						}
					}

					//	See if country on its own phrase with zipcode and/or state before it.
					regExp = /^.*C+$/;
					if ( getLocationsWithMatch( regExp ) ) {
						logStatus( "getBestLocationString", "Found country at end." );

						regExp = /^.*[SZ]+\,*C+$/;
						if ( getLocationsWithMatch( regExp ) ) {
							logStatus( "getBestLocationString", "Found country with zipcode/state before it.");
							removeLocationsWithoutMatch( regExp );

							if ( Object.keys( locationsObj ).length === 1 ) {
								return;
							}
						}
						else {
							//	See if the country can be confused with a state (CA, for instance)
							logStatus( "getBestLocationString", "Did not find country with zipcode/state before it.");
							regExp = /^.*S+$/;
							if ( getLocationsWithMatch( regExp ) ) {
								logStatus( "getBestLocationString", "Found state at end; removing country only.");
								regExp = /^.*C+$/;
								removeLocationsWithMatch( regExp );

								if ( Object.keys( locationsObj ).length === 1 ) {
									return;
								}
							}
						}
					}

					//	Remove prefixes at end of phrase.
					regExp = /^.*p+(?:$|\,.*$)/;
					removeLocationsWithMatch( regExp );
					if ( Object.keys( locationsObj ).length === 1 ) {
						return;
					}

					//	Remove suffixes at beginning of phrase.
					regExp = /^(?:f+|.*\,f+).*$/;
					removeLocationsWithMatch( regExp );
					if ( Object.keys( locationsObj ).length === 1 ) {
						return;
					}

					logStatus( "getBestLocationString", "final locationsObj", locationsObj );

					removeLocationsWithoutHighestScore();
					removeLocationsWithHigherUnknowns();

					logStatus( "getBestLocationString", "Scored locationsObj", locationsObj );

					return;
				}

				function generateLocationStrings() {

					function getLocationStrings() {

						function generateMarkerCombinations( arr, i ) {
							var len = markers[ i ].length;
							var j, a;

							for ( j = 0; j < len; j++ ) {
								a = arr.slice( 0 ); // clone arr
								a.push( markers[ i ][ j ] );
								if ( i === max ) {
									locationsArray.push( a );
								}
								else {
									generateMarkerCombinations( a, i + 1 );
								}
							}
						}

						var max = numMarkers - 1;
						var locationsArray = [];
						var numLocations, locationIndex, location;
						var markerIndex, locationMarker;
						var locationWords;
						var breakIndex, wordBreak;

						generateMarkerCombinations( [], 0 );

						numLocations = locationsArray.length;
						for ( locationIndex = 0; locationIndex < numLocations; locationIndex++ ) {
							locationWords = "";
							location = locationsArray[ locationIndex ];
							breakIndex = 0;
							wordBreak = breaks[ breakIndex ];

							numMarkers = location.length;
							for ( markerIndex = 0; markerIndex < numMarkers; markerIndex++ ) {
								locationMarker = location[ markerIndex ];

								if ( markerIndex === wordBreak ) {
									locationWords += " ";
									breakIndex++;
									wordBreak = breaks[ breakIndex ];
								}
								locationWords += locationMarker;
							}

							//	Split phrase boundaries
							locationWords = locationWords.trim().replace( /\s/g, "," );

							if ( !locationsObj.hasOwnProperty( locationWords ) ) {
								locationsObj[ locationWords ] = calculateLocationScore( locationWords );
							}
						}
					}

					var breaks = [];
					var numBreaks, lineBreak;
					var line, lineStarts;

					for ( line = 0; line < numLines; line++ ) {
						lineStarts = lineWordStarts[ line ];
						numBreaks = lineStarts.length;
						for ( lineBreak = 0; lineBreak < numBreaks; lineBreak++ ) {
							breaks.push( lineStarts[ lineBreak ] );
						}
					}

					getLocationStrings();
					logStatus( "generateLocationStrings", "locationsObj", locationsObj );
				}

				function addMarker( marker ) {
					var wordIndex = phraseStart + word;
					var wordMarkers = markers[ wordIndex ];

					if ( wordMarkers.indexOf( marker ) === -1 ) {
						markers[ wordIndex ].push( marker );
					}
				}

				var lines, line, numLines, lineString, lineWordStarts, lineStart;
				var phrases, phrase, numPhrases, phraseString, phraseStart;
				var words, word, wordStart, wordEnd, numWords, wordString;
				var markers, marker, numMarkers;
				var locationsObj = {};
				var locationValue;

				logStatus( "parseAddressLines", "orig addressString", addressString );
				addressString = addressString.replace( /[\'\"\)\(]+/g, "" );
				logStatus( "parseAddressLines", "addressString", addressString );
				numMarkers = addressString.replace( /\s+/g, " " ).trim().split( " " ).length;
				logStatus( "parseAddressLines", "numMarkers", numMarkers );

				markers = new Array( numMarkers );
				for ( marker = 0; marker < numMarkers; marker++ ) {
					markers[ marker ] = [ "x" ];
				}

				//	Build lines from the address (explicit line breaks or tabs).
				if ( addressString && !lines ) {
					lines = addressString.split( /[\n\t]+/ );
				}
				logStatus( "parseAddressLines", "lines", lines );
				numLines = lines.length;
				logStatus( "parseAddressLines", "numLines", numLines );
				lineWordStarts = new Array( numLines );
				lineStart = 0;
				for ( line = 0; line < numLines; line++ ) {
					lineWordStarts[ line ] = [];
					lineWordStarts[ line ].push( lineStart );

					lineString = lines[ line ].replace( /\s+/g, " " ).trim();
					lines[ line ] = lineString;
					lineStart += lineString.split( " " ).length;
				}

				logStatus( "parseAddressLines", "lineWordStarts", lineWordStarts );

				for ( line = 0; line < numLines; line++ ) {
					lineString = lines[ line ];
					logStatus( "parseAddressLines", "lineString", lineString );

					phrases = lineString.split( "," );
					logStatus( "parseAddressLines", "phrases", phrases );
					numPhrases = phrases.length;
					logStatus( "parseAddressLines", "numPhrases", numPhrases );
					phraseStart = lineWordStarts[ line ][ 0 ];
					logStatus( "parseAddressLines", "phraseStart", phraseStart );

					for ( phrase = 0; phrase < numPhrases; phrase++ ) {
						if ( phraseStart !== lineWordStarts[ line ][ 0 ] ) {
							lineWordStarts[ line ].push( phraseStart );
						}
						phraseString = phrases[ phrase ].replace( /\s+/g, " " ).trim();
						logStatus( "parseAddressLines", "phraseString", phraseString );

						words = phraseString.split( " " );
						logStatus( "parseAddressLines", "words", words );
						numWords = words.length;
						logStatus( "parseAddressLines", "numWords", numWords );
						for ( wordStart = 0; wordStart < numWords; wordStart++ ) {
							for ( wordEnd = numWords - 1; wordEnd >= wordStart; wordEnd-- ) {
								logStatus( "parseAddressLines", "wordStart", wordStart );
								logStatus( "parseAddressLines", "wordEnd", wordEnd );
								wordString = "";
								for ( word = wordStart; word <= wordEnd; word++ ) {
									wordString += " " + clean( words[ word ] );
								}
								logStatus( "parseAddressLines", ( lineWordStarts[ line ] + wordStart ) + " - " + ( lineWordStarts[ line ] + wordEnd ) );
								logStatus( "parseAddressLines", "wordString", "'" + wordString.trim() + "'" );

								if ( country( wordString ) ) {
									for ( word = wordStart; word <= wordEnd; word++ ) {
										addMarker( "C" );
										logStatus( "parseAddressLines", "country match", wordString );
									}
								}
								if ( zipcode( wordString ) ) {
									for ( word = wordStart; word <= wordEnd; word++ ) {
										addMarker( "Z" );
										logStatus( "parseAddressLines", "zip match", wordString );
									}
								}
								if ( number.match( wordString ) ) {
									for ( word = wordStart; word <= wordEnd; word++ ) {
										addMarker( "n" );
										logStatus( "parseAddressLines", "number match", wordString );
									}
								}
								if ( state( wordString ) ) {
									for ( word = wordStart; word <= wordEnd; word++ ) {
										addMarker( "S" );
										logStatus( "parseAddressLines", "state match", wordString );
									}
								}
								if ( unitType.parse( wordString ) ) {
									for ( word = wordStart; word <= wordEnd; word++ ) {
										addMarker( "u" );
										logStatus( "parseAddressLines", "unit match", wordString );
									}
								}
								if ( street.prefix.match( wordString ) ) {
									for ( word = wordStart; word <= wordEnd; word++ ) {
										addMarker( "p" );
										logStatus( "parseAddressLines", "street prefix match", wordString );
									}
								}
								if ( street.suffix.match( wordString ) ) {
									for ( word = wordStart; word <= wordEnd; word++ ) {
										addMarker( "f" );
										logStatus( "parseAddressLines", "street suffix match", wordString );
									}
								}
								if ( street.type.match( wordString ) ) {
									for ( word = wordStart; word <= wordEnd; word++ ) {
										addMarker( "t" );
										logStatus( "parseAddressLines", "street type match", wordString );
									}
								}
							}
						}
						phraseStart += numWords;
					}
				}

				function replaceUnknowns() {
					var matchesRegExp, matches;
					var numx, i;
					var xReplacement;

					matchesRegExp = /^(u{0,2},?)(?:(n*p?)([nx]+?(?:t?n+)?)(t?n?f?))??(?:(,?u{0,2},?))(x*)(,?S*,?Z*,?C*)$/;
					if ( matchesRegExp.test( locationValue ) ) {
						matches = locationValue.match( matchesRegExp );
						logStatus( "replaceUnknowns", "matches", matches );

						//	1	u{0,2},?

						//	2	p?
						//	3	x+t?n?
						//	4	t?n?f?

						//	5	,u{0,2},?
						//	6	x*
						//	7	,?S*,?Z*,?C*

						locationValue = matches[ 1 ] ? matches[ 1 ] : "";

						if ( matches[ 3 ] ) {
							locationValue += matches[ 2 ] ? matches[ 2 ] : "";
							numx = matches[ 3 ] ? matches[ 3 ].length : 0;
							xReplacement = "";
							for ( i = 0; i < numx; i++ ) {
								xReplacement += "s";
							}
							locationValue += xReplacement;
							locationValue += matches[ 4 ] ? matches[ 4 ] : "";
						}

						locationValue += matches[ 5 ] ? matches[ 5 ] : "";

						if ( matches[ 6 ] ) {
							numx = matches[ 6 ] ? matches[ 6 ].length : 0;
							xReplacement = "";
							for ( i = 0; i < numx; i++ ) {
								xReplacement += "c";
							}
							locationValue += xReplacement;
						}

					}

					locationValue += matches[ 7 ] ? matches[ 7 ] : "";

					locationValue = locationValue.replace( /\,/g, "" );

					logStatus( "replaceUnknowns", "locationValue", locationValue );
				}

				function generateAddressObject() {

					var phrase = "";
					var type;
					var start, end;
					var wordString = addressString.replace( /[\s\,]+/g, " " ).replace( /\s+/g, " " ).trim();
					var words = wordString.split( " " );
					var numMarkers = locationValue.length;
					var i = 0;
					var index, numWords;
					var unitObj;

					logStatus( "generateAddressObject", "wordString", wordString );

					start = 0;
					end = 0;
					while ( i < numMarkers ) {
						logStatus( "generateAddressObject", "i", i );

						if ( locationValue[ i ] !== locationValue[ i + 1 ] ) {
							type = locationValue[ i ];
							end = i;
							numWords = end - start + 1;
							for ( index = 0; index < numWords; index++ ) {
								phrase += " " + words[ start + index ];
							}
							phrase = clean( phrase );

							logStatus( "generateAddressObject", "phrase", phrase );
							logStatus( "generateAddressObject", "type", type );

							switch ( type ) {
								case "n":
									addressObject.number = number.match( phrase );
									logStatus( "generateAddressObject", "'" + phrase + "' = Number: " + addressObject.number );
									break;
								case "t":
									addressObject.type = street.type.match( phrase );
									logStatus( "generateAddressObject", "'" + phrase + "' = Type: " + addressObject.type );
									break;
								case "p":
									addressObject.prefix = street.prefix.match( phrase );
									logStatus( "generateAddressObject", "'" + phrase + "' = Prefix: " + addressObject.prefix );
									break;
								case "f":
									addressObject.suffix = street.suffix.match( phrase );
									logStatus( "generateAddressObject", "'" + phrase + "' = Suffix: " + addressObject.suffix );
									break;
								case "u":
									unitObj = unitType.parse( phrase );
									if ( unitObj ) {
										logStatus( "generateAddressObject", "unitObj", unitObj );

										if ( unitObj.sec_unit_type ) {
											addressObject.sec_unit_type = unitObj.sec_unit_type;
											logStatus( "generateAddressObject", "'" + phrase + "' = Unit Type: " + addressObject.sec_unit_type );
										}
										if ( unitObj.sec_unit_num ) {
											addressObject.sec_unit_num = unitObj.sec_unit_num;
											logStatus( "generateAddressObject", "'" + phrase + "' = Unit Num: " + addressObject.sec_unit_num );
										}
									}
									break;
								case "s":
									addressObject.street = phrase;
									logStatus( "generateAddressObject", "'" + phrase + "' = Street: " + addressObject.street );
									break;
								case "c":
									addressObject.city = phrase;
									logStatus( "generateAddressObject", "'" + phrase + "' = City: " + addressObject.city );
									break;
								case "C":
									addressObject.country = country( phrase );
									logStatus( "generateAddressObject", "'" + phrase + "' = Country: " + addressObject.country );
									break;
								case "S":
									addressObject.state = state( phrase );
									logStatus( "generateAddressObject", "'" + phrase + "' = State: " + addressObject.state );
									break;
								case "Z":
									addressObject.zip = zipcode( phrase );
									logStatus( "generateAddressObject", "'" + phrase + "' = ZIP: " + addressObject.zip );
									break;
								default:
									logStatus( "generateAddressObject", "'" + phrase + "' = NOT MATCHED: " );
									break;
							}

							start = i + 1;
							end = i + 1;
							phrase = "";
						}

						i++;
					}
				}

				generateLocationStrings();

				getBestLocationString();

				locationValue = Object.keys( locationsObj )[ 0 ];
				logStatus( "parseAddressLines", "location[ 0 ] = " + locationValue );

				replaceUnknowns();
				logStatus( "parseAddressLines", locationValue );
				generateAddressObject();

				logStatus( "parseAddressLines", JSON.stringify( addressObject, null, "\t" ) );
			}

			var property;

			parseAddressLines();

			//	Cleanup
			for ( property in addressObject ) {
				if ( addressObject.hasOwnProperty( property ) ) {
					if ( addressObject[ property ] === null ) {
						delete addressObject[ property ];
					}
				}
			}
		}

		var addressObject = {};
		logStatus( "parse", "addressString", addressString );

		processAddress();

		callback( null, addressObject );
	};

} ).call( this );