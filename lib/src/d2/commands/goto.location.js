/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "csui/models/command", "csui/utils/commands/browse", "nuc/models/node/node.model", "csui/utils/commandhelper", "d2/utils/contexts/factories/node.navigation" ], function(require, $, _, Backbone, CommandModel, BrowseCommand, NodeModel, CommandHelper, NodeNavigationCollctionFactory) {
  "use strict";
  return BrowseCommand.extend({
    defaults: {
      signature: "D2-GoToLocation",
      command_key: "D2-GoToLocation",
      scope: "single"
    },
    enabled: function(status, options) {
      if (status.originatingView && status.originatingView.options && status.originatingView.options.containerCheck) {
        var node = CommandHelper.getJustOneNode(status);
        return node && this._isSupported(node);
      }
      if (status.container && status.container instanceof NodeModel && status.container.get("widgetPreference")?.widgetConfig?.widgetParams && !status.container.get("widgetPreference").widgetConfig.widgetParams.dql_content) {
        return false;
      }
      return CommandModel.prototype.enabled.call(this, status, options);
    },
    _isSupported: function(node) {
      return !node.get("container");
    },
    execute: function(status, options) {
      var deferred = $.Deferred(), node = CommandHelper.getJustOneNode(status), parent = node.parent, context = status.context || options && options.context, nodeNavigationCollection = context && context.getCollection(NodeNavigationCollctionFactory);
      nodeNavigationCollection && nodeNavigationCollection.reset();
      if (!parent) {
        if (node.get("parent_id")) {
          parent = node.parent = new NodeModel({
            id: node.get("parent_id")
          }, {
            connector: node.connector
          });
        } else {
          deferred.resolve();
        }
      }
      parent.fetch().done(function() {
        var clonedStatus = {
          nodes: status.nodes.deepClone(),
          originatingView: status.originatingView,
          context: status.context
        };
        options = options || {};
        options.selectionNode = node;
        clonedStatus.nodes.reset(parent);
        BrowseCommand.prototype.execute.call(this, clonedStatus, options).done(deferred.resolve).fail(deferred.reject);
      }).fail(function() {
        status.context.rejectPerspective(new Backbone.Model(), new Error(parent.error.get("message")));
        deferred.reject();
      });
      return deferred.promise();
    }
  });
});