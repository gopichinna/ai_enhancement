'use strict';

function requestInterceptor(req, res, next) {
	//TODO: Customized logic to take control of certain request URLs
	next(); // Default implementation is to do nothing and hand-off to next interceptor
}

function isESM(path) {
	//Needs to return 'false' for those matching paths which points to JS source files that are neither RequireJS AMD nor EcmaScript Module.
	return true;
}

module.exports = {
	LOCAL_HTTP_PORT: 6989,
	LOCAL_HTTPS_PORT: 9698,
	APP_SERVER_URL: '', /* Example - http://10.193.50.51:8080/D2-Smartview */
	APP_SERVER_IS_PROXIED: true,
	PROXIED_APP_SERVER_ALLOWS_SELF_SIGNED_HTTPS: true, //TODO: Set to `true` while connecting to a proxied HTTPS app server configured with self-signed certificate
	requestInterceptor,
	isESM
};
