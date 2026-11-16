/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/models/node/node.model", "d2/utils/constants", "d2/utils/widget.constants" ], function(NodeModel, constants, widgetConstants) {
  "use strict";
  return NodeModel.extend({
    constructor: function TaskFileModel(attributes, options) {
      options = options || {};
      options.d2ActionsOptions = options.d2ActionsOptions || {
        menuType: constants.MenuTypes.TASK_DOCUMENTS,
        widgetType: widgetConstants.D2.TASK_ATTACHMENTS
      };
      options.delayedActionsOptions = options.d2ActionsOptions;
      options.nonPromotedActionsOptions = options.d2ActionsOptions;
      NodeModel.prototype.constructor.apply(this, arguments);
      this.widgetType = widgetConstants.D2.TASK_ATTACHMENTS;
    }
  });
});