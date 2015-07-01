
var client	= require( './client' );


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
        
        'redirect_uri' : client.redirect_uri

    
	});
	
	
	 
	 
	xhr.open( 'POST' , 'https://github.com/login/oauth/access_token' , false );
	
	xhr.setRequestHeader( 'Content-Type' , 'application/x-www-form-urlencoded' );
	
	xhr.setRequestHeader( 'Accept', 'application/json'  );
	
	
	
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
	 /*
    var JWT				= require( 'JWT' );
    
    var userInfo		= JWT.verify( parsedResponse.access_token ).body;
    //The replace part is a workaround for a base64 encoding issue
    var parsedUserInfo	= JSON.parse( userInfo.replace(/\0/g,"") );
    //*/
    
    /**
	  * get user infos
	  */
	 
	 xhr = new XMLHttpRequest();
	 xhr.open( 'GET' , 'https://api.github.com/user?access_token=' + parsedResponse.access_token , false );
	 xhr.send();
	 
	 
	 var r = JSON.parse(xhr.responseText);
	 
    
    return {
    	//email : parsedUserInfi.email
    	email : r.email,
    	token : r.access_token
    	
    };

};


exports.getRedirectURL = function( params ){

	var redirectTo	= getEndpointFromParams( 'https://github.com/login/oauth/authorize' , {
    
        client_id : client.client_id,
        
        //response_type : 'code',
        
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

function getUrlVarsToJson(url) {
    var hash;
    var myJson = {};
    var hashes = url;//;.slice(url.indexOf('?') + 1).split('&');
    for (var i = 0; i < hashes.length; i++) {
        hash = hashes[i].split('=');
        myJson[hash[0]] = hash[1];
    }
    return myJson;
}
