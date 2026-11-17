/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/backbone", "csui/utils/contexts/factories/factory" ], function(module, _, Backbone, CollectionFactory) {
  "use strict";
  var NavigationModel = Backbone.Model.extend({
    constructor: function NavigationModel(attributes, options) {
      return Backbone.Model.prototype.constructor.call(this, attributes, options);
    }
  });
  var NavigationModelCollection = Backbone.Collection.extend({
    constructor: function NavigationModelCollection() {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
    }
  });
  var NodeNavigationCollectionFactory = CollectionFactory.extend({
    propertyPrefix: "nodeNavigation",
    constructor: function NavigationModelCollectionFactory() {
      CollectionFactory.prototype.constructor.apply(this, arguments);
      this.options.detached = true;
      this.options.permanent = true;
      var nextNodeNavigation = this.options.nextNodeNavigation || {};
      if (!(nextNodeNavigation instanceof Backbone.Collection)) {
        var config = module.config();
        nextNodeNavigation = new NavigationModelCollection(nextNodeNavigation.attributes || config.attributes, _.defaults({}, nextNodeNavigation.options, config.options));
      }
      this.property = nextNodeNavigation;
    },
    isFetchable: function() {
      return false;
    }
  });
  NodeNavigationCollectionFactory.defaultModel = NavigationModel;
  return NodeNavigationCollectionFactory;
});