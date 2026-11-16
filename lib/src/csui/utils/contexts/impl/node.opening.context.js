/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/utils/contexts/context", "csui/utils/contexts/factories/connector", "csui/utils/contexts/factories/next.node", "csui/utils/node.links/node.links", "csui/utils/contexts/factories/user", "csui/behaviors/default.action/impl/defaultaction", "csui/utils/contexts/perspective/plugins/node/main.node.extra.data", "csui/utils/contexts/perspective/plugins/node/node.extra.data", "csui/utils/contexts/perspective/plugins/node/utils/merge.extra.data" ], function(_, Context, ConnectorFactory, NextNodeModelFactory, nodeLinks, UserModelFactory, DefaultActionController, mainNodeExtraData, nodeExtraData, mergeExtraData) {
  "use strict";
  var NodeOpeningContext = Context.extend({
    constructor: function NodeOpeningContext(options) {
      Context.prototype.constructor.apply(this, arguments);
      var defaultActionController = new DefaultActionController();
      this.connector = this.getObject(ConnectorFactory, {
        permanent: true,
        detached: true
      });
      this.user = this.getModel(UserModelFactory, {
        permanent: true
      });
      this.nextNode = this.getModel(NextNodeModelFactory, {
        options: {
          delayRestCommands: true,
          defaultActionCommands: defaultActionController.actionItems.getAllCommandSignatures(defaultActionController.commands)
        },
        permanent: true,
        detached: true
      });
      this._setExtraNodeOptions(this.nextNode);
      this.nextNode.on("change:id", function() {
        this._nextNodeOptions || (this._nextNodeOptions = this._setExtraNodeOptions(this.nextNode));
        this.onNextNodeChanged.apply(this, arguments);
      }, this);
    },
    _isFetchable: function(factory) {
      return Context.prototype._isFetchable.apply(this, arguments) && (factory.property !== this.user || !this.user.get("id"));
    },
    openNodePage: function(node) {
      this.triggerMethod("before:open:page", this, this.nextNode);
      window.open(nodeLinks.getUrl(node));
    },
    _setExtraNodeOptions: function(node) {
      var options = {
        fields: mergeExtraData(mainNodeExtraData.getModelFields({
          context: this
        }), nodeExtraData.getModelFields(), {
          "versions.element(0)": [ "mime_type" ]
        }),
        expand: mergeExtraData(mainNodeExtraData.getModelExpand({
          context: this
        }), nodeExtraData.getModelExpand()),
        includeResources: [ "metadata", "perspective" ]
      };
      node.setFields(options.fields);
      node.setExpand(options.expand);
      node.includeResources(options.includeResources);
      return options;
    }
  });
  return NodeOpeningContext;
});