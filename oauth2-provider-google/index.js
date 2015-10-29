var client	= require( './client' );
var tools	= require('../oauth2/tools');

exports.exchangeCodeForToken = function exchangeCodeForToken( params ) {

	var xhr	= new XMLHttpRequest();
	
	var body = tools.formBodyFromJSON({
		'code'			: params[ 'code' ][ 0 ],
		'client_id'		: client.client_id,
		'client_secret'	: client.client_secret, 
		'redirect_uri'	: client.redirect_uri,
		'grant_type'	: 'authorization_code'
	});
	
	xhr.open( 'POST' , 'https://www.googleapis.com/oauth2/v3/token' , false );
	xhr.setRequestHeader( 'Content-Type' , 'application/x-www-form-urlencoded' );
	try{
		xhr.send( body );
	}catch(e){
		throw {
			error				: 'unreachable_url',
			error_description	: 'XHR request POST https://www.googleapis.com/oauth2/v3/token failed'
		};
	}
	
	var response		= xhr.responseText;
	var parsedResponse	= JSON.parse( response );
	
	/*
	 * Check for errors returned in the body
	 */
	if ( parsedResponse.error )
		throw parsedResponse;
	
	/*
	 * Get user info (email needed) from provider (dropbox)
	 */
	var userInfo = getUserInfo( parsedResponse.access_token );
	
	/*
	 * Check for errors returned in the body
	 */
	if ( userInfo.error )
		throw parsedResponse;
	
	/*
	 * return the access_token and the email for wakanda authentification
	 */
	return {
		email			: userInfo.email,
		token			: parsedResponse.access_token,
		refresh_token	: parsedResponse.refresh_token
	};
};

exports.getRedirectURL = function( params ){

	var redirectTo	= tools.getEndpointFromParams( 'https://accounts.google.com/o/oauth2/auth' , {
		client_id		: client.client_id,
		response_type	: 'code',
		redirect_uri	: (client.baseUrl + '/oauth2callback').replace( /\/\/oauth2callback/ , '/oauth2callback' ), // "//" -> "/"
		state			: 'CSRF=' + params.CSRF + '&from=' + params.provider,
		scope			: params.scope || client.scope,
		access_type		: params.access_type || client.access_type,
		approval_prompt	: params.approval_prompt || client.approval_prompt
	});
	
	return redirectTo;
};

/**
 * Get the user info through Google API
 * 
 * @param {string} token - access_token from Google authorisation
 * @return {Object} User info
 */
function getUserInfo( token )
{
	var xhr	= new XMLHttpRequest();
	xhr.open( 'GET' , 'https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=' + token , false );
	try{
		xhr.send();
	}catch(e){
		throw {
			error				: 'unreachable_url',
			error_description	: 'XHR request GET https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=' + token + ' failed'
		};
	}
	
	var response		= xhr.responseText;
	var parsedResponse	= JSON.parse( response );
		
	return parsedResponse;
}

/**
 * Get the user info through Google API
 * 
 * @param {string} refresh_token - refresh_token from Google authorisation
 * @return {Object}
 */
exports.refreshToken = function( refresh_token ){

	var xhr	= new XMLHttpRequest();
	
	var body = tools.formBodyFromJSON({
		'client_id'		: client.client_id,
		'client_secret'	: client.client_secret, 
		'refresh_token'	: refresh_token,
		'grant_type'	: 'refresh_token'
	});
	
	xhr.open( 'POST' , 'https://www.googleapis.com/oauth2/v3/token' , false );
	xhr.setRequestHeader( 'Content-Type' , 'application/x-www-form-urlencoded' );
	try{
		xhr.send( body );
	}catch(e){
		throw {
			error				: 'unreachable_url',
			error_description	: 'XHR request POST https://www.googleapis.com/oauth2/v3/token failed'
		};
	}
	
	var response		= xhr.responseText;
	var parsedResponse	= JSON.parse( response );
		
	return parsedResponse;
};
