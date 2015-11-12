# wakanda-oauth2

Extensible oauth2 Client For Wakanda Server supporting Dropbox, Facebook, Github, Google and Live Connect.  

## How to install

1- Copy sources in `<project>/backend/modules/` folder

2- Declare `<project>/backend/modules/oauth2/index.js` as a Wakanda Service

3- Configure your providers

```javascript
<project>/backend/modules/oauth2-provider-facebook/client.json
<project>/backend/modules/oauth2-provider-google/client.json`
```

4- Configure your login process 

In `<project>/backend/modules/oauth2/config.js`, you can update:

 - `_DATACLASS_USER` : DataClass where to save your users ( should contain at least four string fields: `UID`, `provider`, `email` and `refresh_token )
 - `redirectOnSuccess` : redirects to when the login is successful
 -  `redirectOnFailure` : redirects to when the login failed

5- Add login links to your App

```javascript
/oauth2login?provider={{providerName}}
/oauth2login?provider={{providerName}}&scope={{providerScope}}
```

## Use of setLoginListener()

If you have a `setLoginListener()` in your solution, be aware that `currentUSer().ID` is used to authentified a user session. This ID should be static over time and always point to the same user.

## How to go deeper into oauth2 module configuration

You can manage how your oauth2 module will save the user/session info. Just update the `<project>/backend/modules/oauth2/config.js` file:

```javascript
/**
 * How do you want to store the user oauth2 session info (ID, mail, token, refresh_token) ?
 * 
 * @param {string} provider - The provider which authentified the user and provides a session
 * @param {Object} userInfo - The user information returned by the provider
 * @param {Object} userInfo.email - The user email returned by the provider
 * @param {Object} userInfo.token - The access_token returned by the provider. (Use setAccessToken() to save it)
 * @param {Object} [userInfo.refresh_token] - [optionnal] The refresh_token returned by the provider. This token is not sent every time. (Use setRefreshToken() to save it)
 */
setSession( provider, userInfo )
```
```javascript
/**
 * Where do you want to save the refresh_token ?
 * The refresh_token is used to get a new access_token when it becomes invalid ( session expiration or deconnexion )
 * 
 * @param {string} provider - The provider which authentified the user and provides a session
 * @param {string} [refresh_token] - [optionnal] The refresh_token returned by the provider. This token is not sent every time.
 */
setRefreshToken( provider, refresh_token )
```
```javascript
/**
 * How do you want to retrieve the refresh_token ?
 * 
 * @param {string} provider - The provider which authentified the user and provides a session
 */
getRefreshToken( provider )
```
```javascript
/**
 * Where do you want to save the access_token ?
 * The access_token is used to authenticate the user when communicated with servers through REST apis
 * 
 * @param {string} provider - The provider which authentified the user and provides a session
 * @param {string} access_token - The access_token returned by the provider
 */
setAccessToken( provider, access_token )
```
```javascript
/**
 * Use database to permanently save the user session info
 * Database entity life time
 * [Optionnal]
 */
_DATACLASS_USER
```
```javascript
/**
 * Use sessionStorage to save the user session info
 * Session life time
 * [Optionnal]
 */
_SESSION
```

## How to create a new provider module

1- Create a Module : oauth2-provider-{{providerName}}

2- Which exposes four methods :

```javascript
/**
 * How to get an authorisation code ?
 * Get the authorisation code through provider API
 * 
 * @param {Object} params
 * @param {string} params.CSRF - Securyty key 
 * @param {string} params.provider - Provider called
 * @param {string} params.scope - Scope asked for the user session
 * @param {string} params.access_type - access_type asked for the user session
 * @param {string} params.approval_prompt - approval_prompt asked for the user session
 * 
 * @return {redirectTo} - url where to redirect after
 */
getRedirectURL(params)
```
```javascript
/**
 * How to exchange the authorisation code for an access_token/refresh_token ? 
 * Get the access_token/refresh_token through provider API
 * 
 * @param {Object} params
 * @param {string} params.code[0] - authorisation code 
 * 
 * @return {Object} userInfo
 * @return {Object} userInfo.email - User email returned by the provider
 * @return {Object} userInfo.access_token - Used to authentified every request to the provider
 * @return {Object} [userInfo.refresh_token] - [Optionnal] refresh_token is not sent every time
 */
exchangeCodeForToken(token)
```
```javascript
/**
 * How to refresh the access_token using the refresh_token ?
 * Get the user info through provider API
 * 
 * @param {string} refresh_token - refresh_token from Google authorisation
 * @return {Object}
 */
refreshToken(refresh_token)
```
```javascript
/**
 * Do you when to authenticate the user on Wakanda when authentified by the provider ?
 *
 * @return {Boolean} authentication
 */
doAuthentication() 
```

Methods return exception errors or a success value. An exception is a JSON object with a `error` and `error_description` properties.

## Feature Request / Bug Report

Please open an issue for any bugs or feature requests.
