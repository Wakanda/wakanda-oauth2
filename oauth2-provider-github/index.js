var client	= require( './client' );
var tools = require('../oauth2/tools');

exports.exchangeCodeForToken = function exchangeCodeForToken( params ) {

	var xhr = new XMLHttpRequest();
    
    var body = tools.formBodyFromJSON({
        
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
	    	name		: 'unreachable_url',
	    	description	: 'XHR request POST https://github.com/login/oauth/access_token failed'
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
	    	name		: 'unreachable_url',
	    	description	: 'XHR request GET https://api.github.com/user/emails?access_token=' + token + ' failed'
	    };
	}
	 
	 
	 
	 var r = JSON.parse(xhr.responseText);
	 
    
    return {
    	email : r[0].email,
    	token : parsedResponse.access_token
    	
    };

};

exports.getRedirectURL = function( params ){

	var redirectTo	= tools.getEndpointFromParams( 'https://github.com/login/oauth/authorize' , {
    
        client_id : client.client_id,
        
        //response_type : 'code',
        
        scope : params.scope || client.scope,
        
        redirect_uri : (client.baseUrl + '/oauth2callback').replace( /\/\/oauth2callback/ , '/oauth2callback' ), // "//" -> "/"
        
        state : 'CSRF=' + params.CSRF + '&from=' + params.provider
    
    });
    
    return redirectTo;

};
