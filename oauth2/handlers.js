 var config		= require( './config' );
 var errorCode	= require( './error' );
 
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
	
	var params		= parseQueryString( urlQuery );
    
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
	var params		= parseQueryString( urlQuery );
	var state		= ( typeof params.state[ 0 ] == 'string' ) ? parseQueryString( params.state[ 0 ] ) : undefined;
	var provider	= state.from[ 0 ];

	/**
	 * Check if user rejects authorisation
	 * Redirect on wakanda failure page. Return through url params a wakanda 'error_code' and 'error_name'
	 */
	if ( params.error )
	{
		var error = errorCode['1'];
		console.error(provider +' oauth2 error: ', error);
    	response.statusCode	= 307;
    	response.headers['location'] = config.redirectOnFailure +'?error_code='+ error.code +'&error_name='+ error.name;
		return response;
	}
	
	/**
	 * Check if state parameter value is defined
	 * Redirect on wakanda failure page. Return through url params a wakanda 'error_code' and 'error_name'
	 */
	if ( typeof state == 'undefined' )
	{
		var error = errorCode['2'];
		console.error(provider +' oauth2 error: ', error);
    	response.statusCode	= 307;
    	response.headers['location'] = config.redirectOnFailure +'?error_code='+ error.code +'&error_name='+ error.name;
		return response;
	}
	
	/*
	 * Verify that the CSRF parameter value corresponds to the user's session.
	 * Redirect on wakanda failure page. Return through url params a wakanda 'error_code' and 'error_name'
	 */
    if ( ! sessionStorage[ config._SESSION.CSRF ] && sessionStorage[ config._SESSION.CSRF ] != state[ 'CSRF' ][ 0 ] ) {
		var error = errorCode['3'];
		console.error(provider +' oauth2 error: ', error);
    	response.statusCode	= 307;
    	response.headers['location'] = config.redirectOnFailure +'?error_code='+ error.code +'&error_name='+ error.name;
		return response;
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
		var error = errorCode['3'];
		console.error(provider +' oauth2 error: ', error);
		response.statusCode	= 307;
    	response.headers['location'] = config.redirectOnFailure +'?error_code='+ error.code +'&error_name='+ e.name +'&error_description='+ e.description;
		return response;
	}
    
	/**
	 * Check if user.email is returned
	 * Redirect on wakanda failure page. Return through url params a wakanda 'error_code' and 'error_name'
	 */
    if ( !exchangeResponse.email )
	{
		var error = errorCode['4'];
		console.error(provider +' oauth2 error: ', error);
		response.statusCode	= 307;
    	response.headers['location'] = config.redirectOnFailure +'?error_code='+ error.code +'&error_name='+ error.name;
		return response;
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

function parseQueryString(queryString) {
	
	var qd = {};
	
    queryString.split("&").forEach(function(item) {var k = item.split("=")[0], v = decodeURIComponent(item.split("=")[1]); (k in qd) ? qd[k].push(v) : qd[k] = [v,]});
    
    return qd;
    
};