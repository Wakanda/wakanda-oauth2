
/**
 * Where do you want to redirect the user if the oauth2 authentication succeed ?
 */
exports.redirectOnSuccess = "/app/index.html";


/**
 * Where do you want to redirect the user if the oauth2 authentication failed ?
 */
exports.redirectOnFailure = "/app/index.html";


/**
 * Use sessionStorage to save the user session info
 * Session life time
 */
var _SESSION = {
		"EMAIL"			: "OAUTH2_EMAIL",
		"CSRF"			: "OAUTH2_CSRF",
		"TOKEN"			: "OAUTH2_TOKEN",
		"REFRESH_TOKEN"	: "OAUTH2_REFRESH_TOKEN"
	};


/**
 * Use database to permanently save the user session info
 * Database entity life time
 */
var _DATACLASS_USER = "OAUTH2_USER";


/**
 * How do you want to store the user oauth2 session info (ID, mail, token, refresh_token) ?
 * 
 * @param {string} provider - The provider which authentified the user and provides a session
 * @param {Object} userInfo - The user information returned by the provider
 * @param {Object} userInfo.email - The user email returned by the provider
 * @param {Object} userInfo.token - The access_token returned by the provider. (Use setAccessToken() to save it)
 * @param {Object} [userInfo.refresh_token] - [optionnal] The refresh_token returned by the provider. This token is not sent every time. (Use setRefreshToken() to save it)
 */
exports.setSession = function( provider, userInfo )
{
	//Check if user is already registered
// TODO user currentUser().ID instead ?
	var user = ds[ _DATACLASS_USER ]( { 'email': userInfo.email, 'provider': provider } );
	
	//Create an user Account if first login
	if ( ! user )
	{
		user			= ds[ _DATACLASS_USER ].createEntity();
		user.UID		= currentUser().ID ? currentUser().ID : generateUUID();
		user.provider	= provider;
		user.email		= userInfo.email;
		user.save( );
	}
	
	//Create a wakanda user session
	if ( require( 'oauth2-provider-' + provider ).doAuthentication() )
	{
		createUserSession({
			ID: user.UID, 
			name: user.email,
			belongsTo: [],
			storage: {
				time: new Date()
			}
		});
	}
}


/**
 * Where do you want to save the refresh_token ?
 * The refresh_token is used to get a new access_token when it becomes invalid ( session expiration or deconnexion )
 * 
 * @param {string} provider - The provider which authentified the user and provides a session
 * @param {string} [refresh_token] - [optionnal] The refresh_token returned by the provider. This token is not sent every time.
 */
exports.setRefreshToken = function( provider, refresh_token )
{
	if ( ! refresh_token )
		return; // refresh_token is not sent every time.
	
	// Save refresh_token in the sessionStorage for later use
	sessionStorage[ provider +'_'+ _SESSION.REFRESH_TOKEN ]	= refresh_token;

	// Save refresh_token in DB to survive a server shutdown
	var user = ds[ _DATACLASS_USER ]( { 'UID': currentUser().ID } );
	if (user)
		user.refresh_token = refresh_token;
		user.save( );
}


/**
 * How do you want to retrieve the refresh_token ?
 * 
 * @param {string} provider - The provider which authentified the user and provides a session
 */
exports.getRefreshToken = function( provider )
{
	// Get refresh_token
	var refresh_token = sessionStorage[ provider +'_'+ _SESSION.REFRESH_TOKEN ];
	
	// If nothing in the sessionStorage, then fallback in the database
	if ( ! refresh_token ){
		var user = ds[ _DATACLASS_USER ]( { 'UID': currentUser().ID } );
		if (user)
			refresh_token = user.refresh_token;	
	}
	
	// Error no refresh_token known
	if ( ! refresh_token )
		throw {
			error				: "no_refresh_token",
			error_description	: "Don't find any refresh_token to use"
		};
		
	return refresh_token;
}


/**
 * Where do you want to save the access_token ?
 * The access_token is used to authenticate the user when communicated with servers through REST apis
 * 
 * @param {string} provider - The provider which authentified the user and provides a session
 * @param {string} access_token - The access_token returned by the provider
 */
exports.setAccessToken = function( provider, access_token )
{
	if ( ! access_token )
		throw {
			error				: "no_access_token",
			error_description	: "Don't received any access_token to save"
		};
	
	// Save access_token in sessionStorage for later use.
	sessionStorage[ provider +'_'+ _SESSION.TOKEN ] = access_token;
}