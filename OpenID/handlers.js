 var config	= require( './config' );
 
/*
 * OpenID Connect Initiator
 *  - CSRF protection : Generate and store a UUID in the user's session
 *  - Dispatch the UUID to the selected provider's module
 *  - Get back a redirection URL to OP
 *  - Redirect to OP server
 */
 function init( request , response ) {

	var CSRF		= generateUUID();
	
	var urlQuery	= request.rawURL.split( '?' )[ 1 ];//workaround
	
	var params		= parseQueryString( urlQuery );
    
    var redirectTo	= require( 'OpenID-provider-' + params.provider ).getRedirectURL( { 'CSRF' : CSRF , 'provider' : params.provider } );

    sessionStorage[ config._SESSION.CSRF ] = CSRF;
    
    response.headers['location']	= redirectTo;
    
    response.statusCode				= 302;
    
    return '';

};

/*
 * OpenID Connect Callback
 *  - CSRF protection : Compare received UUID with the one in the user's session
 *  - Call the provider's module to exchange received Code for a Token
 *  - TODO : Verify token
 */
function callback( request , response ) {

	var urlQuery	= request.rawURL.split( '?' )[ 1 ];//workaround
	
	var params		= parseQueryString( urlQuery );
	
	var state		= ( typeof params.state[ 0 ] == 'string' ) ? parseQueryString( params.state[ 0 ] ) : undefined;
	
	var provider	= state.from[ 0 ];
	
	/*
	 * Verify that the state 
	 */
	
	if ( typeof state == 'undefined' ) {

		return JSON.stringify({
    		
    		type : 'error',
    		
    		error : 'format_error',
    		
    		error_description : '"state" is mandatory.'
    		
    	});
	
	};
	
	/*
	 * Verify that the CSRF parameter value corresponds to the user's session.
	 */
    if ( ! sessionStorage[ config._SESSION.CSRF ] && sessionStorage[ config._SESSION.CSRF ] != state[ 'CSRF' ][ 0 ] ) {
    
    	response.statusCode	= 400;

		return JSON.stringify({
    		
    		type : 'error',
    		
    		error : 'invalid_request',
    		
    		error_description : 'CSRF check failed.'
    		
    	});
   
    };
    
    /*
	 * Call the provider's module to exchange received Code for a Token.
	 * Returns an object with two optional fields : error and data
	 */
	try {
		
		var exchangeResponse = require( 'OpenID-provider-' + provider ).exchangeCodeForToken( params );
	
	} catch( e ) {
	
		request.statusCode	= 500;
    	
    	return JSON.stringify({
    		
    		type : 'error',
    		
    		error : e.name,
    		
    		error_description : e.description
    		
    	});
	
	};
    
    if ( exchangeResponse.email ) {
    	
    	createOpenIDSession( exchangeResponse );
    	
    	loginByPassword( exchangeResponse.email );
    	
    	response.headers['location']	= config.redirect;
    
    	response.statusCode				= 302;
    	
    	return response;
    
    };

};

function createOpenIDSession( info ) {

	sessionStorage[ config._SESSION.EMAIL ] = info.email;
	
	sessionStorage[ config._SESSION.TOKEN ] = info.token;
	
};

function parseQueryString(queryString) {
	
	var qd = {};
	
    queryString.split("&").forEach(function(item) {var k = item.split("=")[0], v = decodeURIComponent(item.split("=")[1]); (k in qd) ? qd[k].push(v) : qd[k] = [v,]});
    
    return qd;
    
};