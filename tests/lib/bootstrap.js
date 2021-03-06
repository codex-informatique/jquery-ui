( function() {

window.requirejs = {
	paths: {
		"globalize": "../../../external/globalize/globalize",
		"globalize/ja-JP": "../../../external/globalize/globalize.culture.ja-JP",
		"jquery": jqueryUrl(),
		"jquery-simulate": "../../../external/jquery-simulate/jquery.simulate",
		"jshint": "../../../external/jshint/jshint",
		"lib": "../../lib",
		"phantom-bridge": "../../../node_modules/grunt-contrib-qunit/phantomjs/bridge",
		"qunit-assert-classes": "../../../external/qunit-assert-classes/qunit-assert-classes",
		"qunit-assert-close": "../../../external/qunit-assert-close/qunit-assert-close",
		"qunit": "../../../external/qunit/qunit",
		"ui": "../../../ui"
	},
	shim: {
		"globalize/ja-JP": [ "globalize" ],
		"jquery-simulate": [ "jquery" ],
		"qunit-assert-classes": [ "qunit" ],
		"qunit-assert-close": [ "qunit" ]
	}
};

// Load all modules in series
function requireModules( dependencies, callback, modules ) {
	if ( !dependencies.length ) {
		if ( callback ) {
			callback.apply( null, modules );
		}
		return;
	}

	if ( !modules ) {
		modules = [];
	}

	var dependency = dependencies.shift();
	require( [ dependency ], function( module ) {
		modules.push( module );
		requireModules( dependencies, callback, modules );
	} );
}

// Load a set of test file along with the required test infrastructure
function requireTests( dependencies, noBackCompat ) {
	dependencies = [
		"lib/qunit",
		noBackCompat ? "jquery-no-back-compat" : "jquery",
		"jquery-simulate"
	].concat( dependencies );

	requireModules( dependencies, function( QUnit ) {
		swarmInject();
		QUnit.start();
	} );
}

// Parse the URL into key/value pairs
function parseUrl() {
	var data = {};
	var parts = document.location.search.slice( 1 ).split( "&" );
	var length = parts.length;
	var i = 0;
	var current;

	for ( ; i < length; i++ ) {
		current = parts[ i ].split( "=" );
		data[ current[ 0 ] ] = current[ 1 ];
	}

	return data;
}

function jqueryUrl() {
	var version = parseUrl().jquery;
	var url;

	if ( version === "git" || version === "git1" ) {
		url = "http://code.jquery.com/jquery-" + version;
	} else {
		url = "../../../external/jquery-" + ( version || "1.11.2" ) + "/jquery";
	}

	return url;
};

function swarmInject() {
	var url = parseUrl().swarmURL;

	if ( !url || url.indexOf( "http" ) !== 0 ) {
		return;
	}

	document.write( "<script src='http://swarm.jquery.org/js/inject.js?" +
		(new Date()).getTime() + "'></script>" );
}

// Load test modules based on data attributes
// - data-modules: list of test modules to load
// - data-widget: A widget to load test modules for
//   - Automatically loads common, core, events, methods, and options
// - data-deprecated: Loads the deprecated test modules for a widget
// - data-no-back-compat: Set $.uiBackCompat to false
(function() {

	// Find the script element
	var scripts = document.getElementsByTagName( "script" );
	var script = scripts[ scripts.length - 1 ];

	// Read the modules
	var modules = script.getAttribute( "data-modules" );
	if ( modules ) {
		modules = modules
			.replace( /^\s+|\s+$/g, "" )
			.split( /\s+/ );
	} else {
		modules = [];
	}
	var widget = script.getAttribute( "data-widget" );
	var deprecated = !!script.getAttribute( "data-deprecated" );
	var noBackCompat = !!script.getAttribute( "data-no-back-compat" );

	if ( widget ) {
		modules = modules.concat([
			( deprecated ? "common-deprecated" : "common" ),
			"core",
			"events",
			"methods",
			"options"
		]);
		if ( deprecated ) {
			modules = modules.concat( "deprecated" );
		}
	}

	// Load requirejs, then load the tests
	script = document.createElement( "script" );
	script.src = "../../../external/requirejs/require.js";
	script.onload = function() {

		// Create a module that disables back compat for UI modules
		define( "jquery-no-back-compat", [ "jquery" ], function( $ ) {
			$.uiBackCompat = false;

			return $;
		} );

		// Create a dummy bridge if we're not actually testing in PhantomJS
		if ( !/PhantomJS/.test( navigator.userAgent ) ) {
			define( "phantom-bridge", function() {} );
		}

		requireTests( modules, noBackCompat );
	};
	document.documentElement.appendChild( script );
} )();

} )();
