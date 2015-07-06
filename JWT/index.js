/*
 * TODO
 *  - A real verify : signature, JSON errors handling
 */


if (typeof exports == 'undefined') {

    var exports = {};

};

/*
 * Workaround for the buffer base64 padding problem
 * Source : http://ntt.cc/2008/01/19/base64-encoder-decoder-with-javascript.html
 */
function decode64(input) {
	var keyStr = "ABCDEFGHIJKLMNOP" + "QRSTUVWXYZabcdef" + "ghijklmnopqrstuv" + "wxyz0123456789+/" + "=";
    var output = "";
    var chr1, chr2, chr3 = "";
    var enc1, enc2, enc3, enc4 = "";
    var i = 0;

    // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
    var base64test = /[^A-Za-z0-9\+\/\=]/g;
    if (base64test.exec(input)) {
        throw "Invalid base64 characters";
		//alert("There were invalid base64 characters in the input text.\n" + "Valid base64 characters are A-Z, a-z, 0-9, '+', '/',and '='\n" + "Expect errors in decoding.");
    }
    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

    do {
        enc1 = keyStr.indexOf(input.charAt(i++));
        enc2 = keyStr.indexOf(input.charAt(i++));
        enc3 = keyStr.indexOf(input.charAt(i++));
        enc4 = keyStr.indexOf(input.charAt(i++));

        chr1 = (enc1 << 2) | (enc2 >> 4);
        chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        chr3 = ((enc3 & 3) << 6) | enc4;

        output = output + String.fromCharCode(chr1);

        if (enc3 != 64) {
            output = output + String.fromCharCode(chr2);
        }
        if (enc4 != 64) {
            output = output + String.fromCharCode(chr3);
        }

        chr1 = chr2 = chr3 = "";
        enc1 = enc2 = enc3 = enc4 = "";

    } while (i < input.length);

    return unescape(output);
}

exports.verify = function(jwt) {

    var parts = jwt.split('.');
    var header = parts[0];
    var body = parts[1];
    var signature = parts[2];
    var response = {};

    response.header = b64ToUTF8(header);

    response.body   = b64ToUTF8(body);

    response.verified = false;

    return response;

};

function b64ToUTF8(str) {
	
	return decode64(str);

    /*	
    return (new Buffer(str, 'base64')).toString('utf8');
	*/

};