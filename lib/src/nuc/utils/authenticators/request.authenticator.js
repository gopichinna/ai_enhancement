/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'require',
  'module',
  'nuc/lib/jquery',
  'nuc/lib/underscore',
  'nuc/utils/errormessage',
  'nuc/utils/url',
  'nuc/utils/log',
  'nuc/models/mixins/uploadable/uploadable.mixin',
  'nuc/utils/authenticators/ticket.authenticator',
  'nuc/lib/jquery.parse.param'
], function (require, module, $, _, Message, Url, log, UploadableMixin, TicketAuthenticator) {
  'use strict';

  const config = _.extend(
    {
      connectionTimeout: 60 * 1000
    },
    require.moduleConfig('nuc/utils/requestauthenticator'),
    module.config()
  );

  // Performs authentication using an initial request, which is supposed to
  // obtain the OTCSTicket.  Descendants decide what request and how to
  // process its response.
  var RequestAuthenticator = TicketAuthenticator.extend({
    constructor: function RequestAuthenticator(options) {
      TicketAuthenticator.prototype.constructor.call(this, options);
    },

    prepareRequest: function (options) {
      return options;
    },

    parseResponse: function (response, _request) {
      return response;
    },

    login: function (options, succeeded, failed) {
      delete this.connection.session;
      log.debug('Sending authentication request to {0}.', this.connection.url) && console.log(log.last);
      options = _.extend({}, { type: 'POST', contentType: 'application/json' }, options);
      var settings = this.prepareRequest(options);
      this.updateRequestBody(settings);
      return this.makeRequest(settings, succeeded, failed);
    },

    // The makeAjaxCall function is required to perform a signOut (secureRequestToken)
    // or for continue session. It is used by expiration warning handling.
    makeAjaxCall: function (options) {
      var headers = _.extend({}, this.connection.headers, options.headers);
      return $.ajax(
        _.extend(
          {
            url: options.url,

            timeout: this.connectionTimeout,
            context: this,

            beforeSend: function (request, settings) {
              request.settings = settings;
            },

            success: function (response, _textStatus, request) {
              log.debug('Receiving request response from {0}.', options.url) && console.log(log.last);
              response = this.parseResponse(response, request);
              if (options.success) {
                options.success.call(this, this.connection);
              }
            },

            error: function (request) {
              var error = new Message.RequestErrorMessage(request);
              log.warn('Logging in to {0} failed:\r\n{1}', this.connection.url, error) && console.warn(log.last);
              if (options.error) {
                options.error.call(this, error, this.connection);
              }
            }
          },
          options,
          {
            headers: headers
          }
        )
      );
    },

    makeRequest: function (options, succeeded, failed) {
      function authsuccess(response, _textStatus, request) {
        log.debug('Receiving authentication response from {0}.', this.connection.url) && console.log(log.last);
        response = this.parseResponse(response, request);
        if (this.authenticateSession(response, request)) {
          if (succeeded) {
            succeeded.call(this, this.connection);
          }
          this.trigger('loggedIn', {
            sender: this,
            connection: this.connection
          });
        }
      }

      function autherror(request) {
        var error = new Message.RequestErrorMessage(request);
        log.warn('Logging in to {0} failed:\r\n{1}', this.connection.url, error) && console.warn(log.last);
        if (failed) {
          failed.call(this, error, this.connection);
        }
      }

      var callOptions = _.extend(
        {
          url: Url.combine(this.connection.url, 'auth'),
          success: authsuccess,
          error: autherror
        },
        options
      );

      return this.makeAjaxCall(callOptions);
    },

    updateRequestBody: function (settings) {
      var data;
      if (UploadableMixin.useJSON || UploadableMixin.mock) {
        if (settings.contentType !== 'application/json') {
          settings.contentType = 'application/json';
          data = settings.data;
          if (typeof data === 'string') {
            data = $.parseParam(data);
          }
          if (UploadableMixin.mock) {
            settings.data = data;
          } else {
            settings.data = JSON.stringify(data);
          }
          settings.processData = false;
        }
      } else {
        if (settings.contentType === 'application/json') {
          settings.contentType = 'application/x-www-form-urlencoded';
          data = settings.data;
          if (typeof data === 'string') {
            settings.data = JSON.parse(data);
          }
          if (UploadableMixin.mock) {
            settings.data = data;
          }
          settings.processData = true;
        }
      }
    },

    authenticateSession: function (response, request) {
      if (response && response.ticket) {
        if (request && request.settings && request.settings.data) {
          log.info('Logging in to {0} as {1} succeeded.', this.connection.url, request.settings.data.username) &&
            console.log(log.last);
        }
        this.updateAuthenticatedSession(response, request);
        return true;
      }
      return true;
    },

    unauthenticate: function (options) {
      var first = this.isAuthenticated();
      TicketAuthenticator.prototype.unauthenticate.apply(this, arguments);
      if (first) {
        this.trigger('loggedOut', {
          sender: this,
          connection: this.connection,
          reason: options && options.reason
        });
      }
      return this;
    },

    connectionTimeout: config.connectionTimeout
  });

  return RequestAuthenticator;
});
