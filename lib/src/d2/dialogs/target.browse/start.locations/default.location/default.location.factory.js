/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "d2/dialogs/target.browse/start.locations/location.base.factory", "nuc/models/nodechildren", "csui/utils/commands", "i18n!csui/dialogs/node.picker/start.locations/impl/nls/lang" ], function(_, $, LocationBaseFactory, NodeChildrenCollection, commands, lang) {
  "use strict";
  var DefaultLocationFactory = LocationBaseFactory.extend({
    updateLocationModel: function(model) {
      model.set({
        hide: true,
        invalid: false
      });
      return $.Deferred().resolve().promise();
    },
    getLocationParameters: function(options) {
      var container = this.options.container;
      var children = new NodeChildrenCollection(undefined, {
        node: this.options.container,
        subTypeFilters: options.subTypeFilters,
        excludeTypes: options.excludeTypes,
        autoreset: true,
        expand: [ "node" ],
        orderBy: "name asc",
        commands: commands.getAllSignatures()
      });
      container.set("unselectable", false);
      return {
        container: container,
        collection: children,
        locationName: lang.labelCurrentLocation
      };
    }
  });
  return DefaultLocationFactory;
});