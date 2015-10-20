/**
 * Create an url with base URL and params
 * 
 * @param {string} baseUrl - base url of the application
 * @param {Object} params - convert key:value to key=value
 * 
 * @return {string} url - the final url with given params
 */
function getEndpointFromParams( baseUrl , params )
{
	var urlParams = formBodyFromJSON(params);
	var url = baseUrl + '?' + urlParams;    
	return url;
}

/**
 * Stringify params for body XHR
 * 
 * @param {Object} params - convert key:value to key=value
 * 
 * @return {string} body - the stringify params to append inside a body XHR
 */
function formBodyFromJSON( params )
{
	var body = "";
	for ( var key in params )
	{
		body += key + '=' + encodeURIComponent( params[ key ] ) + '&'
	}
	return body;
}

/**
 * 
 */
function parseQueryString(queryString)
{
	var qd = {};
	queryString.split("&").forEach(function(item) {
		var k = item.split("=")[0];
		var v = decodeURIComponent(item.split("=")[1]);
		(k in qd) ? qd[k].push(v) : qd[k] = [v,]}
	);
	return qd;
}

/**
 * 
 */
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

exports.formBodyFromJSON = formBodyFromJSON;
exports.getEndpointFromParams = getEndpointFromParams;
exports.parseQueryString = parseQueryString;
exports.getUrlVarsToJson = getUrlVarsToJson;
