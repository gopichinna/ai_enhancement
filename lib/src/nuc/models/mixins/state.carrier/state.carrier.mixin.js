/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['nuc/lib/underscore', 'nuc/lib/backbone', 'nuc/models/mixins/state.requestor/state.requestor.mixin'], function (
  _,
  Backbone,
  StateRequestorMixin
) {
  'use strict';

  /**
 * @class StateCarrierMixin
 * @see {@link FieldsV2Mixin}
 * @see {@link StateRequestorMixin}
 * @mixin
 *
 * @description Provides support for maintaining the `state` properties as introduced by the `api/v2/nodes/:id` or `api/v2/nodes/:id/nodes` (V2) resources.

 Server responses may contain not only data, but also state properties, which may be needed for evaluation on either client or server sides. The `metadata_token`, for example.

 ### How to apply the mixin to a model

 ```
 var MyModel = Backbone.Model.extend({
  constructor: function MyModel(attributes, options) {
    Backbone.Model.prototype.constructor.apply(this, arguments);
    this
      .makeConnectable(options)
      .makeFieldsV2(options)
      .makeStateCarrier(options);
  },

  url: function () {
    var url = Url.combine(this.connector.connection.url, 'myresource');
    var query = Url.combineQueryString(
      this.getResourceFieldsUrlQuery(),
      this.getStateEnablingUrlQuery()
    );
    return Url.appendQuery(url, query);
  },

  parse: function (response, options) {
    var results = response.results || response;
    this.parseState(results, 'properties');
    return results.data.properties;
  }
});

 ConnectableMixin.mixin(MyModel.prototype);
 FieldsV2Mixin.mixin(MyModel.prototype);
 StateCarrierMixin.mixin(MyModel.prototype);
 ```

 This mixin us usually combined together with the `ConnectableMixin` and `FieldsV2Mixin` or with another cumulated mixin which includes them. This mixin includes the `StateRequestorMixin` and applieas it automatically.

 ### How to use the mixin

 Get or set properties in te `state` object as you need them:

 ```
 // Get the metadata toklen to pass it to a modification server call
 var metadataToken = model.state.get('metadata_token');

 // Set the metadatan token from a response of a server call
 model.state.set('metadata_token', results.state.properties.metadata_token);
 ```

 Simplify parsing the state properties from a standard V2 API response:

 ```
 // Support retrieving the attributes when fetching either collection or model.
 var results = response.results || response;
 var data = results.data;
 this.parseState(data, results, 'properties');
 ```

 */

  var StateCarrierMixin = {
    mixin: function (prototype) {
      StateRequestorMixin.mixin(prototype);

      return _.extend(
        prototype,
        /** @lends StateCarrierMixin# */ {
          /**
           * @function
           * @param options {Object} -  Recognized option properties
           * @param attributes - State attributes taken from model
           * @returns {FieldsV2Mixin}
           * @description  Must be called in the constructor to initialize the mixin functionality.
           * Expects the `Backbone.Model` or `Backbone.Collection` constructor options passed in.
           */
          makeStateCarrier: function (options, attributes) {
            this.state = new Backbone.Model(getStateAttributes(attributes));
            return this.makeStateRequestor(options);
          },

          /**
           * @member {Backbone.Model} state
           * @description Maintains the object state properties (empty by default).
           */

          /**
           * @function
           * @description  Sets the state from state attributes
           * @param attributes
           * @returns void
           */
          setState: function (attributes) {
            if (this.state) {
              var state = getStateAttributes(attributes);
              if (state) {
                this.state.set(state);
              }
            }
          },

          /**
           * @function
           * @description Parses a standard V2 response and sets the state properties to the `state` object on the
           * instance.
           * @param response {Object} - The `response` parameter is an object with a response object; either a complete response,
           * or just the `results` sub-object, if it is present in the response as a wrapper.
           * @param role {String} - The `role` parameter is a `string` choosing the `fields` role, which the state should be received for;
           * the default value is "properties".
           * @returns void
           */
          parseState: function (node, results, _role) {
            // TODO: Allow states for other fields, than "properties"
            node.state = getStateAttributes(results);
          }
        }
      );
    }
  };

  function getStateAttributes(attributes) {
    var state = attributes && attributes.state;
    return (state && state.properties) || state;
  }

  return StateCarrierMixin;
});
