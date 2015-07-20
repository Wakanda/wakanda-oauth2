# wakanda-oauth2

Extensible oauth2 Client For Wakanda Server supporting Dropbox, Facebook, Github, Google and Live Connect.  

##How To

1- Declare `Modules/oauth2/index.js` as a Wakanda Service

2- Add the following code to your solution's `required.js`

```javascript
function oauth2LoginListener( login, password ) {
	var response = require( 'oauth2' ).login( login, password );
	return response;
}
```
3- Configure your providers

`Modules/oauth2-provider-facebook/client.json`

`Modules/oauth2-provider-google/client.json`

4- Configure your login process 

`Modules/oauth2/config.json`

`_DATACLASS_USER` : DataClass where to save your users ( should contain at least two string fields : `email` and `UID` )

`redirect` : redirects to when the login is successful

5- Add login links to your App

```
/oauth2login?provider={{providerName}}
```
```
/oauth2login?provider={{providerName}}&scope={{providerScope}}
```
####Warning
- `require( 'oauth2' ).login` will become your solution's loginlistener.
- Users with empty passwords will not be able to login after the service activation.

##Create a new provider module

1- Create a Module : oauth2-provider-{{providerName}}

2- Which exposes two methods :
- `exchangeCodeForToken()`
- `getRedirectURL()`

Both methods return exception errors or a success value. An exception is a JSON object with a `name` and `description` properties.

##TODO
- Add auto discovery component using configuration URL (ex : https://accounts.google.com/.well-known/openid-configuration)
- Declare dependencies in a packages.json file
- Use the Wakanda Crypto library

##Feature Request / Bug Report
Please open an issue for any bugs or feature requests.
