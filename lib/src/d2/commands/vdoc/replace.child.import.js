/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "d2/controls/globalmessage/globalmessage", "csui/utils/commands/node", "csui/utils/commandhelper", "d2/commands/vdoc/add.children.import", "d2/commands/vdoc/vdoc.mixin", "d2/utils/vdoc.creation.utils", "d2/utils/vdoc.utils", "nuc/models/node/node.model", "i18n!d2/commands/nls/localized.strings" ], function(_, $, GlobalMessage, NodeCommand, CommandHelper, VDocAddChildImportCommand, VDocCommandMixin, VdocCreationUtils, VdocUtils, NodeModel, lang) {
  "use strict";
  var VDocReplaceChildImport = VDocAddChildImportCommand.extend({
    defaults: {
      signature: "D2-VDocReplaceChildImport",
      command_key: "D2-VDocReplaceChildImport",
      name: lang.CommandVDocReplaceChildImport,
      scope: "single"
    },
    execute: function(status, options) {
      options = options || {};
      options.singleFileUpload = true;
      options.replaceOperation = true;
      return VDocAddChildImportCommand.prototype.execute.call(this, status, options);
    },
    performVdocOperation: function(status, options) {
      var dfd = $.Deferred(), me = this, parentNode = new NodeModel({
        id: VdocUtils.getParentVDId(status.nodes.models[0])
      }, {
        connector: status.context.getObject("connector")
      });
      status.parent = parentNode;
      parentNode.ensureFetched().done(function() {
        VdocCreationUtils.replaceVdChild(status, options.childNodes[0], me.get("signature")).done(function(data) {
          GlobalMessage.showMessage("success", _.str.sformat(lang.ReplaceChildSuccessMessage, status.nodes.models.at(0).get("name"), data.properties.object_name));
          dfd.resolve(data);
        }).fail(function(err) {
          GlobalMessage.showMessage("error", lang.ReplaceChildErrorMessage);
          dfd.reject(err);
        });
      });
      return dfd.promise();
    },
    getDefaultErrorMessage: function() {
      return lang.ReplaceChildErrorMessage;
    }
  });
  VDocCommandMixin.mixin(VDocReplaceChildImport.prototype);
  return VDocReplaceChildImport;
});