var client	= require( './client' );

exports.exchangeCodeForToken = function exchangeCodeForToken( params ) {
	
	var xhr = new XMLHttpRequest();
    
    xhr.open( 'POST' , getEndpointFromParams('https://graph.facebook.com/oauth/access_token',{
    
    	'code' : params[ 'code' ][ 0 ],
        
        'client_id' : client.client_id,
        
        'client_secret' : client.client_secret, 
        
        'redirect_uri' : client.redirect_uri,
        
        'grant_type' : 'authorization_code'
    
    }) , false );
    
    xhr.send();
    
  	var response		= xhr.responseText;
  	var parsedResponse	= parseQueryString( response );
  	
    /*
	 * Check for errors returned in the body
	 */
    if ( parsedResponse.error ) {
    
    	throw {
	    	
	    	name : parsedResponse.error,
	    	
	    	description : parsedResponse.error_description
	    	
	    };
    
    }
  	
  	var userInfo		= getUserInfo( parsedResponse.access_token );
  	
  	/*
	 * Check for errors returned in the body
	 */
    if ( userInfo.error ) {
    
    	throw {
	    	
	    	name : userInfo.error.type,
	    	
	    	description : userInfo.error.message
	    	
	    };
    
    }
    
    return {
    	
    	email : userInfo.email
    	
    };

};

exports.getRedirectURL = function( params ){

	var redirectTo	= getEndpointFromParams( 'https://www.facebook.com/dialog/oauth' , {
    
        client_id : client.client_id,
        
        response_type : 'code',
        
        scope : client.scope,
        
        redirect_uri : (client.baseUrl + '/oauth2callback').replace( /\/\/oauth2callback/ , '/oauth2callback' ), // "//" -> "/"
        
        state : 'CSRF=' + params.CSRF + '&from=' + params.provider
    
    });
    
    return redirectTo;

};

function getUserInfo( token ) {

	var xhr	= new XMLHttpRequest();
	
	xhr.open( 'GET' , 'https://graph.facebook.com/me?access_token=' + token , false );
	
	xhr.send();
	
	var response		= xhr.responseText;
	
	var parsedResponse	= JSON.parse( response );
	
	return parsedResponse;

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

function parseQueryString(queryString) {
	
	var qd = {};
	
    queryString.split("&").forEach(function(item) {var k = item.split("=")[0], v = decodeURIComponent(item.split("=")[1]); (k in qd) ? qd[k].push(v) : qd[k] = [v,]});
    
    return qd;
    
};