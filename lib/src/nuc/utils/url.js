/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['nuc/lib/underscore', 'nuc/lib/jquery'], function (_, $) {
  'use strict';

  function Url(url) {
    this.raw = url;
  }

  Url.prototype = {
    raw: undefined,

    isValid: function () {
      return this.raw ? this.raw.match(Url.re_weburl) : false;
    },

    isAbsolute: function () {
      return this.raw ? this.raw.match(/^.*\/\//) : false;
    },

    getAbsolute: function () {
      if (this.isAbsolute()) {
        return this.raw;
      }
      // IE11 on Windows 10 2015 LTSB does not implement location.origin.
      // Additional robustness for FF browser returning string 'null' instead of 'file://' .
      var origin =
        location.origin && location.origin.indexOf('://') > 0 ? location.origin : new Url(location.href).getOrigin();
      return Url.combine(origin, this.raw);
    },

    getProtocol: function () {
      var url = this.isAbsolute() && this.raw.indexOf('//') !== 0 ? this.raw : window.location.href;
      return url.toLowerCase().substring(0, url.indexOf(':'));
    },

    getHost: function () {
      var match = this.getAbsolute().match(/^.*\/\/([^:/]+)/);
      return match && match[1];
    },

    getPort: function () {
      var url = this.getAbsolute().toLowerCase(),
        start = url.match(/^.*\/\/([^/]+)/),
        port = start && start[1].match(/:([^/]+)/);
      return port ? parseInt(port[1], 10) : url.indexOf('https') === 0 ? 443 : 80;
    },

    getOrigin: function () {
      var match = this.getAbsolute().match(/^.*\/\/[^/]+/);
      return match && match[0];
    },

    getPath: function () {
      var match = this.getAbsolute().match(/^.*\/\/[^/]+(\/[^?]+)/);
      return match && match[1];
    },

    getVirtualDirectory: function () {
      var match = this.getAbsolute().match(/^.*\/\/[^/]+\/[^/]+/);
      return match && match[0];
    },

    getCgiScript: function () {
      var url = this.getAbsolute();
      // find the index of the "/api/v1" suffix in the URL.
      var apiSuffix = url.length - 7;
      if (url.charAt(url.length - 1) === '/') {
        --apiSuffix;
      }
      if (url.lastIndexOf('/api/v1') === apiSuffix) {
        return url.substr(0, apiSuffix);
      }
      // Original functionality expecting always "/folder/script" before
      // "/api/v1" on the URL path. If the recent application gets here,
      // it might be a problem. Unless the connection configuration in
      // Smart UI changes, not to point to an /api/v1 URL base, this code
      // should not be executed.
      var match = url.match(/^.*\/\/[^/]+\/[^/]+\/[^/]+/);
      return match && match[0];
    },

    getQuery: function () {
      var match = this.getAbsolute().match(/\?(.+)/);
      return match && match[1];
    },

    getApiBase: function (version) {
      version || (version = 'v1');
      typeof version === 'number' && (version = 'v' + version);
      return this.getCgiScript() + '/api/' + version + '/';
    },

    makeAbsoluteUrl: function (relativeUrl, defaultUrlPath) {
      if (!relativeUrl.match(/^\w+:\/\//)) {
        var firstCharacter = relativeUrl.charAt(0);
        if (firstCharacter === '/') {
          if (relativeUrl.charAt(1) === '/') {
            return this.getProtocol() + ':' + relativeUrl;
          }
          return Url.combine(this.getOrigin(), relativeUrl);
        } else if (firstCharacter === '?') {
          return this.getCgiScript() + relativeUrl;
        } else {
          if (!defaultUrlPath) {
            defaultUrlPath = this.getCgiScript();
          }
          return Url.combine(defaultUrlPath, relativeUrl);
        }
      }
      return relativeUrl;
    },

    toString: function () {
      return this.raw;
    }
  };
  Url.version = '1.0';

  Url.combine = function () {
    var url = '';
    for (var i = 0; i < arguments.length; ++i) {
      var part = arguments[i],
        path = part !== undefined && part !== null ? part.toString() : '';
      // IE8 does not support accessing string characters as an array (path[0]).
      if (path.charAt(0) == '/') {
        url += url && url.charAt(url.length - 1) == '/' ? path.substring(1) : path;
      } else {
        if (i > 0 && !(url && url.charAt(url.length - 1) == '/') && path.length > 0) {
          url += '/';
        }
        url += path;
      }
    }
    return url;
  };

  Url.makeMultivalueParameter = function (name, values) {
    if (values && values.length) {
      values = _.map(values, encodeURIComponent);
      return name + '=' + values.join('&' + name + '=');
    }
    return '';
  };

  // Supports either object literals {param: value, ...}
  // or already serialized strings 'param=value[&...]'
  Url.combineQueryString = function () {
    var query = {},
      i,
      part;
    for (i = 0; i < arguments.length; ++i) {
      part = arguments[i];
      if (_.isObject(part)) {
        _.extend(query, part);
      }
    }
    // Use traditional array serialization - without appending
    // the '[]' at the end of the property name
    query = $.param(query, true);
    for (i = 0; i < arguments.length; ++i) {
      part = arguments[i];
      if (_.isString(part) && part) {
        if (query) {
          query += '&';
        }
        query += part;
      }
    }
    return query;
  };

  Url.appendQuery = function (url, query) {
    if (query) {
      if (url.indexOf('?') >= 0) {
        var lastCharacter = url[url.length - 1];
        if (lastCharacter !== '?' && lastCharacter !== '&') {
          url += '&';
        }
      } else {
        url += '?';
      }
      url += query;
    }
    return url;
  };

  // get the url params from a url or a uri with or without a hash.
  Url.urlParams = function (url) {
    if (url) {
      var hashIndex = url.indexOf('#'),
        urlParamsIndex = url.indexOf('?');
      if (urlParamsIndex !== -1) {
        return $.parseParams(url.substring(urlParamsIndex, hashIndex === -1 ? url.length : hashIndex));
      }
    }
    return {};
  };

  Url.mergeUrlParams = function (url, paramToAddStr, paramsToRemoveArray) {
    var urlParams = Url.urlParams(url),
      toRemoveAll = paramsToRemoveArray.concat(_.keys(urlParams)),
      newParams = _.omit($.parseParams(paramToAddStr), toRemoveAll);
    return $.param(newParams);
  };

  //
  // Regular Expression for URL validation
  //
  // Author: Diego Perini
  // Updated: 2010/12/05
  // License: MIT
  //
  // Copyright (c) 2010-2013 Diego Perini (http://www.iport.it)
  //
  // Permission is hereby granted, free of charge, to any person
  // obtaining a copy of this software and associated documentation
  // files (the "Software"), to deal in the Software without
  // restriction, including without limitation the rights to use,
  // copy, modify, merge, publish, distribute, sublicense, and/or sell
  // copies of the Software, and to permit persons to whom the
  // Software is furnished to do so, subject to the following
  // conditions:
  //
  // The above copyright notice and this permission notice shall be
  // included in all copies or substantial portions of the Software.
  //
  // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
  // EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
  // OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  // NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
  // HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
  // WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
  // FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
  // OTHER DEALINGS IN THE SOFTWARE.
  //
  // the regular expression composed & commented
  // could be easily tweaked for RFC compliance,
  // it was expressly modified to fit & satisfy
  // these test for an URL shortener:
  //
  //   http://mathiasbynens.be/demo/url-regex
  //
  // Notes on possible differences from a standard/generic validation:
  //
  // - utf-8 char class take in consideration the full Unicode range
  // - TLDs have been made mandatory so single names like "localhost" fails
  // - protocols have been restricted to ftp, http and https only as requested
  //
  // Changes:
  //
  // - IP address dotted notation validation, range: 1.0.0.0 - 223.255.255.255
  //   first and last IP address of each class is considered invalid
  //   (since they are broadcast/network addresses)
  //
  // - Added exclusion of private, reserved and/or local networks ranges
  //
  // - Made starting path slash optional (http://example.com?foo=bar)
  //
  // - Allow a dot (.) at the end of hostnames (http://example.com.)
  //
  // Compressed one-line versions:
  //
  // Javascript version
  //
  // /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?$/i
  //
  // PHP version
  //
  // _^(?:(?:https?|ftp)://)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\x{00a1}-\x{ffff}0-9]-*)*[a-z\x{00a1}-\x{ffff}0-9]+)(?:\.(?:[a-z\x{00a1}-\x{ffff}0-9]-*)*[a-z\x{00a1}-\x{ffff}0-9]+)*(?:\.(?:[a-z\x{00a1}-\x{ffff}]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?$_iuS
  //
  Url.re_weburl = new RegExp(
    '^' +
      // protocol identifier
      '(?:(?:https?|ftp)://)' +
      // user:pass authentication
      '(?:\\S+(?::\\S*)?@)?' +
      '(?:' +
      // IP address exclusion
      // private & local networks
      '(?!(?:10|127)(?:\\.\\d{1,3}){3})' +
      '(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})' +
      '(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})' +
      // IP address dotted notation octets
      // excludes loopback network 0.0.0.0
      // excludes reserved space >= 224.0.0.0
      // excludes network & broacast addresses
      // (first & last IP address of each class)
      '(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])' +
      '(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}' +
      '(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))' +
      '|' +
      // host name
      '(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)' +
      // domain name
      '(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*' +
      // TLD identifier
      '(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))' +
      // TLD may end with dot
      '\\.?' +
      ')' +
      // port number
      '(?::\\d{2,5})?' +
      // resource path
      '(?:[/?#]\\S*)?' +
      '$',
    'i'
  );

  return Url;
});
