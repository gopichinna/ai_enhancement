/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "csui/utils/commands/node", "csui/utils/command.error", "csui/utils/commandhelper", "i18n!d2/commands/nls/localized.strings", "d2/models/virtual.document.children", "d2/utils/rest.linkrels", "dctmw/utils/rest.resources", "d2/utils/widget.constants", "d2/utils/vdoc.utils" ], function(require, _, $, NodeCommand, CommandError, CommandHelper, lang, VirtualDocumentChildren, RestLinkrels, RestResources, widgetConstants, vdUtil) {
  "use strict";
  var OpenVirtualDocument = NodeCommand.extend({
    defaults: {
      signature: "D2-OpenVDoc",
      command_key: "D2-OpenVDoc",
      name: lang.CommandNameOpenVDoc,
      scope: "single"
    },
    enabled: function(status, options) {
      var userDefaultWidgets = RestResources.getCurrentUser().get("defaultWidgets"), userHasDefaultVDWidget = !!userDefaultWidgets[widgetConstants.DEFAULT.VDOC];
      if (userHasDefaultVDWidget && status.nodes && status.nodes.length === 1) {
        var node = CommandHelper.getJustOneNode(status), collection = node.collection;
        if (node && vdUtil.isVirtualDoc(node) && (!(collection instanceof VirtualDocumentChildren) || !collection.perspectiveNode || collection.perspectiveNode.get("id") !== node.get("id"))) {
          return NodeCommand.prototype.enabled.call(this, status, options);
        }
      }
      return false;
    },
    execute: function(status, options) {
      var deferred = $.Deferred(), me = this, commandCollection = me.collection;
      status.suppressFailMessage = true;
      status.suppressSuccessMessage = true;
      require([ "d2/utils/contexts/factories/virtual.document.factory" ], function(VDFactory) {
        var context = status.context || options && options.context, virtualDocument = context.getModel(VDFactory), node = CommandHelper.getJustOneNode(status) || status.nodes && status.nodes.at(0), container = status.container, propertiesCommand = commandCollection.get("Properties");
        node = node.clone();
        node.fetched = me.isAlreadyFetched(node);
        virtualDocument.set("vd_info", {
          id: node.get("id"),
          model: node,
          container: container,
          originatingView: status.originatingView,
          replaceLastUrl: options && options.replaceLastUrl,
          isVdocFrom: status.isVdocFrom ? status.isVdocFrom : "OpenVdoc"
        });
        propertiesCommand && propertiesCommand.dialog && propertiesCommand.dialog.kill();
        deferred.resolve(status, options);
      }, deferred.reject);
      return deferred.promise();
    },
    isAlreadyFetched: function(node) {
      return !!RestLinkrels.getLink(node.get("links"), RestLinkrels.VD_NODE_CHILDREN);
    }
  });
  return OpenVirtualDocument;
});