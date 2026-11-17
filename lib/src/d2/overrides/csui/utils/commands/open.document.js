/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/utils/commands/open.document/open.document", "csui/utils/commandhelper" ], function(OpenDocumentCommand, CommandHelper) {
  "use strict";
  var oldEnabled = OpenDocumentCommand.prototype.enabled;
  OpenDocumentCommand.prototype.enabled = function(status) {
    var enabled = oldEnabled.apply(this, arguments), node = CommandHelper.getJustOneNode(status), permissions = node.get("basePermissions");
    return enabled && permissions && permissions.read === true && !status.nodes.find(node => !node.get("a_content_type"));
  };
});