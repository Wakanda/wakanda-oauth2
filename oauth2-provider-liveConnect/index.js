
/*
 * Require the client conf file
 */
var client	= require( './client' );
var tools = require('../oauth2/tools');

/**
 * 
 * Request an user authorisation to the provider (windows live)
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
	 * Request user authorisation to provider (windows live)
	 * https://msdn.microsoft.com/fr-fr/library/hh243647.aspx#authcodegrant
	 */
	var redirectTo = tools.getEndpointFromParams( 'https://login.live.com/oauth20_authorize.srf' , {
        client_id		: client.client_id,
        response_type	: 'code',
        scope			: client.scope,
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
 * @throw {Object} error oauth2 errors
 * @throw {Object} error.name
 * @throw {Object} error.description
 */
function exchangeCodeForToken( params )
{
	
	/*
	 * Request token to provider (windows live)
	 * https://msdn.microsoft.com/fr-fr/library/hh243647.aspx#authcodegrant
	 */
	var xhr = new XMLHttpRequest();
    var body = tools.formBodyFromJSON({
        'code'			: params[ 'code' ][ 0 ],
        'client_id'		: client.client_id,
        'client_secret'	: client.client_secret, 
        'redirect_uri'	: client.redirect_uri,
        'grant_type'	: 'authorization_code'
	});
    xhr.open( 'POST' , 'https://login.live.com/oauth20_token.srf' , false );
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
	 * Get user info (email needed) from provider (windows live)
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
    	email	: userInfo.emails.account,
    	token	: parsedResponse.access_token
    };
}

/**
 * Get the user info through windows live API
 * 
 * @param {string} token - access_token from windows live authorisation
 * 
 * @return {Object} User info https://msdn.microsoft.com/en-us/library/hh243648.aspx#user
 */
function getUserInfo( token )
{
	var xhr	= new XMLHttpRequest();
	xhr.open( 'GET' , 'https://apis.live.net/v5.0/me?access_token=' + token , false );
	xhr.send();

	var response		= xhr.responseText;
	var parsedResponse	= JSON.parse( response );
	
	return parsedResponse;
}

exports.getRedirectURL = getRedirectURL;
exports.exchangeCodeForToken  = exchangeCodeForToken;