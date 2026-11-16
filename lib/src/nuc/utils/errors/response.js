/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
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
  ResponseError.prototype.name = 'ServerError';

  return ResponseError;
});
