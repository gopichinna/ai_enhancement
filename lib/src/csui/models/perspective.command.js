/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "csui/lib/backbone", "csui/models/command" ], function(require, Backbone, Command) {
  "use strict";
  const PerspectiveCommand = Command.extend({
    constructor: function PerspectiveCommand(attributes, options) {
      Command.prototype.constructor.apply(this, arguments);
    },
    beforeExecute: async function(status, options) {
      const BlockingView = await require("csui/controls/progressblocker/blocker");
      BlockingView.imbue(this);
      this.blockingView.showloadingWheel = true;
      this.blockActions();
      this.view = options.eventData?.view;
      if (this.view.model.get("hasOnlybasicPerspectiveInfo")) {
        const perspectiveInfo = await this.view.fetchPerspective();
        const pModel = new Backbone.Model(perspectiveInfo);
        if (this.view.isPersonalizeMode) await this.view.updatePersonalizeModel(pModel); else this.view.updatePerspectiveModel(pModel);
      }
    },
    afterExecute: async function(status, options) {
      this.unblockActions();
    }
  });
  return PerspectiveCommand;
});