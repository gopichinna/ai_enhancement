/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "csui/utils/commandhelper", "csui/controls/toolbar/toolitem.view" ], function($, _, CommandHelper, ToolItemView) {
  "use strict";
  var originalTempateHelper = ToolItemView.prototype.templateHelpers;
  ToolItemView.prototype.templateHelpers = function() {
    var self = this, templateHelperData = originalTempateHelper.apply(this, arguments);
    if (self.model && self.model.status && self.model.status.nodes && self.model.status.nodes.models && self.model.status.nodes.models.length > 0) {
      _.each(self.model.status.nodes.models, function(model) {
        var actionModel = CommandHelper.getOriginalAction(model, self.model.get("signature"), self.model.get("commandData"));
        if (actionModel) {
          var actionProperties = actionModel.get("actionProperties");
          if (actionProperties) {
            if (actionProperties.name) {
              templateHelperData.name = $("<textarea/>").html(actionProperties.name).text();
            }
            if (actionProperties.toolTip) {
              templateHelperData.title = $("<textarea/>").html(actionProperties.toolTip).text();
            }
          }
        }
      });
    }
    return templateHelperData;
  };
  ToolItemView.prototype.attributes = function() {
    var attrs = {};
    if (this.model.isSeparator()) {
      attrs["aria-hidden"] = "true";
    } else {
      var signature = this.model.get("signature") || "";
      attrs["data-csui-command"] = signature.toLowerCase();
      if (signature.toLowerCase() === "add") {
        attrs["data-csui-addtype"] = this.model.get("commandData").type;
      } else if (this.model.get("commandData") && !!this.model.get("commandData").dynamic) {
        attrs["data-csui-command"] = signature.toLowerCase() + "_" + this.model.cid;
      }
      if (this.options.role) {
        attrs.role = this.options.role;
      } else {
        attrs.role = "none";
      }
    }
    return attrs;
  };
});