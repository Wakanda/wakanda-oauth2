 var config	= require( './config' );
 var error	= require( './error' );
 var tools = require('./tools');
 
/*
 * oauth2 Initiator
 *  - CSRF protection : Generate and store a UUID in the user's session
 *  - Dispatch the UUID to the selected provider's module
 *  - Get back a redirection URL to OP
 *  - Redirect to OP server
 */
 function init( request , response ) {

	var CSRF		= generateUUID();
	
	var urlQuery	= request.rawURL.split( '?' )[ 1 ];//workaround
	
	var params		= tools.parseQueryString( urlQuery );
    
    var redirectTo	= require( 'oauth2-provider-' + params.provider ).getRedirectURL( { 'CSRF' : CSRF , 'provider' : params.provider } );

    sessionStorage[ config._SESSION.CSRF ] = CSRF;
    
    response.headers['location']	= redirectTo;
    
    response.statusCode				= 302;

    return '';

};

/*
 * oauth2 Callback
 *  - CSRF protection : Compare received UUID with the one in the user's session
 *  - Call the provider's module to exchange received Code for a Token
 *  - TODO : Verify token
 */
function callback( request , response ) {

	var urlQuery	= request.rawURL.split( '?' )[ 1 ];//workaround
	var params		= tools.parseQueryString( urlQuery );
	var state		= ( typeof params.state[ 0 ] == 'string' ) ? tools.parseQueryString( params.state[ 0 ] ) : undefined;
	var provider	= state.from[ 0 ];

	/**
	 * Check provider authorisation error
	 * Redirect on wakanda failure page. Return through url params a wakanda 'error_code' and 'error_name'
	 */
	if ( params.error )
	{
		var myUserErrorCode = error.create(params.error, params.error_description);
    	var myResponse = error.redirect(myUserErrorCode, response);
		return myResponse;
	}
	
	/**
	 * Check if state parameter value is defined
	 * Redirect on wakanda failure page. Return through url params a wakanda 'error_code' and 'error_name'
	 */
	if ( typeof state == 'undefined' )
	{
		var myUserErrorCode = error.create('missing_state');
    	var myResponse = error.redirect(myUserErrorCode, response);
		return myResponse;
	}
	
	/*
	 * Verify that the CSRF parameter value corresponds to the user's session.
	 * Redirect on wakanda failure page. Return through url params a wakanda 'error_code' and 'error_name'
	 */

    if ( ! sessionStorage[ config._SESSION.CSRF ] && sessionStorage[ config._SESSION.CSRF ] != state[ 'CSRF' ][ 0 ] )
	{
		var myUserErrorCode = error.create('invalid_CSRF');
    	var myResponse = error.redirect(myUserErrorCode, response);
		return myResponse;
    }
    
    /*
	 * Call the provider's module to exchange received Code for a Token.
	 * Returns an object with two optional fields : error and data
	 */
	try {
		
		var exchangeResponse = require( 'oauth2-provider-' + provider ).exchangeCodeForToken( params );
	
	} catch( e ) {
		/**
		 * Handle oauth2 errors
		 * Redirect on wakanda failure page. Return through url params a wakanda 'error_code', provider 'error_name' and 'error_description'
		 */
		var myUserErrorCode = error.create(e.error, e.error_description);
    	var myResponse = error.redirect(myUserErrorCode, response);
		return myResponse;
	}
    
	/**
	 * Check if user.email is returned
	 * Redirect on wakanda failure page. Return through url params a wakanda 'error_code'
	 */
    if ( !exchangeResponse.email )
	{
		var myUserErrorCode = error.create('missing_user_mail');
    	var myResponse = error.redirect(myUserErrorCode, response);
		return myResponse;
	}
	
	/**
	 * oauth2 authentification success. Create a Wakanda user session.
	 * @return success
	 */
    createOAuth2Session( exchangeResponse );
	loginByPassword( exchangeResponse.email );
	response.headers['location'] = config.redirectOnSuccess;
	response.statusCode = 302;
	return response;
}

function createOAuth2Session( info ) {

	sessionStorage[ config._SESSION.EMAIL ] = info.email;
	
	sessionStorage[ config._SESSION.TOKEN ] = info.token;
	
};

