/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "csui/controls/toolbar/toolitems.mask", "csui/utils/toolitem.masks/global.toolitems.mask", "d2/widgets/workflowstable/workflow.toolbaritems" ], function(module, _, ToolItemMask, GlobalMenuItemsMask, workflowToolItems) {
  "use strict";
  function WorkflowToolbarItemsMasks() {
    this.initializeMasks();
  }
  WorkflowToolbarItemsMasks.prototype.initializeMasks = function() {
    var toolbars = _.keys(workflowToolItems), config = module.config();
    toolbars.push("timelineDigitalSignatureInlineActionBar");
    this.toolbars = _.reduce(toolbars, function(toolbars, toolbar) {
      var mask = new ToolItemMask(new GlobalMenuItemsMask(), {
        normalize: false
      });
      _.each(config, function(source) {
        source = source[toolbar];
        if (source) {
          mask.extendMask(source);
        }
      });
      mask.storeMask();
      toolbars[toolbar] = mask;
      return toolbars;
    }, {});
    WorkflowToolbarItemsMasks.toolbars = toolbars;
  };
  return WorkflowToolbarItemsMasks;
});