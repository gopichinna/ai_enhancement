/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/dialogs/node.picker/start.locations/location.base.factory", "csui/dialogs/members.picker/start.locations/acl.groups/impl/acl.groups.collection", "csui/utils/commands", "i18n!csui/dialogs/members.picker/start.locations/impl/nls/lang" ], function(_, $, LocationBaseFactory, AclContainerCollection, commands, lang) {
  "use strict";
  var AclGroupsFactory = LocationBaseFactory.extend({
    updateLocationModel: function(model) {
      var container = this.options.container;
      model.set({
        hide: true,
        invalid: false,
        location: "acl.groups"
      });
      return $.Deferred().resolve().promise();
    },
    getLocationParameters: function() {
      var container = this.options.container;
      var groupCollectionModel = new AclContainerCollection(undefined, {
        connector: this.options.connector,
        nodeId: this.options.nodeId
      });
      container.set("unselectable", false);
      return {
        container: this.options.container,
        collection: groupCollectionModel,
        locationName: lang.labelCurrentLocation
      };
    }
  });
  return AclGroupsFactory;
});