
/*
 * Require the client conf file
 */

var client	= require( './client' );

/**
 * 
 * Request an user authorisation to the provider (dropbox)
 *
 * @param {Object} params - 
 * @param {string} params.CSRF - User UUID
 * @param {string} params.provider - Provider which grant the authorisation & token
 * 
 * @return {string} partial url with parameters
 */
function getRedirectURL( params )
{
	/*
	 * Request user authorisation to provider (dropbox)
	 * https://blogs.dropbox.com/developers/2013/07/using-oauth-2-0-with-the-core-api/
	 */
	var redirectTo = getEndpointFromParams( 'https://www.dropbox.com/1/oauth2/authorize' , {
        client_id		: client.client_id,
        response_type	: 'code',
        redirect_uri	: (client.baseUrl + '/oauth2callback').replace( /\/\/oauth2callback/ , '/oauth2callback' ), // "//" -> "/"
        state			: 'CSRF='+ params.CSRF +'&from='+ params.provider
    });
    
    return redirectTo;
}

/**
 * 
 * Request a authenfication token (access_token) to the provider 
 *
 * @param {Object} params
 * @param {string} params.CSRF - User UUID
 * @param {string} params.provider - Provider which grant the authorisation & token
 * 
 * @return {string} partial url with parameters
 */
function exchangeCodeForToken( params )
{
	/*
	 * Check for errors returned in the URI
	 */	 
	if ( params.error )
		return {
	    	type	: 'error',
	    	error	: params.error[ 0 ]
	    };
	
	/*
	 * Request token to provider (dropbox)
	 * https://blogs.dropbox.com/developers/2013/07/using-oauth-2-0-with-the-core-api/
	 */
	var xhr = new XMLHttpRequest();
    var body = formBodyFromJSON({
        'code'			: params[ 'code' ][ 0 ],
        'client_id'		: client.client_id,
        'client_secret'	: client.client_secret, 
        'redirect_uri'	: client.redirect_uri,
        'grant_type'	: 'authorization_code'
	});
    xhr.open( 'POST' , 'https://api.dropbox.com/1/oauth2/token' , false );
    xhr.setRequestHeader( 'Content-Type' , 'application/x-www-form-urlencoded' );
    xhr.send( body );
    
    /*
     * Get a token in response if client has authorized it (see getRedirectURL() above)
     */
  	var response		= xhr.responseText;
  	var parsedResponse	= JSON.parse( response );
  	
    /*
	 * Check for errors returned in the body
	 */
    if ( parsedResponse.error )
    	throw {
	    	name		: parsedResponse.error,
	    	description	: parsedResponse.error_description
	    };

	/*
	 * Get user info (email needed) from provider (dropbox)
	 */
  	var userInfo = getUserInfo( parsedResponse.access_token );
  	
  	/*
	 * Check for errors returned in the body
	 */
    if ( userInfo.error )
    	throw {
	    	name		: userInfo.error.type,
	    	description	: userInfo.error.message
	    };
    
    /*
     * return the access_token and the email for wakanda authentification
     */
    return {
    	email	: userInfo.email,
    	token	: parsedResponse.access_token
    };
}

/**
 * Get the user info through Dropbox API
 * 
 * @param {string} token - access_token from Dropbox authorisation
 * 
 * @return {Object} User info https://www.dropbox.com/developers/core/docs#account-info
 */
function getUserInfo( token )
{
	var xhr	= new XMLHttpRequest();
	xhr.open( 'GET' , 'https://api.dropbox.com/1/account/info?access_token=' + token , false );
	xhr.send();

	var response		= xhr.responseText;
	var parsedResponse	= JSON.parse( response );
	
	return parsedResponse;
}

/**
 * Create an url with base URL and params
 * 
 * @param {string} baseUrl - base url of the application
 * @param {Object} params - convert key:value to key=value
 * 
 * @return {string} url - the final url with given params
 */
function getEndpointFromParams( baseUrl , params )
{
	var url = baseUrl + '?';
    for ( var param in params )
    {
    	url += param +'='+ encodeURIComponent( params[ param ] ) +'&'
    }
    
    return url;
}

/**
 * Stringify params for body XHR
 * 
 * @param {Object} params - convert key:value to key=value
 * 
 * @return {string} body - the stringify params to append inside a body XHR
 */
function formBodyFromJSON( params )
{
	var body = "";
    for ( var key in params )
    {
    	body += key + '=' + encodeURIComponent( params[ key ] ) + '&'
    }
    
    return body;
}

exports.getRedirectURL = getRedirectURL;
exports.exchangeCodeForToken  = exchangeCodeForToken;