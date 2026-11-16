/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "d2/dialogs/target.browse/start.locations/location.base.factory", "nuc/models/nodechildren", "csui/utils/commands", "i18n!d2/dialogs/target.browse/start.locations/impl/nls/lang" ], function(_, $, LocationBaseFactory, NodeChildrenCollection, commands, lang) {
  "use strict";
  var CurrentLocationFactory = LocationBaseFactory.extend({
    updateLocationModel: function(model) {
      var container = this.options.container;
      model.set({
        name: lang.labelCurrentLocation,
        icon: "location",
        invalid: !(container && container.isFetchable())
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
        commands: options.commands,
        orderBy: "name asc"
      });
      container.set("unselectable", false);
      return {
        container: container,
        collection: children,
        locationName: lang.labelCurrentLocation
      };
    }
  });
  return CurrentLocationFactory;
});