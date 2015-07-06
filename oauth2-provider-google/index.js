﻿var client	= require( './client' );

exports.exchangeCodeForToken = function exchangeCodeForToken( params ) {
	/*
	 * Check for errors returned in the URI
	 */	 
	if ( params.error ) {
	
		return {
    	
	    	type : 'error',
	    	
	    	error : params.error[ 0 ]
	    	
	    };
	
	};

	var xhr = new XMLHttpRequest();
    
    var body = formBodyFromJSON({
        
        'code' : params[ 'code' ][ 0 ],
        
        'client_id' : client.client_id,
        
        'client_secret' : client.client_secret, 
        
        'redirect_uri' : client.redirect_uri,
        
        'grant_type' : 'authorization_code'
    
	});
    
    xhr.open( 'POST' , 'https://www.googleapis.com/oauth2/v3/token' , false );
    
    xhr.setRequestHeader( 'Content-Type' , 'application/x-www-form-urlencoded' );
    
    xhr.send( body );
    
  	var response		= xhr.responseText;
  	var parsedResponse	= JSON.parse( response );
  	
    /*
	 * Check for errors returned in the body
	 */
    if ( parsedResponse.error ) {
    
    	throw {
	    	
	    	name : parsedResponse.error,
	    	
	    	description : parsedResponse.error_description
	    	
	    };
    
    }
    
    /*
	 * Verify token and get account's details.
	 */
    var JWT				= require( 'JWT' );
    
    var userInfo		= JWT.verify( parsedResponse.id_token ).body;
    
    //The replace part is a workaround for a base64 encoding issue
    var parsedUserInfo	= JSON.parse( userInfo.replace(/\0/g,"") );
    
    return {
    	
    	email : parsedUserInfo.email,
    	token : parsedResponse.access_token
    	
    };

};

exports.getRedirectURL = function( params ){

	var redirectTo	= getEndpointFromParams( 'https://accounts.google.com/o/oauth2/auth' , {
    
        client_id : client.client_id,
        
        response_type : 'code',
        
        scope : client.scope,
        
        redirect_uri : (client.baseUrl + '/oauth2callback').replace( /\/\/oauth2callback/ , '/oauth2callback' ), // "//" -> "/"
        
        state : 'CSRF=' + params.CSRF + '&from=' + params.provider
    
    });
    
    return redirectTo;

};


function getEndpointFromParams( baseUrl , params ){

	var url = baseUrl + '?';
    
    for ( var param in params ) {
    
    	url += param + '=' + encodeURIComponent( params[ param ] ) + '&'
    
    };
    
    return url;

};

function formBodyFromJSON( params ){

	var body = "";
    
    for ( var key in params ) {
    
    	body += key + '=' + encodeURIComponent( params[ key ] ) + '&'
    
    };
    
    return body;

};