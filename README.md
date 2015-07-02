# wakanda-openid-connect
Extensible OpenID Connect Client For Wakanda Server supporting Google and Facebook 

##How To

1- Declare `Modules/OpenID/index.js` as a Wakanda Service

2- Add the following code to your solution's `required.js`

```javascript
function OpenIDLoginListener( login , password ) {

      var response      = require( 'OpenID' ).login( login , password );
      
      return response;
      
};
```

3- Configure your providers

`Modules/OpenID-provider-facebook/client.json`

`Modules/OpenID-provider-google/client.json`

4- Configure your login process 

`Modules/OpenID/config.json`

- `_DATACLASS_USER` : DataClass where to save your users ( should contain at least two string fields : `email` and `UID` ).
- `redirect` : redirects to when the login is successful

**Don't forget to make your users DataClass unavailable in the client side, at least by making it `Public On Server`**

5- Add login links to your App

```
/OpenIDLogin?provider={{providerName}}
```


####Warning
- `require( 'OpenID' ).login` will become your solution's loginlistener.
- Users with empty passwords will not be able to login after the service activation.

##Create a new provider module

Module : OpenID-provider-{{providerName}}

Expose two methods :

- `exchangeCodeForToken`

- `getRedirectURL`

Les deux méthodes remontent des exceptions en cas d’erreurs et un retour valide uniquement en cas de réussite.
Une exception est un objet JSON avec deux champs : name et description

##TODO
- Add auto discovery component using configuration URL, ex : https://accounts.google.com/.well-known/openid-configuration
- Declare dependencies in a packages.json file
- See if it is possible to use the Wakanda Crypto library

##Feature Request / Bug Report
Please open an issue for any bugs or feature request or contact me directly at `hamzahik@gmail.com`

