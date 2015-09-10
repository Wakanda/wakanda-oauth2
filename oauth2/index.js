/*
 * TODO
 *  - Add auto discovery component using configuration URL, ex : https://accounts.google.com/.well-known/openid-configuration
 *  - Declare dependencies in a packages.json file
 *  - See if it is possible to use the Wakanda Crypto library
 */


/*
 * Handler for service messages
 */

exports.postMessage = function(message) {
	
	var moduleFolderPath	= File(module.filename).parent.path;
	var handlersFilePath	= moduleFolderPath + 'handlers.js';

    if (message.name === "httpServerWillStop") {
    	
        removeHttpRequestHandler('^/oauth2login', handlersFilePath, 'init');
		removeHttpRequestHandler('^/oauth2callback', handlersFilePath, 'callback');
		
    } else if (message.name === "httpServerDidStart") {
        
        directory.setLoginListener( 'oauth2LoginListener' , 'Admin' );
        
        addHttpRequestHandler('^/oauth2login', handlersFilePath, 'init');
		addHttpRequestHandler('^/oauth2callback', handlersFilePath, 'callback');
        
    }

};

