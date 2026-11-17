/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['nuc/lib/underscore', 'nuc/utils/errors/request', 'nuc/utils/errors/response'], function (
  _,
  RequestError,
  ResponseError
) {
  'use strict';

  // Module exports
  var Errors = {
    // Converts a failure source to an Error
    getError: function (source) {
      if (!source) {
        throw new Error('No error source');
      }
      // An Error instance
      if (source instanceof Error) {
        return source;
      }
      // Failed jQuery request
      if (source.status != null && source.statusText != null) {
        return new RequestError(source);
      }
      // Server response {error, errorDetails}
      if (source.error) {
        return new ResponseError(source);
      }
      // Error message
      if (_.isString(source)) {
        return new Error(source);
      }
      throw new Error('Unrecognized source');
    }
  };

  return Errors;
});
