/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'nuc/lib/underscore',
  'd2/integration/folderbrowser/folder.browser.id.rules',
  'csui-ext!d2/sdk/integration/folder.browser.id.rules'
], function(_, idRulesImpl, extRules){
  'use strict';

  /**
   * A rule collection that defines how to parse id attribute for the FolderBrowser widget in D2SV embedded mode.
   *
   * This collection allows extension registrations and each of those extensions are treated as root object's id provider
   * for the FolderBrowser widget.
   *
   * @note Each rule is supposed to define a `fetcher` callback function that should return a `jquery.Promise` object. See `IDRuleFetcher` below.
   * The returned promise should be resolved with a Documentum ID which will be used as the root container for FolderBrowser. Or, alternatively
   * the returned promise could be rejected to indicate an error.
   *
   * @see {@link ../../nuc/models/mixins/rules.matching/rules.matching.mixin|RulesMatchingMixin} for a complete guide on how to write rules.
   *
   * @example <caption>To register a new type of id provider</caption>
   * //in src/extensions/embed/folder.browser.id.rules.js
   * define([
   *  'nuc/lib/jquery'
   * ], function($){
   *  'use strict';
   *
   *  return [{
   *    equals: {
   *      id_source: 'abcd' //Match this rule when id_source=abcd is present as part of query parameters while accessing FolderBrowser widget using iURL
   *    },
   *    fetcher: function(options) {
   *      var dfd = $.Deferred();
   *
   *      var nodeId = options.params.my_id;
   *      if(!!nodeId) {
   *        dfd.resolve(nodeId);
   *        //This example shows a very trivial case where 'my_id' parameter itself holds the Documentum ID.
   *        //However, depending on requirement complex business integration logic could also be written here to
   *        //retrieve the Documentum ID from an external system
   *      } else {
   *        dfd.reject('my_id is missing from url');
   *      }
   *
   *      return dfd.promise();
   *    }
   *  }];
   * });
   *
   * @module {d2/sdk/integration/folder.browser.id.rules} d2/sdk/integration/"folder.browser.id.rules"
   * @name FolderBrowserIDRules
   * @extends Array
   *
   */

  if(extRules) {
    idRulesImpl.add(_.flatten(extRules, true));
  }

  /**
   * @callback IDRuleFetcher
   * @property {Object} options
   * @property {Object} options.params - JSON object representing query params.
   * @returns {jQuery.Promise} The promise should be either resolved with a Documentum ID(r_object_id) or rejected with an error string.
   */

  return idRulesImpl;
});
