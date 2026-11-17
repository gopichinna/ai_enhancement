/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/backbone", "csui/utils/contexts/factories/factory", "csui/utils/contexts/factories/connector", "csui/models/permission/dynamic.permission/dynamic.permission.collection", "csui/utils/base" ], function(Backbone, CollectionFactory, ConnectorFactory, DynamicPermissionCollection, base) {
  let DynamicPermissionCollectionFactory = CollectionFactory.extend({
    propertyPrefix: "dynamicPermissions",
    constructor: function PermissionCollectionFactory(context, options) {
      CollectionFactory.prototype.constructor.apply(this, arguments);
      let dynamicPermissions = this.options.dynamicPermissions || {};
      if (!(dynamicPermissions instanceof Backbone.Collection)) {
        const connector = context.getObject(ConnectorFactory, options);
        dynamicPermissions = new DynamicPermissionCollection(dynamicPermissions.models, Object.assign({
          connector: connector,
          nodeId: this.options.model.get("id")
        }, dynamicPermissions.options, {
          autofetch: true,
          autoreset: true
        }));
      }
      this.property = dynamicPermissions;
    },
    isFetchable: function() {
      return this.property.isFetchable();
    },
    fetch: async function() {
      try {
        await this.property.fetch();
      } catch (error) {
        message = new base.RequestErrorMessage(error);
        require([ "csui/dialogs/modal.alert/modal.alert" ], function(ModalAlert) {
          ModalAlert.showError(message.toString());
        });
      }
    }
  });
  return DynamicPermissionCollectionFactory;
});