/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "csui/utils/command.error", "csui/utils/commandhelper", "csui/utils/commands/node", "d2/commands/vdoc/vdoc.mixin", "d2/models/virtual.document.children", "dctmw/utils/utils", "i18n!d2/commands/nls/localized.strings" ], function(require, _, $, CommandError, CommandHelper, NodeCommand, VDocCommandMixin, VirtualDocumentChildren, utils, lang) {
  "use strict";
  var ViewVirtualDocument = NodeCommand.extend({
    defaults: {
      signature: "D2-ViewVDoc",
      command_key: "D2-ViewVDoc",
      name: lang.CommandViewVDocName,
      scope: "single"
    },
    execute: function(status, options) {
      var dfd = $.Deferred(), me = this;
      require([ "csui/utils/contexts/factories/node" ], function(NodeModelFactory) {
        var context = status.context || options && options.context, node = CommandHelper.getJustOneNode(status) || status.nodes && status.nodes.at(0), id = node && node.get("id"), contextNode = id && context && context.getModel(NodeModelFactory);
        if (contextNode) {
          if (contextNode.origNode) {
            me.stopListening(contextNode.origNode);
          }
          contextNode.origNode = node;
          contextNode.collection = node.collection;
          contextNode.clear({
            silent: true
          });
          contextNode.set(node.attributes, {
            silent: true
          });
          me.listenTo(node, "actionsFetched", function() {
            contextNode.set(contextNode.origNode.attributes, {
              silent: true
            });
            contextNode.trigger("sync");
          });
          contextNode.trigger("sync");
          dfd.resolve(status, options);
        } else {
          dfd.reject(new CommandError(_.str.sformat(lang.CommandViewVDocFailedMessage, node.get("name")), node));
        }
      }, dfd.reject);
      return dfd.promise();
    }
  });
  VDocCommandMixin.mixin(ViewVirtualDocument.prototype);
  return ViewVirtualDocument;
});