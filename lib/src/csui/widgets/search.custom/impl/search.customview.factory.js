/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/backbone", "csui/utils/contexts/factories/factory", "csui/utils/contexts/factories/connector", "csui/widgets/search.custom/impl/search.customview.model" ], function(module, _, Backbone, ModelFactory, ConnectorFactory, SearchCustomModel) {
  var SearchCustomViewFactory = ModelFactory.extend({
    propertyPrefix: "customSearch",
    constructor: function SearchCustomViewFactory(context, options) {
      ModelFactory.prototype.constructor.apply(this, arguments);
      var customSearch = this.options.customSearch || {};
      if (!(customSearch instanceof Backbone.Model)) {
        var connector = context.getObject(ConnectorFactory, options), config = module.config();
        customSearch = new SearchCustomModel(customSearch.attributes || config.attributes, _.defaults({
          connector: connector,
          nodeId: options.customQuery.nodeId
        }, customSearch.options, config.options));
      }
      this.property = customSearch;
    },
    fetch: function(options) {
      return this.property.fetch(options);
    }
  });
  return SearchCustomViewFactory;
});