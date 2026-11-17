/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/backbone", "csui/utils/contexts/factories/factory", "csui/utils/contexts/factories/connector" ], function(module, _, Backbone, ModelFactory, ConnectorFactory) {
  var SearchQueryFormModel = Backbone.Model.extend({
    constructor: function SearchQueryFormModel(attributes, options) {
      Backbone.Model.prototype.constructor.call(this, attributes, options);
    }
  });
  var SearchQueryFormModelFactory = ModelFactory.extend({
    propertyPrefix: "savedQueryForm",
    constructor: function SearchQueryModelFactory(context, options) {
      ModelFactory.prototype.constructor.apply(this, arguments);
      var savedQueryForm = this.options.savedQueryForm || {};
      if (!(savedQueryForm instanceof Backbone.Model)) {
        var connector = context.getObject(ConnectorFactory, options), config = module.config();
        savedQueryForm = new SearchQueryFormModel(savedQueryForm.attributes || config.attributes, _.defaults({
          connector: connector
        }, savedQueryForm.options, config.options));
      }
      this.property = savedQueryForm;
    }
  });
  SearchQueryFormModelFactory.defaultModel = SearchQueryFormModel;
  return SearchQueryFormModelFactory;
});