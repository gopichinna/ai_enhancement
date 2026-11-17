/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'nuc/lib/underscore',
  'nuc/lib/backbone',
  'nuc/utils/log',
  'nuc/utils/url',
  'nuc/models/datadefinition'
], function (_, Backbone, log, Url, DataDefinitionModel) {
  'use strict';

  //
  // Generic Data-Definition Collection.
  //
  // Params in constructor:
  // - models: can be passed in or undefined
  // - options:
  //   Two possible ways with the 'options' in constructor as in the following examples:
  //   1) options = {
  //        connector: connector,
  //        url: "api/v1/nodes/2000"
  //      }
  //   2) options = {
  //        node: node,
  //        [nodeResource: "actions"]  // optional
  //      }
  //
  var DataDefinitionCollection = Backbone.Collection.extend({
    model: DataDefinitionModel,

    constructor: function DataDefinitionCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
      this.setOptions(options);
    },

    // public
    setOptions: function (options) {
      this.options = options ? options : {};
      this.options.connector && this.options.connector.assignTo(this);
      this.options.node && this.options.node.connector && this.options.node.connector.assignTo(this);
    },

    url: function () {
      var url;
      if (this.options.url) {
        var cgiPath = new Url(this.connector.connection.url).getCgiScript(true);
        url = Url.combine(cgiPath, this.options.url);
      } else {
        url = this.options.node && this.options.node.urlBase();
        if (this.options.nodeResource) {
          url = Url.combine(url, this.options.nodeResource);
        }
      }
      return url;
    },

    fetch: function (options) {
      log.debug("Fetching data-definitions for url '{0}'.", this.url()) &&
        typeof console !== 'undefined' &&
        console.log(log.last);

      options || (options = {});
      if (options.reset === undefined) {
        options.reset = true;
      }

      return Backbone.Collection.prototype.fetch.call(this, options);
    },

    parse: function (response, options) {
      this.data = response.data || {};
      this.definitions = response.definitions || {};
      this.definitions_map = response.definitions_map || {};
      this.definitions_order = response.definitions_order || {};

      // construct a flat structure
      this.definitions_flat = {};
      _.each(
        this.definitions,
        function (def, key) {
          var definition = _.extend(
            {
              signature: key,
              href: this.data[key]
            },
            def
          );
          this.definitions_flat[key] = definition;
        },
        this
      );

      return Backbone.Collection.prototype.parse.call(this, this.definitions_flat, options);
    },

    // public
    GetDefinitionsOrder: function () {
      return this.definitions_order;
    },

    // public
    GetDefinitionMap: function () {
      return this.definitions_map;
    },

    // public
    GetDefinition: function (signature) {
      return this.definitions[signature];
    },

    // public: get the flat definitions structure of data-definitions
    GetFlatCollection: function () {
      return this.definitions_flat || {};
    },

    // public: return a flat definition based on the requested definition key
    GetFlatDefinition: function (def) {
      return this.definitions_flat[def];
    }
  });

  _.extend(DataDefinitionCollection, { version: '1.0' });

  return DataDefinitionCollection;
});
