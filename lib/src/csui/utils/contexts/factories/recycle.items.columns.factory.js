/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/backbone", "csui/utils/contexts/factories/factory", "csui/utils/contexts/factories/recycle.items" ], function(Backbone, CollectionFactory, RecycleItemsCollectionFactory) {
  const RecycleItemsColumnsCollectionFactory = CollectionFactory.extend({
    propertyPrefix: "recycleitems_columns",
    constructor: function RecycleItemsColumnsCollectionFactory(context, options) {
      CollectionFactory.prototype.constructor.apply(this, arguments);
      let columns = this.options.columns || {};
      if (!(columns instanceof Backbone.Collection)) {
        let children = context.getCollection(RecycleItemsCollectionFactory, options);
        columns = children.columns;
      }
      this.property = columns;
    }
  });
  return RecycleItemsColumnsCollectionFactory;
});