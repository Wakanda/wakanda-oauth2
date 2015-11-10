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
	sessionStorage[ provider +'_'+ config._SESSION.CSRF ]	= CSRF;
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
	
	if ( ! sessionStorage[ provider +'_'+ config._SESSION.CSRF ] && sessionStorage[ provider +'_'+ config._SESSION.CSRF ] != state[ 'CSRF' ][ 0 ] )
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
	 * oauth2 authentification success. Create/Update a Wakanda user session.
	 */
	
	createWakSession( exchangeResponse, provider );
	

	response.headers['location'] = config.redirectOnSuccess;
	response.statusCode = 302;
	
	return response;
}

function createWakSession( userInfo, provider )
{
	/*
	 * Keep CSRF in session storage. Session storage is reset with createUserSession()
	 */
	var CSRF			= sessionStorage[ provider +'_'+ config._SESSION.CSRF ];
	var refresh_token	= sessionStorage[ provider +'_'+ config._SESSION.REFRESH_TOKEN ];

	/*
	 * Check if user is already registered
	 */
	 // TODO user currentUser().ID instead ?
	var user = ds[ config._DATACLASS_USER ]( { 'email': userInfo.email, 'provider': provider } );
	
	/*
	 * Create an user Account if first login
	 */
	if ( ! user )
	{
		debugger;
		user				= ds[ config._DATACLASS_USER ].createEntity();
		user.UID			= currentUser().ID ? currentUser().ID : generateUUID();
		user.provider		= provider;
		user.email			= userInfo.email;
		user.refresh_token	= userInfo.refresh_token; // refresh_token needs to survive a server shutdown
		user.save( );
	}
	else if ( userInfo.refresh_token )
	{
		user.refresh_token	= userInfo.refresh_token; // refresh_token needs to survive a server shutdown
		user.save( );		
	}
	
	/*
	 * Create a wakanda user session
	 */
	if ( require( 'oauth2-provider-' + provider ).doAuthentication() )
	{
		createUserSession({
			ID: user.UID, 
			name: user.email,
			belongsTo: [],
			storage: {
				time: new Date()
			}
		});
	}
	
	/*
	 * Save again the CSRF in the session storage
	 * SessionStorage must be set after the user session creation. Otherwise, the sessionStorage will be reset.
	 */
	sessionStorage[ provider +'_'+ config._SESSION.CSRF ]			= CSRF;
	sessionStorage[ provider +'_'+ config._SESSION.EMAIL ]			= userInfo.email;
	sessionStorage[ provider +'_'+ config._SESSION.TOKEN ]			= userInfo.token;
	sessionStorage[ provider +'_'+ config._SESSION.REFRESH_TOKEN ]	= userInfo.refresh_token ? userInfo.refresh_token : refresh_token;
}