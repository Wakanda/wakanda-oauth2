 var config		= require( './config' );
 
/**
 * Convert a provider/internale server error into a user driven error
 */
var errorList = {
	// oauth2 errors
	'access_denied': {
		'userError': 'authorisation_rejected_by_user',
		'description': 'The user has rejected the authorisation for Wakanda to access the provider.'
	},
	'invalid_request': {
		'userError': 'internal_oauth2_server_error',
		'description': 'The request is missing a required parameter, includes an invalid parameter value, includes a parameter more than once, or is otherwise malformed.'
	},
	'invalid_client': {
		'userError': 'internal_oauth2_server_error',
		'description': 'Client authentication failed (e.g., unknown client, no client authentication included, or unsupported authentication method).  The authorization server MAY return an HTTP 401 (Unauthorized) status code to indicate which HTTP authentication schemes are supported.  If the client attempted to authenticate via the "Authorization" request header field, the authorization server MUST respond with an HTTP 401 (Unauthorized) status code and include the "WWW-Authenticate" response header field matching the authentication scheme used by the client.'
	},
	'invalid_grant': {
		'userError': 'internal_oauth2_server_error',
		'description': 'The provided authorization grant (e.g., authorization code, resource owner credentials) or refresh token is invalid, expired, revoked, does not match the redirection URI used in the authorization request, or was issued to another client.'
	},
	'invalid_scope': {
		'userError': 'internal_oauth2_server_error',
		'description': 'The requested scope is invalid, unknown, malformed, or exceeds the scope granted by the resource owner.'
	},
	'invalid_token': {
		'userError': 'token_expired',
		'description': 'The access token expired.'
	},
	'server_error': {
		'userError': 'internal_oauth2_server_error',
		'description': 'The authorization server encountered an unexpected condition that prevented it from fulfilling the request. (This error code is needed because a 500 Internal Server Error HTTP status code cannot be returned to the client via an HTTP redirect.)'
	},
	'temporarily_unavailable': {
		'userError': 'internal_oauth2_server_error',
		'description': 'The user has rejected the authorisation for Wakanda to access the provider.'
	},
	'unauthorized_client': {
		'userError': 'internal_oauth2_server_error',
		'description': 'The client is not authorized to request an authorization code using this method.'
	},
	'unsupported_response_type': {
		'userError': 'internal_oauth2_server_error',
		'description': 'The authorization server does not support obtaining an authorization code using this method.'
	},
	
	// internal errors
	'invalid_CSRF': {
		'userError': 'internal_oauth2_server_error',
		'description': 'The CSRF is either missing or does not match with the one in session storage.'
	},
	'missing_state': {
		'userError': 'internal_oauth2_server_error',
		'description': 'The state param is missing.'
	},
	'missing_user_mail': {
		'userError': 'internal_oauth2_server_error',
		'description': 'The user mail is missing.'
	},
	'unreachable_provider': {
		'userError': 'unreachable_provider',
		'description': 'The provider is not reachable.'
	},
	'unknown_error': {
		'userError': 'internal_oauth2_server_error',
		'description': 'No clue why it failed.'
	}
};

/**
 * @param {string} errorCode - Internal error code returned. "unknown_error" by default
 * @param {string} errorDescription - Error description
 * 
 * @return {string} formatedError - User driven error
 */
function create(errorCode, errorDescription){
	
	var errorCode = errorCode ? errorCode : 'unknown_error';
	var errorDescription = errorDescription ? errorDescription : undefined;

	var myError = errorList[errorCode];
	console.error('oauth2 error (internal): ', errorCode, myError.description);
	if (errorDescription)
		console.error('oauth2 error (from provider): ', errorDescription);

	return myError.userError;
}

/**
 * @param {string} errorCode - Internal error code returned. "unknown_error" by default
 * @param {string} response - Callback response where the headers['location'] is set
 * 
 * @return {string} response - The updated Callback response
 */
function redirect(errorCode, response){
   	response.statusCode	= 307;
   	response.headers['location'] = config.redirectOnFailure +'?error='+ errorCode;
	return response;	
}

/**
 * @param {string} errorCode - Internal error code returned. "unknown_error" by default
 * 
 * @return {Object} error - The user driven error
 */
function getUserError(errorCode)
{
	var errorCode = errorCode ? errorCode : 'unknown_error';
	return errorList[errorCode];
}

exports.create = create;
exports.redirect = redirect;
exports.getUserError = getUserError;
