/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/backbone", "csui/utils/contexts/factories/factory", "csui/utils/contexts/factories/connector" ], function(module, _, Backbone, ModelFactory, ConnectorFactory) {
  "use strict";
  var SearchQueryModel = Backbone.Model.extend({
    constructor: function SearchQueryModel(attributes, options) {
      Backbone.Model.prototype.constructor.call(this, attributes, options);
    }
  });
  var SearchQueryModelFactory = ModelFactory.extend({
    propertyPrefix: "savedQuery",
    constructor: function SearchQueryModelFactory(context, options) {
      ModelFactory.prototype.constructor.apply(this, arguments);
      var savedQuery = this.options.savedQuery || {};
      if (!(savedQuery instanceof Backbone.Model)) {
        var connector = context.getObject(ConnectorFactory, options), config = module.config();
        savedQuery = new SearchQueryModel(savedQuery.attributes || config.attributes, _.defaults({
          connector: connector
        }, savedQuery.options, config.options));
      }
      this.property = savedQuery;
    }
  });
  SearchQueryModelFactory.defaultModel = SearchQueryModel;
  return SearchQueryModelFactory;
});