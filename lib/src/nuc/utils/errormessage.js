/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['nuc/lib/underscore', 'nuc/lib/backbone', 'nuc/utils/log', 'i18n!nuc/utils/impl/nls/lang'], function (
  _,
  Backbone,
  log,
  lang
) {
  'use strict';

  // MessageType
  // -----------

  var Type = {
    Confirm: 0,
    Error: 1,
    Warning: 2,
    Hint: 3,
    Info: 4
  };

  // Message
  // -------

  var Message = Backbone.Model.extend({
    constructor: function Message(attributes) {
      //debugger;
      Backbone.Model.prototype.constructor.apply(this, arguments);
      if (attributes instanceof Error) {
        this.attributes.message = attributes.message;
        this.attributes.name = attributes.name;
      }
    },

    defaults: {
      type: Type.Error,
      name: '',
      message: lang.ErrorUnknown
    },

    getType: function () {
      return this.get('type');
    },

    getName: function () {
      return this.get('name');
    },

    getMessage: function () {
      return this.get('message');
    }
  });

  // ErrorMessage
  // ------------

  var ErrorMessage = Message.extend({
    constructor: function ErrorMessage(_attributes) {
      Message.Message.prototype.constructor.apply(this, arguments);
    },

    defaults: {
      type: Type.Error,
      message: lang.ErrorUnknown
    }
  });

  // RequestErrorMessage
  //--------------------

  var RequestErrorMessage = ErrorMessage.extend({
    defaults: {
      statusCode: undefined,
      statusText: undefined,
      errorDetails: undefined
    },

    constructor: function RequestErrorMessage(error) {
      Message.ErrorMessage.prototype.constructor.apply(this, arguments);
      if (error) {
        if (error.status != null) {
          // Allow passing in a jQuery request object for convenience.
          this.statusCode = error.status;
          this.statusText = error.statusText;
          if (error.responseText) {
            try {
              error.responseJSON = JSON.parse(error.responseText);
            } catch (failure) {
              log.warn('Parsing error response failed: {0}.', failure) && console.warn(log.last);
            }
          }
          if (error.responseJSON) {
            var data = error.responseJSON;
            this.message = data && data.error;
            if (!this.message) {
              this.message = error.responseText;
            }
            this.errorDetails = data && data.errorDetail;
          }
          if (!this.message) {
            if (this.statusCode === 0) {
              this.message = lang.NetworkError;
            } else {
              this.message = lang.InvalidResponse;
            }
          }
          if (error.settings && error.settings.url) {
            this.method = error.settings.type;
            this.url = error.settings.url;
          }
        } else if (typeof error.error === 'object') {
          // Allow passing in a data object with error description for convenience.
          this.message = error.error;
          this.errorDetails = error.errorDetail;
        } else if (error instanceof Backbone.Model) {
          // Allow passing an Model for convenience, but this is filled with Error data. weird.
          this.message = error.message || error.get('error');
          this.errorDetails =
            error.errorDetails || error.errorDetail || error.get('errorDetails') || error.get('errorDetail');
        } else if (error instanceof Error) {
          // Allow passing an Error instance for convenience.
          this.message = error.message;
        } else {
          // Expect the attributes of this error object passed in.
          _.extend(this, error);
        }
      }
    }
  });

  RequestErrorMessage.prototype.toString = function () {
    var punctuation = /[.!?:;,]$/;
    var trim = /\s+$/;
    var message = '';
    if (this.message) {
      message = this.message;
      message.replace(trim, '');
      if (!message.match(punctuation)) {
        message += '.';
      }
    }
    if (this.errorDetails) {
      if (message) {
        message += '\r\n';
      }
      message += this.errorDetails;
      message.replace(trim, '');
      if (!message.match(punctuation)) {
        message += '.';
      }
    }
    if (!message) {
      if (this.statusText) {
        if (message) {
          message += '\r\n';
        }
        message += this.statusText;
      }
      if (this.statusCode > 0) {
        if (message) {
          message += '\r\n ';
        }
        message += '(' + this.statusCode + ')';
      }
    }
    if (!message) {
      message = lang.ErrorUnknown;
    }
    return message;
  };

  RequestErrorMessage.version = '1.0';

  // Exports
  // -------

  Message = {
    verion: '1.0',
    Type: Type,
    Message: Message,
    ErrorMessage: ErrorMessage,
    RequestErrorMessage: RequestErrorMessage
  };

  return Message;
});
