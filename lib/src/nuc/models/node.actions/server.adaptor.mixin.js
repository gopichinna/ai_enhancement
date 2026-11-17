/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['nuc/lib/underscore', 'nuc/utils/url'], function (_, Url) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      var originalFetch = prototype.fetch;

      return _.extend(prototype, {
        makeServerAdaptor: function (_options) {
          return this;
        },

        fetch: function (options) {
          // Use POST with body (instead of GET) to avoid too long server call URL that fails
          var data = {};
          !!this.parent_id && (data.reference_id = this.parent_id);
          if (!!this.reference_id && !data.reference_id) {
            data.reference_id = this.reference_id;
          }
          data.ids = this.nodes;
          data.actions = this.getRequestedCommandsUrlQuery().actions;
          var postOptions = options || {};
          _.extend(postOptions, {
            type: 'POST',
            url: Url.combine(this.connector.getConnectionUrl().getApiBase('v2'), '/nodes/actions'),
            contentType: 'application/x-www-form-urlencoded',
            data: { body: JSON.stringify(data) }
          });

          return originalFetch.call(this, postOptions);
        },

        parse: function (response, _options) {
          // FIXME: Remove this, as soon as all servers support GET v2/nodes/actions.
          if (_.isArray(response)) {
            return response;
          }
          // from { node_id: { data: { command_key: { ... }, ... }, ... }
          // to [ { id: node_id, actions: [ { signature: command_key, ... }, ... ] }, ... ]
          return _.map(
            response.results,
            function (value, key) {
              return {
                id: key,
                actions: _.map(value.data, function (value, key) {
                  value.signature = key;
                  return value;
                })
              };
            },
            {}
          );
        }
      });
    }
  };

  return ServerAdaptorMixin;
});
