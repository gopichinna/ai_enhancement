/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'require',
  'module',
  'nuc/lib/underscore',
  'nuc/utils/authenticators/authenticator',
  'nuc/utils/namedsessionstorage',
  'nuc/utils/log'
], function (require, module, _, Authenticator, NamedSessionStorage, log) {
  'use strict';

  log = log(module.id);

  const config = _.extend(
    {
      rememberTicket: true,
      ticketHeader: 'OTCSTicket',
      ticketExpirationHeader: 'OTCSTicketExpires',
      dateHeader: 'Date'
    },
    require.moduleConfig('nuc/utils/authenticator'),
    module.config()
  );
  config.ticketHeader = config.ticketHeader.toLowerCase();
  config.ticketExpirationHeader = config.ticketExpirationHeader.toLowerCase();
  config.dateHeader = config.dateHeader.toLowerCase();

  var storage = new NamedSessionStorage(module.id);

  // Supports authentication using the explicit ticket provided
  // in {session: titket}.
  var TicketAuthenticator = Authenticator.extend({
    constructor: function TicketAuthenticator(options) {
      Authenticator.prototype.constructor.call(this, options);
    },

    unauthenticate: function (options) {
      this.connection.session = undefined;
      if (config.rememberTicket) {
        storage.remove(this.connection.url);
      }
      this.trigger('loggedOut', {
        sender: this,
        connection: this.connection,
        reason: options && options.reason
      });
      return this;
    },

    isAuthenticated: function () {
      var session = this.connection.session;
      return !!(session && session.ticket);
    },

    syncStorage: function (session) {
      session || (session = this.connection.session);
      if (!session && config.rememberTicket) {
        // no session -> try to get from session storage
        session = storage.get(this.connection.url);
      }
      if (session) {
        // session -> update
        this.connection.session || (this.connection.session = {});
        _.extend(this.connection.session, session);
      }
      return this;
    },

    setAuthenticationHeaders: function (headers) {
      var session = this.connection.session,
        ticket = session && session.ticket;
      if (ticket) {
        headers[config.ticketHeader] = ticket;
        return true;
      }
    },

    updateAuthenticatedSession: function (data, request) {
      data || (data = {});
      if (!request && data.getResponseHeader) {
        request = data;
        data = {};
      }

      const ticket =
        data.ticket ||
        // If the ticket isn't in the data, check the request,
        // if it is HTTPRequest and if it is not cached.
        (isUncachedRequest(request) && request.getResponseHeader(config.ticketHeader));
      if (ticket) {
        var session = this.connection.session || (this.connection.session = {});
        _.extend(session, {
          ticket: ticket,
          expires: data.expires || (request && request.getResponseHeader(config.ticketExpirationHeader)),
          serverDate: data.serverDate || (request && request.getResponseHeader(config.dateHeader))
        });
        if (config.rememberTicket) {
          storage.set(this.connection.url, session);
        }
      }
    }
  });

  // Checks if the input object is HTTPRequest and if it is not cached.
  function isUncachedRequest(request) {
    // No request => no uncached request.
    if (!request?.getResponseHeader) return false;

    // Evaluate Cache-Control, Expires and Pragma in this priority.
    let uncached1, uncached2, uncached3;

    const cacheControl = request.getResponseHeader('cache-control') ?? '';
    const controlNoCache = /\bno-cache\b/.test(cacheControl);
    const maxAge = /\bmax-age=(\S*)/.exec(cacheControl)?.[1] ?? '';
    const zeroMaxAge = /^0+$/.test(maxAge);
    if (cacheControl) {
      if (controlNoCache) {
        if (maxAge && !zeroMaxAge) {
          log.warn('Cache-Control contained both no-cache and max-age={0}.{1}', maxAge) && console.warn(log.last);
          logURL();
          // Prevent the ticket from being stored, if the header is inconsistent.
          return false;
        }
        uncached1 = true;
      } else {
        uncached1 = zeroMaxAge;
      }
    }

    // Let Expires decide only if Cache-Control did not.
    const expires = request.getResponseHeader('expires') ?? '';
    if (expires) {
      if (new Date(expires) > new Date()) {
        if (uncached1) {
          log.warn('Cache-control prevented caching, but Expires was set to {0}.', expires) && console.warn(log.last);
          logURL();
        } else {
          uncached2 = false;
        }
      } else {
        if (uncached1 === false) {
          log.warn('Cache-control requested caching, but Expires was set to {0}.', expires) && console.warn(log.last);
          logURL();
        } else {
          uncached2 = true;
        }
      }
    }

    // Let Pragma decide only if Cache-Control or Expires did not.
    const pragma = request.getResponseHeader('pragma') ?? '';
    const pragmaNoCache = /\bno-cache\b/.test(pragma);
    if (pragmaNoCache) {
      if (uncached1 === false) {
        log.warn('Cache-control requested caching, but Pragma was set to no-cache.') && console.warn(log.last);
        logURL();
      } else if (uncached2 === false) {
        log.warn('Expires requested caching, but Pragma was set to no-cache.') && console.warn(log.last);
        logURL();
      } else {
        uncached3 = true;
      }
    }

    // Browsers cache responses by default.
    return uncached1 === true || uncached2 === true || uncached3 === true;

    function logURL() {
      const url = request?.settings?.url;
      if (url) {
        log.warn('URL: {0}', url) && console.warn(log.last);
      }
    }
  }

  return TicketAuthenticator;
});
