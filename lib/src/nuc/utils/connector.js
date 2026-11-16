/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'require',
  'module',
  'nuc/lib/jquery',
  'nuc/lib/underscore',
  'nuc/lib/backbone',
  'nuc/utils/log',
  'nuc/utils/messagehelper',
  'nuc/utils/errormessage',
  'nuc/utils/url',
  'i18n',
  'i18n!nuc/utils/impl/nls/lang',
  'nuc/utils/authenticators/authenticators',
  'nuc/models/mixins/uploadable/uploadable.mixin',
  'nuc/lib/jquery.ajax-progress'
], function (
  require,
  module,
  $,
  _,
  Backbone,
  log,
  MessageHelper,
  Message,
  Url,
  i18n,
  lang,
  authenticators,
  UploadableMixin
) {
  'use strict';

  var config = _.extend(
    {
      connectionTimeout: undefined
    },
    module.config()
  );

  var pageUnloading = false;
  $(window).on('beforeunload.' + module.id, function (_event) {
    pageUnloading = true;
  });

  function Connector(options) {
    this.connection = options.connection;
    this.authenticator = options.authenticator;
    if (!this.authenticator) {
      var Authenticator = authenticators.findByConnection(this.connection);
      if (!Authenticator) {
        throw new Error('No authenticator found. Load csui-extensions.json to enable built-in authenticators.');
      }
      this.authenticator = new Authenticator();
    }
    // The connection is owned by the connector but the authenticator
    // may be created by the client independently on the connector
    // and passed in. The connection must come from the connector.
    this.authenticator.connection = this.connection;
    this.authenticator.connectionTimeout = this.connectionTimeout;
    this.authenticationPending = false;
    this.waitingRequests = [];
    this.restartRequests = [];
  }

  function assignTo(model) {
    // Allow multiple calls when connectable is mixed
    // with node.connectable, for example
    if (model.connector) {
      if (model.connector === this) {
        return;
      }
      // The sync() method cannot be overridden twice
      throw new Error('Impossible to re-assign connector.');
    }
    model.connector = this;
    return overrideBackboneSync.call(this, model);
  }

  function overrideBackboneSync(model) {
    var self = this;
    var originalSync = model.sync;

    model.sync = function (method, model, options) {
      function executeSync() {
        // If we caught unload event earlier and now a new request is going
        // to be executed, let's assume, that page unloading was cancelled
        pageUnloading = false;

        var restartRequest = {
          execute: originalSync,
          thisObj: model
        };
        self.extendAjaxOptions(options, restartRequest);
        // options now has extra data set by extendAjaxOptions, clone it to use for restart request
        // because $.ajax call will add more attributes that options cannot be reused later.
        var originalOptions = _.clone(options);
        _.extend(restartRequest, {
          options: originalOptions,
          deferred: options.deferred,
          executeOptionsArray: [method, model, _.extend(originalOptions, { restartRequest: true })]
        });

        // The options for the $.ajax() serve as the carrier of the
        // deferred object; jQuery AJAX callbacks are on a lower level
        // and  do not have access to the Backbone model.
        var deferred = options.deferred;
        var jqxhr = originalSync
          .call(model, method, model, options)
          .progress(deferred.notify)
          .done(deferred.resolve)
          .fail(function (request, message, statusText) {
            // Let the promise akceptors wait forever on page unload
            if (!pageUnloading && request.status !== 401) {
              deferred.reject(request, message, statusText);
            }
          });
        return addAbort(deferred.promise(), jqxhr);
      }

      return executeOrScheduleRequest.call(self, executeSync);
    };

    return this;
  }

  function getConnectionUrl() {
    return new Url(this.connection.url);
  }

  function addAbort(promise, jqxhr) {
    // extend the locally created promise with an additional abort method
    // not to break the Backbone.sync contract - it returns the jqxhr
    // object, which includes not only the promise methods, but also AJAX
    // call controlling methods like abort
    promise.abort = function () {
      // If noabort method exists, the model either does not support it
      // or the request was aborted while still in the waiting queue
      if (jqxhr.abort) {
        jqxhr.abort();
      }
      return this;
    };
    return promise;
  }

  function executeOrScheduleRequest(executeCall) {
    if (this.authenticator.isAuthenticated()) {
      return executeCall();
    }

    var executor = {
      execute: executeCall,
      deferred: $.Deferred()
    };
    this.waitingRequests.push(executor);

    var self = this;
    authenticate.call(
      this,
      function success() {
        executeWaitingRequests.call(self);
      },
      function fail(error) {
        cancelWaitingRequests.call(self, error);
        reportError(error);
      }
    );

    return executor.deferred.promise();
  }

  function extendAjaxOptions(options, restartRequest) {
    options.headers || (options.headers = {});
    _.extend(options.headers, this.connection.headers);
    var acceptLanguage = i18n.settings.acceptLanguage;
    if (acceptLanguage != null) {
      options.headers['Accept-Language'] = acceptLanguage;
    }
    this.authenticator.setAuthenticationHeaders(options.headers);
    options.timeout = this.connectionTimeout;
    // jQuery doesn't notify the promises about the data transfer
    // progress; we do it by our progress event handler below and
    // just relay the other promise events as they come.
    options.deferred = $.Deferred();

    var self = this;
    var originalOptions;

    var beforeSend = options.beforeSend;
    options.beforeSend = function (request, settings) {
      // Progress event handler doesn't have access to the the jQuery AJAX
      // object; let's use the options in this scope as its carrier.
      options.request = request;
      request.settings = settings;
      if (self.reportSending) {
        self.reportSending(request, settings);
      }
      if (beforeSend) {
        beforeSend(request, settings);
      }
      // There's no progress event at the very start of uploading; it may be
      // useful to be notified about it though.  jQuery promises have no
      // start event; just notify and done, that's why we send one extra
      // notification with non-computable length to notify about the very
      // start.
      options.progress({
        lengthComputable: false,
        beforeSend: true
      });
    };

    var progress = options.progress;
    options.progress = function (event) {
      if (self.reportProgress) {
        self.reportProgress(event, options.request);
      }
      if (progress) {
        progress(event);
      }
      // jQuery doesn't notify the promises about the data transfer progress.
      options.deferred.notify(event, options.request);
    };

    var success = options.success;
    options.success = function (data, result, request) {
      self.authenticator.updateAuthenticatedSession(request);
      self._succeeded = true;
      if (self.reportSuccess) {
        self.reportSuccess(request);
      }

      if (success) {
        success(data, result, request);
      }
    };

    var error = options.error;
    options.error = function (request, message, statusText) {
      // Do not report any errors when the page is unloading; aborted AJAX
      // calls are expected to fail silently
      if (pageUnloading) {
        return;
      }

      function reportError() {
        // Ensure a readable message, when the posted object is obsolete.
        if (request.status == 409) {
          setConflictMessage(request);
        }
        if (self.reportError) {
          self.reportError(request);
        }
        if (error) {
          error(request, message, statusText);
        }
      }

      function sessionExpired() {
        if (!self.confirmingReload) {
          self.confirmingReload = true;
          var failure = new Message.RequestErrorMessage(request),
            dialogTitle = self._succeeded ? lang.SessionExpiredDialogTitle : lang.AuthenticationFailureDialogTitle;
          log.warn(failure) && console.warn(log.last);
          require(['csui/dialogs/modal.alert/modal.alert'], function (alertDialog) {
            alertDialog
              .showWarning(lang.AuthenticationFailureDialogText, dialogTitle, {
                buttons: alertDialog.buttons.Ok
              })
              .always(function () {
                self.authenticator.unauthenticate({ reason: 'failed' });
              });
          });
        }
      }

      if (request.status == 401) {
        // Only restart requests from codes that have been ported.
        if (restartRequest || options.restartDeferred) {
          var requestObj = restartRequest || {
            options: originalOptions,
            deferred: options.restartDeferred || options.deferred,
            execute: $.ajax,
            thisObj: undefined,
            executeOptionsArray: [_.extend(originalOptions, { restartRequest: true })]
          };
          self.restartRequests.push(requestObj);
          if (!self.reauthenticatingInitiated) {
            self.reauthenticatingInitiated = true;
            // In case of OTDS SSO, automatically reauthenticate and restart the request again.
            self.authenticator.unauthenticate({ reason: 'expired' }); // clear expired session
            self.authenticator.authenticate(
              function () {
                // success
                self.reauthenticatingInitiated = false;
                executeRestartRequests.call(self);
              },
              function (_error) {
                // failure
                self.restartRequests = [];
                sessionExpired();
              }
            );
          }
        } else {
          // Non-ported raw $.ajax call will still get the session expired error as before.
          sessionExpired();
        }
      } else {
        reportError();
      }
    };

    // options now has extra data set by extendAjaxOptions, clone it to use for restart request
    // because $.ajax call will add more attributes that options cannot be reused later.
    originalOptions = _.clone(options);
    return options;
  }

  function formatAjaxData(data) {
    data = JSON.stringify(data);
    return UploadableMixin.useJSON || UploadableMixin.mock ? data : { body: data };
  }

  function getAjaxContentType() {
    return UploadableMixin.useJSON || UploadableMixin.mock ? 'application/json' : 'application/x-www-form-urlencoded';
  }

  function makeAjaxCall(options) {
    var method = options.method || options.type || 'GET';
    var data = options.data;
    var self = this;

    if (data) {
      if (method === 'GET') {
        // Normalize the request, so that the parameters are always in
        // the URL query, to make the request mockable by mockjax.
        if (typeof data !== 'string') {
          data = $.param(data, true);
        }
        var url = options.url || location.href;
        url += url.indexOf('?') >= 0 ? '&' : '?';
        url += data;
        options.url = url;
        delete options.data;
      } else {
        var contentType = options.contentType;
        if (data instanceof FormData) {
          // Unless specified by the caller, let $.ajax use "multipart/form-data"
          // with a computed boundary string by setting `false` here.
          if (contentType === undefined) {
            options.contentType = false;
          }
          options.processData = false;
        } else if (data instanceof Uint8Array || data instanceof ArrayBuffer || data instanceof Blob) {
          // The caller has to specify the content type and take care of CS quirks.
          options.processData = false;
        } else {
          // Unless serialized to string by the caller, wither serialize
          // to application/json or application/x-www-form-urlencoded,
          // depending on the server capabilities
          if (typeof data !== 'string') {
            options.data = formatAjaxData(data);
          }
          if (contentType === undefined) {
            // Note: 'false' is a valid value, don't change it
            options.contentType = getAjaxContentType();
          }
        }
      }
    }

    function executeCall() {
      options = self.extendAjaxOptions(options);

      var deferred = $.Deferred();
      _.extend(options, { restartDeferred: deferred });
      var jqxhr = $.ajax(options)
        .progress(deferred.notify)
        .done(deferred.resolve)
        .fail(function (request, message, statusText) {
          if (request.status !== 401) {
            // Let the promise acceptors wait forever on page unload.
            if (!pageUnloading) {
              deferred.reject(request, message, statusText);
            }
          }
        });
      return addAbort(deferred.promise(), jqxhr);
    }

    return executeOrScheduleRequest.call(this, executeCall);
  }

  function executeRestartRequests() {
    var self = this;
    var executors = this.restartRequests.slice(0);
    this.restartRequests = [];
    _.each(executors, function (executor) {
      self.authenticator.setAuthenticationHeaders(executor.options.headers);
      executor.execute
        .apply(executor.thisObj, executor.executeOptionsArray)
        .progress(executor.deferred.notify)
        .done(executor.deferred.resolve)
        .fail(function (request, message, statusText) {
          // Let the promise acceptors wait forever on page unload.
          if (!pageUnloading) {
            executor.deferred.reject(request, message, statusText);
          }
        });
    });
  }

  function executeWaitingRequests() {
    var executors = this.waitingRequests.slice(0);
    this.waitingRequests = [];
    _.each(executors, function (executor) {
      executor
        .execute()
        .progress(executor.deferred.notify)
        .done(executor.deferred.resolve)
        .fail(function (request, message, statusText) {
          // Let the promise acceptors wait forever on page unload.
          if (!pageUnloading) {
            executor.deferred.reject(request, message, statusText);
          }
        });
    });
  }

  function cancelWaitingRequests(error) {
    var executors = this.waitingRequests.slice(0);
    this.waitingRequests = [];
    _.each(executors, function (executor) {
      executor.deferred.reject(error);
    });
  }

  function authenticate(success, failure) {
    if (!this.authenticationPending) {
      this.authenticationPending = true;
      var self = this;
      this.authenticator.authenticate(
        function () {
          self.authenticationPending = false;
          success();
        },
        function (error) {
          self.authenticationPending = false;
          failure(error);
        }
      );
    }
  }

  function reportSending(request, settings) {
    if (request && settings) {
      log.debug('Sending request as {0} to {1}.', settings.type, settings.url) && console.log(log.last);
    }
  }

  function reportProgress(event, request) {
    var progress = event.lengthComputable
      ? _.str.sformat('{0} from {1} bytes transferred', event.loaded, event.total)
      : event.beforeSend
      ? 'connection opened'
      : 'no information';
    log.debug('Progress of {0} from {1}: {2}.', request.settings.type, request.settings.url, progress) &&
      console.log(log.last);
  }

  function reportSuccess(request) {
    if (request && request.settings) {
      log.debug('Receiving response for {0} from {1}.', request.settings.type, request.settings.url) &&
        console.log(log.last);
    }
  }

  function reportError(request, error) {
    if (!error) {
      if (request instanceof Error) {
        error = request;
        request = undefined;
      } else {
        error = new Message.RequestErrorMessage(request);
      }
    }
    if (request && request.settings) {
      log.warn('{0} request to {1} failed:', request.settings.type, request.settings.url) && console.warn(log.last);
    }
    log.warn(error) && console.warn(log.last);
    MessageHelper.getInstance().addMessage(error.toString());
  }

  function setConflictMessage(request) {
    if (request.responseText) {
      try {
        request.responseJSON = JSON.parse(request.responseText);
      } catch (failure) {
        log.warn('Parsing error response failed: {0}.', failure) && console.warn(log.last);
      }
    }
    if (request.responseJSON) {
      var data = request.responseJSON;
      data.error = lang.resourceConflict;
      request.responseText = JSON.stringify(data);
    }
  }

  _.extend(Connector.prototype, Backbone.Events, {
    constructor: Connector,
    // Makes a Backbone model working with the REST API connector.
    assignTo: assignTo,
    // Returns a URL object with convenience methods like getApiBase,
    // which wraps the connection.url
    getConnectionUrl: getConnectionUrl,
    // Prepares options for the Backbone fetch method to work
    // with the REST API connector. It can be used for custom models.
    extendAjaxOptions: extendAjaxOptions,
    // Deprecated and to be removed.
    extendFetchOptions: extendAjaxOptions,
    // Preprocess the data property in $.ajax options, so that CS
    // can accept JSON in POST and PUT requests
    formatAjaxData: formatAjaxData,
    // Returns the correct content type for $.ajax options, so that CS
    // can accept JSON in POST and PUT requests
    getAjaxContentType: getAjaxContentType,
    // Shortens making an ajax call by applying extendAjaxOptions,
    // formatAjaxData and getAjaxContentType together and callig $.ajax.
    makeAjaxCall: makeAjaxCall,
    // Overriddables to extend or replace logging and/or error reporting.
    reportSending: reportSending,
    reportProgress: reportProgress,
    reportSuccess: reportSuccess,
    reportError: reportError,
    // Other utility methods and properties.
    connectionTimeout: config.connectionTimeout,
    // authentication
    authenticate: authenticate
  });

  return Connector;
});
