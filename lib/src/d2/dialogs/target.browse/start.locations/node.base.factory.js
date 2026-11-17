/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "d2/dialogs/target.browse/start.locations/location.base.factory", "nuc/models/node/node.model", "nuc/models/nodechildren", "csui/utils/commands" ], function($, _, LocationBaseFactory, NodeModel, NodeChildrenCollection, commands) {
  "use strict";
  var NodeBaseFactory = LocationBaseFactory.extend({
    constructor: function PersonalVolumeFactory() {
      LocationBaseFactory.prototype.constructor.apply(this, arguments);
      this.container = new NodeModel(this.options.node, {
        connector: this.options.connector
      });
    },
    updateLocationModel: function(model) {
      var self = this, deferred = $.Deferred();
      this.container.fetch().then(function() {
        model.set({
          name: self.container.get("name") || self.options.defaultName,
          icon: self.options.icon,
          invalid: false,
          selectable: self.options.selectable
        });
        deferred.resolve();
      }, function() {
        model.set({
          invalid: true
        });
        model.collection.remove(model);
        deferred.reject();
      });
      return deferred.promise();
    },
    getLocationParameters: function() {
      var children = new NodeChildrenCollection(undefined, {
        node: this.container,
        autoreset: true,
        expand: [ "node" ],
        orderBy: "name asc",
        commands: commands.getAllSignatures()
      });
      this.container.set("unselectable", this.options.unselectable);
      return {
        container: this.container,
        collection: children
      };
    }
  });
  return NodeBaseFactory;
});