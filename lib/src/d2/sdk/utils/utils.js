/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'dctmw/utils/utils'
], function(UtilsImpl){
  'use strict';

  /**
   * Utility functions.
   *
   * @module {d2/sdk/utils/utils} d2/sdk/utils/utils
   * @name Utils
   * @extends {Object}
   *
   */

  return {
    /**
     * Get context path name of D2 Smart View deployment
     * @returns {string} the context path name
     * @memberOf module:Utils
     */
    getAppContext: function() {
      return UtilsImpl.getAppContext();
    },

    /**
     * Get a properly namespaced storage name for the given key. Used while creating a boundary within `localStorage` or `sessionStorage`.
     * See `getLocalStore` and `getSessionStore` below.
     * @param {string} key - original key name
     * @returns {string} namespaced key name
     * @memberOf module:Utils
     */
    getStoreKey: function(key) {
      return UtilsImpl.getStoreKey(key);
    },

    /**
     * Get a local storage area identified by the given key. A new storage area gets created if doesn't exist already.
     *
     * @param {string} key - Storage identifier
     * @returns {NamedStorage} local store instance
     * @memberOf module:Utils
     */
    getLocalStore: function(key) {
      return UtilsImpl.getLocalStore(key);
    },

    /**
     * Get a session storage area identified by the given key. A new storage area gets created if doesn't exist already.
     * @param {string} key - Storage identifier
     * @returns {NamedStorage} session store instance
     * @memberOf module:Utils
     */
    getSessionStore: function(key) {
      return UtilsImpl.getSessionStore(key);
    },

    /**
     * Detects whether the D2 Smart View runtime platform is a mobile
     * @returns {boolean} `true` if it's being run on mobile, `false` otherwise.
     * @memberOf module:Utils
     */
    isMobile: function() {
      return UtilsImpl.isMobile();
    },

    /**
     * Detects whether the D2 Smart View runtime platform is appworks.
     * @returns {boolean} `true` if it's Appworks.
     * @memberOf module:Utils
     */
    isAppworks: function() {
      return UtilsImpl.isAppworks();
    },

    /**
     * Open the given URL in window.
     * @param {string} url - The URL to open
     * @param {Window} [wnd] - The window where `url` will be opened. Defaults to current global `window` object.
     * @param {boolean} [focus=false] - Whether to focus the window
     * @param {boolean} [keepLink=false] - Whether to keep the `opener` reference. `true` keeps it.
     * @returns {void}
     * @memberOf module:Utils
     */
    openUrlInWindow: function(url, wnd, focus, keepLink) {
      UtilsImpl.openUrlInWindow(url, wnd, focus, keepLink);
    },

    /**
     * Make a single D2-REST AJAX call with a batch of operations.
     *
     * @example
     * define([
     *    'd2/sdk/utils/contexts/context.utils',
     *    'd2/sdk/utils/utils',
     *    'd2/sdk/utils/contexts/factories/connector'
     * ], function(contextUtil, util, ConnectorFactory){
     *    'use strict';
     *
     *    // Retrieve document menu actions and favorited status for object '0c0015fa8000291e' in a single batch call
     *    util.makeBatchAjaxCall({
     *      connector: contextUtil.getPerspectiveContext().getObject(ConnectorFactory),
     *      continueOnError: true,
     *      operations: [
     *        {
     *          id: 'favorites',
     *          request: {
     *            method: 'GET',
     *            uri: '/repositories/d2repo/favorites-checker?object-ids=0c0015fa8000291e'
     *          }
     *        },
     *        {
     *          id: 'actions',
     *          request: {
     *            method: 'GET',
     *            uri: '/repositories/d2repo/actions?type=MenuContext&widgetType=DoclistWidget&include-subtype=true&object-ids=0c0015fa8000291e'
     *          }
     *        }
     *      ]
     *    })
     *      .done(function(){
     *        console.log('batch call success');
     *      })
     *      .fail(function(){
     *        console.log('batch call failed');
     *      });
     * });
     *
     * @async
     * @param {object} options - Holder of different options
     * @param {Connector} options.connector - Transport for the AJAX call. See {@link ./contexts/factories/connector|Connector}.
     * @param {BatchOperationRequest[]} options.operations - Operations to be performed in this batch.
     * @param {boolean} [options.transactional=false] - Whether this batch is to be executed as a transaction. A transactional batch operates with 'Either all or none' paradigm.
     * @param {boolean} [options.sequential=false] - For a non-transactional batch, whether the operations are to be run sequentially or parallely.
     * @param {boolean} [options.continueOnError=false] - Whether remaining operations are to be run if one fails.
     * @returns {jQuery.Promise} The returned promise fails on AJAX error. It resolves otherwise invoking `BatchDoneCallback` as documented below.
     * @memberOf module:Utils
     */
    makeBatchAjaxCall: function(options) {
      return UtilsImpl.makeBatchAjaxCall(options);
    },

    /**
     * Build complete URL from a D2-REST link
     * @param {Object} link - The link as is from a D2-REST response
     * @param {boolean} isTemplate - Is this D2-REST link a templated one or regular.
     * @returns {string} the complete URL.
     * @memberOf module:Utils
     */
    buildLinkUrl: function(link, isTemplate) {
      return UtilsImpl.buildLinkUrl(link, isTemplate);
    },

    /**
     * Parse AJAX error happened as a result of D2-REST API call and return a normalized error structure.
     * @param {external:XMLHttpRequest} xhr - The XHR transport
     * @param {string} [textStatus] - Textual status associated with the error
     * @param {string} [errorThrown] - Custom error message in case the XHR response could not be parsed.
     * @param {boolean} [includeDetails=false] - Whether to include a `errorDetails` field in the parsed error structure.
     * @returns {ParsedErrorType} the parsed error
     * @memberOf module:Utils
     */
    parseAjaxError: function(xhr, textStatus, errorThrown, includeDetails) {
      return UtilsImpl.parseAjaxError(xhr, textStatus, errorThrown, includeDetails);
    },

    /**
     * Parse AJAX error happened as a result of D2-REST API call and return a compact string representing it.
     * @param {external:XMLHttpRequest} xhr - The XHR transport
     * @param {string} [textStatus] - Textual status associated with the error
     * @param {string} [errorThrown] - Custom error message in case the XHR response could not be parsed.
     * @param {boolean} [includeDetails=false] - Whether to include a `errorDetails` field in the parsed error structure.
     * @returns {string} the parsed error
     * @memberOf module:Utils
     */
    parseAjaxErrorAsString: function(xhr, textStatus, errorThrown, includeDetails) {
      return UtilsImpl.parseAjaxErrorAsString(xhr, textStatus, errorThrown, includeDetails);
    },

    /**
     * Extract error from custom object and format it similar to return format of `parseAjaxError`.
     * @param {string} responseType - Hint of how to parse `responseData`. Can be any of 'xml', 'json' or 'object'
     * @param {JSON|string} responseData - If `responseType` is 'object' then a JSON object, otherwise a string serialized error structure.
     * Irrespective of its type, every input is expected to have a `code`, `message` and `details` field in it.
     * @returns {ParsedErrorType} the parsed error
     * @memberOf module:Utils
     */
    parseError: function(responseType, responseData) {
      return UtilsImpl.parseError(responseType, responseData);
    },

    /**
     * Extract error from custom object and return a compact string representing it.
     * @param {string} responseType - Hint of how to parse `responseData`. Can be any of 'xml', 'json' or 'object'
     * @param {JSON|string} responseData - If `responseType` is 'object' then a JSON object, otherwise a string serialized error structure.
     * Irrespective of its type, every input is expected to have a `code`, `message` and `details` field in it.
     * @returns {string} the parsed error
     * @memberOf module:Utils
     */
    parseErrorAsString: function(responseType, responseData) {
      return UtilsImpl.parseErrorAsString(responseType, responseData);
    },

    /**
     * Set some text content to the browser clipboard
     * @param {string} clipboardText - The content to be copied.
     * @returns {boolean} `true` indicates the copy is successful.
     * @memberOf module:Utils
     *
     */
    copyToClipboard: function(clipboardText) {
      return UtilsImpl.copyToClipboard(clipboardText);
    },

    /**
     * Checks whether a given value is a `jQuery.Promise` instance or not
     * @param {*} value - The test value
     * @returns {boolean} `true` if it's a `jQuery.Promise`, `false` otherwise.
     * @memberOf module:Utils
     */
    isJqueryPromise: function(value) {
      return UtilsImpl.isJqueryPromise(value);
    },

    /**
     * Checks whether a given value is a non-empty `string`
     * @param {*} str - The test value
     * @returns {boolean} `true` if it's a `string`
     * @memberOf module:Utils
     */
    isNonEmptyString: function(str) {
      return UtilsImpl.isNonEmptyString(str);
    },

    /**
     * Compare two functions for equality
     * @param {function} fn1 - Left hand side
     * @param {function} fn2 - Right hand side
     * @returns {boolean} `true` only if Left hand side is equal to right hand side.
     * @memberOf module:Utils
     */
    areSameFunctions: function(fn1, fn2) {
      return UtilsImpl.areSameFunctions(fn1, fn2);
    }
  };

  /**
   * The done callback type invoked after a batch AJAX call resolves
   * @callback BatchDoneCallback
   * @param {BatchOperationResponse[]} success - Operations that succeeded.
   * @param {BatchOperationResponse[]} [failures] - Operations that failed.
   */

  /**
   * Each response from a D2-REST batch AJAX call
   * @typedef {Object} BatchOperationResponse
   * @property {string} id - `id` of the operation, as was used while forming the batch request.
   * @property {String} state - Status of the operation. Has either `FINISHED` or `FAILED` as values representing success & failure respectively.
   * @property {Object} output - HTTP Response from the D2-REST API for this operation
   */

  /**
   * Each operation of a D2-REST batch AJAX call
   * @typedef {Object} BatchOperationRequest
   * @property {string} id - A unique identifier of this operation. It has to be unique only within this current batch.
   * @property {Object} request - AJAX request for this operation
   * @property {string} request.method - HTTP method name. GET, POST, PUT, DELETE etc.
   * @property {string} request.uri - URL of the D2-REST API being invoked.
   * @property {string} [request.entity] - String serialized JSON body for the D2-REST API call.
   * @property {BatchOperationRequestHeader[]} [request.headers] - Additional headers to include in this D2-REST API call
   */

  /**
   * Request header of a batch operation
   * @typedef {Object} BatchOperationRequestHeader
   * @property {string} name - Name of the request header
   * @property {string} value - Value of the request header
   */

  /**
   * The built-in class for sending HTTP requests.
   * @external XMLHttpRequest
   * @see https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
   */

  /**
   * Parsed AJAX error structure
   * @typedef ParsedErrorType
   * @property {string} code - Error code.
   * @property {string} message - Error message.
   * @property {string} [errorDetails] - Error details.
   */
});