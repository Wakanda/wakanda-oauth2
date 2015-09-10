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

    var redirectTo	= require( 'oauth2-provider-' + params.provider ).getRedirectURL( { 'CSRF' : CSRF , 'provider' : params.provider, 'scope': params.scope } );

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

    if ( ! sessionStorage[ config._SESSION.CSRF ] && sessionStorage[ config._SESSION.CSRF ] != state[ 'CSRF' ][ 0 ] )
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
		return error.redirectUrl(response, e.name, e.description);
	}

	/**
	 * Check if user.email is returned
	 * Redirect on wakanda failure page. Return through url params a wakanda 'error'
	 */
    if ( !exchangeResponse.email )
		return error.redirectUrl(response, 'missing_user_email');
	
	/**
	 * oauth2 authentification success. Create/Update a Wakanda user session.
	 */
	createWakSession( exchangeResponse );
    createOAuth2Session( exchangeResponse ); // SessionStorage must be set after the user session creation. Otherwise, the sessionStorage will be reset.
	response.headers['location'] = config.redirectOnSuccess;
	response.statusCode = 302;
	
	return response;
}

function createOAuth2Session( info ) {
	sessionStorage[ config._SESSION.EMAIL ] = info.email;
	sessionStorage[ config._SESSION.TOKEN ] = info.token;
}

function createWakSession( info ) {

	/*
	 * Check if user is already registered
	 */
	var user = ds[ config._DATACLASS_USER ]( { email : info.email } );
	
	/*
	 * Create an user Account if first login
	 */
	if ( ! user )
	{
		user = ds[ config._DATACLASS_USER ].createEntity(); 
		user.UID = generateUUID();
		user.email = info.email;
		user.save( );
	}	
	
	/*
	 * Create a wakanda user session
	 */
    createUserSession({
		ID: user.UID, 
		fullName: user.email,
		belongsTo: [],
		storage: {
			time:	new Date()
		}
	});
}
