/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(function () {
  'use strict';

  // Makes an Error of an error response from the server
  function ResponseError(response) {
    Error.prototype.constructor.call(this);
    this.message = response.error;
    this.details = response.errorDetail;
  }

  ResponseError.prototype = Object.create(Error.prototype);
  ResponseError.prototype.constructor = ResponseError;
  ResponseError.prototype.name = 'ResponseError';

  // Makes an Error of a failing request to the server
  function RequestError(request) {
    Error.prototype.constructor.call(this);
    var responseJSON = request.responseJSON || {},
      settings = request.settings;
    this.statusCode = request.status;
    this.statusText = request.statusText;
    this.message = responseJSON.error || request.responseText;
    this.details = responseJSON.errorDetail;
    if (settings) {
      this.method = settings.type;
      this.url = settings.url;
    }
  }

  RequestError.prototype = Object.create(Error.prototype);
  RequestError.constructor = RequestError;
  RequestError.prototype.name = 'ServerError';

  return RequestError;
});
