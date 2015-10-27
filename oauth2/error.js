var config	= require( './config' );

/**
 * Convert a provider/internal server error into a user driven error
 */
var errorList	= {
	// oauth2 handled errors
	'access_denied': {
		'code'			: 'authorisation_rejected_by_user',
		'description'	: 'The user has rejected the authorisation for Wakanda to access the provider.'
	},
	'invalid_token': {
		'code'			: 'token_expired',
		'description'	: 'The access token expired.'
	},
	
	// internal errors
	'invalid_CSRF': {
		'code'			: 'internal_oauth2_server_error',
		'description'	: 'The CSRF is either missing or does not match with the one in session storage.'
	},
	'missing_state': {
		'code'			: 'internal_oauth2_server_error',
		'description'	: 'The state param is missing.'
	},
	'missing_user_email': {
		'code'			: 'internal_oauth2_server_error',
		'description'	: 'The user email was not retrieve from the provider. This is mandatory for a Wakanda authentification.'
	},
	'unreachable_url': {
		'code'			: 'internal_oauth2_server_error',
		'description'	: 'This url is not reachable. The provider may be down or the url incorrect.'
	},
	'unknown_error': {
		'code'			: 'internal_oauth2_server_error',
		'description'	: 'No clue why it failed. Could it be a missing/wrong error code ?'
	}
};

/**
 * Update the response object to redirect on an error page with an url error parameter
 * 
 * @param {string} response - Callback response where the redirection (headers['location']) is set
 * @param {string} errorCode - Internal error code returned. "unknown_error" by default
 * @param {string} [errorDescription] - Provider error description
 * 
 * @return {string} response - The updated Callback response
 */
exports.redirectUrl = function redirectUrl(response, errorCode, errorDescription)
{
	// Init
	errorCode 			= errorCode ? errorCode : 'unknown_error';
	errorDescription 	= errorDescription ? errorDescription : '';
	
	// Log provider error
	console.error('[ERROR] oauth2 error (initial): '+ errorCode +' - '+ errorDescription);

	// Translated internal error into user error through error list
	var userError	= errorList[errorCode] ? errorList[errorCode] : errorList['unknown_error'];

	// Log translated error
	console.error('[ERROR] oauth2 error (translated): '+ userError.code +' - '+ userError.description);
	
	// Redirect url, add url param errorCode
	response.statusCode	= 307;
	response.headers['location'] = config.redirectOnFailure +'?error='+ userError.code;
	return response;	
}

