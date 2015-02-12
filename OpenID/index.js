/*
 * TODO
 *  - Add auto discovery component using configuration URL, ex : https://accounts.google.com/.well-known/openid-configuration
 *  - Declare dependencies in a packages.json file
 *  - See if it is possible to use the Wakanda Crypto library
 */

var config	= require( './config' );

/*
 * Handler for service messages
 */

exports.postMessage = function(message) {
	
	var moduleFolderPath	= File(module.filename).parent.path;
	var handlersFilePath	= moduleFolderPath + 'handlers.js';

    if (message.name === "httpServerWillStop") {
    	
        removeHttpRequestHandler('^/OpenIDLogin', handlersFilePath, 'init');
		removeHttpRequestHandler('^/oauth2callback', handlersFilePath, 'callback');
		
    } else if (message.name === "httpServerDidStart") {
        
        directory.setLoginListener( 'OpenIDLoginListener' , 'Admin' );
        
        addHttpRequestHandler('^/OpenIDLogin', handlersFilePath, 'init');
		addHttpRequestHandler('^/oauth2callback', handlersFilePath, 'callback');
        
    }

};

exports.login	= function( login , password ) {
	
	/*
	 * If a password was given, then the user should not be an OpenID user
	 */
	if ( typeof password === 'string'  && password.length > 0 ) {
	
		if ( ds[ config._DATACLASS_USER ]( { email : login } ) ) {
				
			return { error: 1024, errorMessage:"invalid login/password combination." };
		
		} else {
			
			/*
			 * The login is not already used by an OpenID account, we can let the internal directory handle the login
			 */
			return false;
		
		};	
	}
	
	/*
	 * Empty passwords are not allowed for local authentication and are reserved for OpenID Connect
	 */
	if ( password === '' ) {
		
		var response	= verifySession( login );		
		var user		= ds[ config._DATACLASS_USER ]( { email : login } );
	
		if ( user && response === true ) {
			
			return getSessionObject( user );
			
		} else if ( response === true ) {
		
			/*
			 * Create an Account for the user
			 */
			var user = ds[ config._DATACLASS_USER ].createEntity(); 
			
			user.UID	= generateUUID();
			user.email	= login;
			
			user.save( );
			
			return getSessionObject( user );			 
		
		} else {
		
			return { error: 1024, errorMessage:"Empty passwords are not allowed." };
		
		};
	
	};

};

function verifySession( login ) {

	if ( sessionStorage[ config._SESSION.EMAIL ] === login ) {
	
		return true;
	
	} else {
	
		return false;
	
	};

};

function getSessionObject( user , groups ) {
	
	var connectTime = new Date();
	
	return {
        ID: user.UID, 
        name: user.name || 'NAN', 
        fullName: user.fullName || user.email, 
        belongsTo: groups || [],
        storage:{
            time: connectTime
        }
    };

};