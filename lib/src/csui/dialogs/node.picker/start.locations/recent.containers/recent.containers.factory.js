/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/dialogs/node.picker/start.locations/location.base.factory", "i18n!csui/dialogs/node.picker/start.locations/impl/nls/lang", "csui/dialogs/node.picker/start.locations/recent.containers/impl/recent.containers.collection" ], function(_, $, LocationBaseFactory, lang, RecentContainerCollection) {
  "use strict";
  var RecentContainerFactory = LocationBaseFactory.extend({
    updateLocationModel: function(model) {
      model.set({
        name: lang.labelRecentContainers,
        icon: "recent"
      });
      return $.Deferred().resolve().promise();
    },
    getLocationParameters: function(options) {
      var nodes = new RecentContainerCollection(undefined, {
        connector: this.options.connector,
        autoreset: true,
        expand: [ "node" ]
      });
      options?.checkPermissions && nodes.setFields("permissions", "");
      return {
        container: null,
        collection: nodes,
        locationName: lang.labelRecentContainers
      };
    }
  });
  return RecentContainerFactory;
});