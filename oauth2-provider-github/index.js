var client	= require( './client' );


exports.exchangeCodeForToken = function exchangeCodeForToken( params ) {

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
	
    try{
	 	
		xhr.send(body);
	 	
	 }catch(e){
	 	throw {
	    	
	    	name : "Network Error",
	    	
	    	description : "Couldn't contact Github."
	    	
	    };
	 }
    
    
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
       
    /**
	  * get user infos
	  */
	 
	 xhr = new XMLHttpRequest();
	 
	 xhr.open( 'GET' , 'https://api.github.com/user/emails?access_token=' + parsedResponse.access_token , false );
	 
	 try{
	 	
		xhr.send();
	 	
	 }catch(e){
	 	throw {
	    	
	    	name : "Network Error",
	    	
	    	description : "Couldn't contact Github."
	    	
	    };
	 }
	 
	 
	 
	 var r = JSON.parse(xhr.responseText);
	 
    
    return {
    	email : r[0].email,
    	token : parsedResponse.access_token
    	
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