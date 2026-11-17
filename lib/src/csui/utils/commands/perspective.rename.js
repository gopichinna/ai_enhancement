/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/models/perspective.command", "csui/perspective.manage/impl/landing.page.pman.constants" ], function(PerspectiveCommand, PmanConstants) {
  "use strict";
  const PerspectiveDeleteCommand = PerspectiveCommand.extend({
    defaults: {
      signature: "PerspectiveRename"
    },
    beforeExecute: async function() {
      await PerspectiveCommand.prototype.beforeExecute.apply(this, arguments);
      if (this.view.model.collection.modifiedCount >= PmanConstants.MAX_THRESHOLD && this.view.model.has("hasOnlybasicPerspectiveInfo")) {
        await this.view.options.originatingView.promptToSaveModifiedPerspectives(this.view.model);
        throw "";
      }
    },
    execute: function(status, options) {
      options.eventData.view.triggerMethod("click:perspective:name", options);
    }
  });
  return PerspectiveDeleteCommand;
});