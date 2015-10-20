var client	= require( './client' );
var tools = require('../oauth2/tools');

exports.exchangeCodeForToken = function exchangeCodeForToken( params ) {
	
	var xhr = new XMLHttpRequest();
	
	xhr.open( 'POST' , tools.getEndpointFromParams('https://graph.facebook.com/oauth/access_token',{
		'code'			: params[ 'code' ][ 0 ],
		'client_id'		: client.client_id,
		'client_secret'	: client.client_secret, 
		'redirect_uri'	: client.redirect_uri,
		'grant_type'	: 'authorization_code'
	}) , false );
	try{
		xhr.send();
	}catch(e){
		throw {
			name		: 'unreachable_url',
			description	: 'XHR request POST https://graph.facebook.com/oauth/access_token failed'
		};
	}

	var response		= xhr.responseText;
	var parsedResponse	= tools.parseQueryString( response );
	
	/*
	 * Check for errors returned in the body
	 */
	if ( parsedResponse.error ) {
	
		throw {
			name		: parsedResponse.error,
			description	: parsedResponse.error_description
		};
	}
	
	var userInfo		= getUserInfo( parsedResponse.access_token );
	
	/*
	 * Check for errors returned in the body
	 */
	if ( userInfo.error ) {
	
		throw {
			name		: userInfo.error.type,
			description	: userInfo.error.message
		};
	}
	
	return {
		email : userInfo.email
	};
};

exports.getRedirectURL = function( params ){

	var redirectTo	= tools.getEndpointFromParams( 'https://www.facebook.com/dialog/oauth' , {
		client_id		: client.client_id,
		response_type	: 'code',
		scope			: params.scope || client.scope,
		redirect_uri	: (client.baseUrl + '/oauth2callback').replace( /\/\/oauth2callback/ , '/oauth2callback' ), // "//" -> "/"
		state			: 'CSRF=' + params.CSRF + '&from=' + params.provider
	});
	
	return redirectTo;
};

function getUserInfo( token ) {

	var xhr	= new XMLHttpRequest();
	
	xhr.open( 'GET' , 'https://graph.facebook.com/me?access_token=' + token , false );
	try{
		xhr.send();
	}catch(e){
		throw {
			name		: 'unreachable_url',
			description	: 'XHR request GET https://graph.facebook.com/me?access_token=' + token + ' failed'
		};
	}
	
	var response		= xhr.responseText;
	var parsedResponse	= JSON.parse( response );
	return parsedResponse;
};
