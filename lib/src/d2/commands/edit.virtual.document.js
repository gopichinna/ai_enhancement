/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "csui/utils/commands/node", "csui/utils/contexts/factories/connector", "csui/utils/commandhelper", "i18n!d2/commands/nls/localized.strings", "d2/models/virtual.document.children", "d2/utils/rest.linkrels", "dctmw/utils/rest.resources", "d2/utils/widget.constants", "d2/utils/vdoc.utils", "d2/commands/open.virtual.document" ], function(require, _, $, NodeCommand, ConnectorFactory, CommandHelper, lang, VirtualDocumentChildren, RestLinkrels, RestResources, widgetConstants, vdUtil, OpenVirtualDocument) {
  "use strict";
  var EditVirtualDocument = OpenVirtualDocument.extend({
    defaults: {
      signature: "D2-EditVDoc",
      command_key: "D2-EditVDoc",
      name: lang.CommandNameEditVDoc,
      scope: "single"
    },
    enabled: function(status, options) {
      var node = CommandHelper.getJustOneNode(status);
      if (node && node.actions?.find({
        signature: "D2-EditVDoc"
      })) {
        return OpenVirtualDocument.prototype.enabled.call(this, status, options);
      }
      return false;
    },
    execute: function(status, options) {
      status.isVdocFrom = "EditVdoc";
      return OpenVirtualDocument.prototype.execute.call(this, status, options);
    }
  });
  return EditVirtualDocument;
});