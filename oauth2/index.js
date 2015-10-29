/*
 * TODO
 *  - Add auto discovery component using configuration URL, ex : https://accounts.google.com/.well-known/openid-configuration
 *  - Declare dependencies in a packages.json file
 */


/*
 * Handler for service messages
 */

exports.postMessage = function(message) {
	
	var moduleFolderPath	= File(module.filename).parent.path;
	var handlersFilePath	= moduleFolderPath + 'handlers.js';

	if (message.name === "httpServerWillStop") {
		
		removeHttpRequestHandler('^/oauth2login', handlersFilePath, 'init');
		removeHttpRequestHandler('^/oauth2callback', handlersFilePath, 'callback');
		
	} else if (message.name === "httpServerDidStart") {
		
		directory.setLoginListener( 'oauth2LoginListener' , 'Admin' );
		
		addHttpRequestHandler('^/oauth2login', handlersFilePath, 'init');
		addHttpRequestHandler('^/oauth2callback', handlersFilePath, 'callback');
		
	}

};


/**
 * Refresh access_token
 * 
 * @return {Object} error
 * @return {string} error.error - Error code
 * @return {string} error.error_description - Error description
 */

exports.refreshToken = function(provider) {
	var config	= require( './config' );
	
	// Get refresh_token
	var refresh_token = sessionStorage[ config._SESSION.REFRESH_TOKEN ];
	if ( ! refresh_token ){
		var user = ds[ config._DATACLASS_USER ]( { UID : currentUser().ID } );
		if (user)
			refresh_token = user.refresh_token;	
	}
	
	// Error no refresh_token known
	if ( ! refresh_token )
		throw {
			error				: "no_refresh_token",
			error_description	: "Don't know any refresh_token to use"
		};
	
	// Refresh access_token
	try{
		var refreshResponse = require( 'oauth2-provider-' + provider ).refreshToken( refresh_token );
	}catch(e){
		throw e;
	}
	
	// Check for errors returned in the body
	if ( refreshResponse.error )
		throw refreshResponse;

	// Error no access_token returned
	if ( ! refreshResponse.access_token )
	{
		throw {
			error				: "invalid_refresh_token",
			error_description	: "No access_token where retrieved."
		};
	}

	// Save new access_token
	sessionStorage[ config._SESSION.TOKEN ] = refreshResponse.access_token;
};