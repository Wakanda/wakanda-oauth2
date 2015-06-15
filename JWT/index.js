
/*
 * TODO
 *  - A real verify : signature, JSON errors handling
 */

if ( typeof exports == 'undefined' ) {
	
	var exports = {};
	
};

exports.verify = function ( jwt ) {
	
	var parts		= jwt.split( '.' );
	var header		= parts[ 0 ];
	var body		= parts[ 1 ];
	var signature	= parts[ 2 ];
	var response	= {};
	
	response.header		= b64ToUTF8( header );
    
    response.body		= b64ToUTF8( body );
    
    response.verified	= false;
    
    return response;
    
};

function b64ToUTF8( str ) {
	
	var padToAdd = str.length % 4;
	
	for(var i = 0 ; i < padToAdd; ++i){
	  str+="=";
	}
	
	return (new Buffer( str, 'base64' )).toString('utf8');

};