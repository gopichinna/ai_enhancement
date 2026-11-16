/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/backbone", "csui/utils/contexts/factories/factory", "csui/utils/contexts/factories/connector", "csui/models/widget/recycle.items.model", "csui/utils/commands/recycle", "csui/utils/contexts/factories/recycle.bin", "csui/utils/deepClone/deepClone" ], function(module, _, Backbone, CollectionFactory, ConnectorFactory, RecycleItemsCollection, commandsRecycle, RecycleBinVolumeFactory) {
  "use strict";
  const RecycleItemsCollectionFactory = CollectionFactory.extend({
    propertyPrefix: "recycleitems",
    constructor: function RecycleItemsCollectionFactory(context, options) {
      CollectionFactory.prototype.constructor.apply(this, arguments);
      let recycleItems = this.options.recycleitems || {};
      if (!(recycleItems instanceof Backbone.Collection)) {
        let connector = context.getObject(ConnectorFactory, options), config = module.config();
        recycleItems = new RecycleItemsCollection(recycleItems.models, _.extend({
          connector: connector
        }, recycleItems.options, config.options, RecycleItemsCollectionFactory.getDefaultResourceScope(), {
          autoreset: true
        }));
      }
      this.property = recycleItems;
    },
    setRecycleBinReferenceId: async function() {
      const recycleBinVolumeModel = this.context.getModel(RecycleBinVolumeFactory, {
        permanent: true,
        detached: true
      });
      await recycleBinVolumeModel.ensureFetched();
      this.property.recycleBinReferenceId = recycleBinVolumeModel.get("referenceId");
    },
    fetch: function(options) {
      if (!this.recycleBinReferenceId) {
        this.setRecycleBinReferenceId();
      }
      return this.property.fetch(options);
    }
  }, {
    getDefaultResourceScope: function() {
      return _.deepClone({
        expand: {
          properties: [ "parent_id", "deleted_user_id", "create_user_id" ]
        },
        commands: commandsRecycle.signatures
      });
    }
  });
  return RecycleItemsCollectionFactory;
});