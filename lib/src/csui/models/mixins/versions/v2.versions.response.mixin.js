/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore" ], function(_) {
  "use strict";
  var VersionsV2ResponseMixin = {
    mixin: function(prototype) {
      return _.extend(prototype, {
        makeVersionableV2Response: function(options) {
          return this;
        },
        parseVersionsResponse: function(response) {
          if (!!response.results && !!response.results.data) {
            if (!!response.results.actions) {
              _parseActions.call(this, response.results.actions, response.results.data.versions);
            }
            return response.results.data.versions;
          }
          return response;
        }
      });
    }
  };
  function _parseActions(actions, version) {
    version.actions = _.chain(actions.data).keys().map(function(key) {
      var attributes = actions.data[key];
      attributes.signature = key;
      return attributes;
    }).value();
  }
  return VersionsV2ResponseMixin;
});