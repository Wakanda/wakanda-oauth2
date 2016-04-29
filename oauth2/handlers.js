var config	= require( './config' );
var error	= require( './error' );
var tools	= require('./tools');

/*
 * oauth2 Initiator
 *  - CSRF protection : Generate and store a UUID in the user's session
 *  - Dispatch the UUID to the selected provider's module
 *  - Get back a redirection URL to OP
 *  - Redirect to OP server
 */
function init( request , response )
{
	var CSRF		= generateUUID();
	var urlQuery	= request.rawURL.split( '?' )[ 1 ];//workaround
	var params		= tools.parseQueryString( urlQuery );
	var provider	= params.provider[ 0 ];
	var redirectTo	= require( 'oauth2-provider-' + provider ).getRedirectURL( { 'CSRF' : CSRF , 'provider' : provider, 'scope': params.scope, 'access_type': params.access_type, 'approval_prompt': params.approval_prompt } );
	
	config.setElement(currentSession().ID + ":" + provider +':CSRF', CSRF);
	
	response.headers['location']			= redirectTo;
	response.statusCode						= 302;
	
	return '';
};

/*
 * oauth2 Callback
 *  - CSRF protection : Compare received UUID with the one in the user's session
 *  - Call the provider's module to exchange received Code for a Token
 *  - TODO : Verify token
 */
function callback( request , response )
{
	var urlQuery	= request.rawURL.split( '?' )[ 1 ];//workaround
	var params		= tools.parseQueryString( urlQuery );
	var state		= ( typeof params.state[ 0 ] == 'string' ) ? tools.parseQueryString( params.state[ 0 ] ) : undefined;
	var provider	= state.from[ 0 ];
	
	/**
	 * Check provider authorisation error
	 * Redirect on wakanda failure page. Return through url params a wakanda 'error'
	 */
	if ( params.error )
		return error.redirectUrl(response, params.error, params.error_description);
	
	/**
	 * Check if state parameter value is defined
	 * Redirect on wakanda failure page. Return through url params a wakanda 'error'
	 */
	if ( typeof state == 'undefined' )
		return error.redirectUrl(response, 'missing_state');
	
	/*
	 * Verify that the CSRF parameter value corresponds to the user's session.
	 * Redirect on wakanda failure page. Return through url params a wakanda 'error'
	 */
	var csrfValue = config.getElement(currentSession().ID + ":" + provider +':CSRF');
	
	if ( ! csrfValue && csrfValue != state[ 'CSRF' ][ 0 ] )
		return error.redirectUrl(response, 'invalid_CSRF');
	
	/*
	 * Call the provider's module to exchange received Code for a Token.
	 * Returns an object with two optional fields : error and data
	 */
	try {
		
		var exchangeResponse = require( 'oauth2-provider-' + provider ).exchangeCodeForToken( params );
	
	} catch( e ) {
		/**
		 * Handle oauth2 errors
		 * Redirect on wakanda failure page. Return through url params a wakanda 'error'
		 */
		return error.redirectUrl(response, e.error, e.error_description);
	}
	
	/**
	 * Check if user.email is returned
	 * Redirect on wakanda failure page. Return through url params a wakanda 'error'
	 */
	if ( !exchangeResponse.email )
		return error.redirectUrl(response, 'missing_user_email');
	
	/**
	 * oauth2 authentification success. Call config.js/setSession()
	 */
	try{
		config.setSession( provider, exchangeResponse );
		config.setRefreshToken( provider, exchangeResponse.refresh_token );
		config.setAccessToken( provider, exchangeResponse.token);
	}catch(e){
		e.error = "RUNTIME_ERROR";
		return error.redirectUrl(response, e.error, e.error_description);
	}
		
	response.headers['location'] = config.redirectOnSuccess;
	response.statusCode = 302;
	
	return response;
}