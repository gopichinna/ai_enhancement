/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "smart/controls/progresspanel/progresspanel.view.ext", "smart/themes/theming", "csui/themes/csui.jato.status.icons", "csui/controls/globalmessage/message.dialog.mixin", "css!csui/controls/globalmessage/impl/progresspanel/progresspanel-warning-styles.css" ], function(_, SmartProgressPanelViewExt, theming, jatoStatusIcon, MessageDialogMixin) {
  var ProgressPanelViewExt = SmartProgressPanelViewExt.extend({
    constructor: function ProgressPanelViewExt(options) {
      if (options.context && options.nextNodeModelFactory) {
        this._nextNode = options.context.getModel(options.nextNodeModelFactory);
      }
      this.listenTo(this, "navigate:to:location", _.bind(this.onNavigateToLocation, this));
      this.listenTo(this, "abort:progress", _.bind(this.onAbortProgress, this));
      this.listenTo(this, "abort:model:progress", _.bind(this.onAbortModelProgress, this));
      SmartProgressPanelViewExt.prototype.constructor.call(this, options);
    },
    onNavigateToLocation: function(childView) {
      var model = childView ? childView.model : this.collection.models[0], node = model.node;
      var targetLocation = model.get("targetLocation");
      if (targetLocation && this._nextNode) {
        if (node) {
          node.set({
            parent_id: targetLocation.id
          }, {
            silent: true
          });
          this.executeGotoLocation(node);
        } else {
          this._nextNode.set("id", targetLocation.id);
        }
      }
    },
    onAbortProgress: function() {
      this.collection.abort("stopped");
    },
    onAbortModelProgress: function(childView) {
      childView && childView.model.abort();
    },
    updateProgressPanel: function(failedCount) {
      var notificationIcon, allFailures;
      let statusIcon = this.el?.querySelector(".smart-progresspanel-icon");
      if (this.isProgressFailed()) {
        this.$el.removeClass("processing-update");
        this.$el.addClass("processing-error");
        notificationIcon = "csui-global-error";
        allFailures = failedCount === this.collection.length;
      } else {
        let hasContainer = false;
        if (this.options.actionType === "copy") {
          hasContainer = this.collection.models.some(attr => attr.get("container"));
        }
        notificationIcon = hasContainer ? "csui-global-warning" : "csui-global-success";
        if (hasContainer && statusIcon) {
          theming.isJATOTheme() ? statusIcon.innerHTML = jatoStatusIcon.statusWarning : statusIcon.setAttribute("icon", "smart_notification:notification_warning24");
        }
        if (!this.parentView?.$el.find(".smart-progresspanel-wrapper")?.hasClass("binf-hidden")) {
          this.autoHideSuccessBanner();
        }
      }
      this.ui.processingAction.addClass("binf-hidden");
      this.ui.closeAction.parent(".csui-close").removeClass("binf-hidden");
      this.ui.header.find(".csui-minimize").addClass("binf-hidden");
      this.ui.header.find(".csui-progress").addClass("binf-hidden");
      this._isRendered && this.collection.sort();
      this.handleProgressComplete(allFailures);
      this.showretryAll();
      if (this.options.actionType && this.options.actionType === "ADD_VERSION") {
        return;
      }
      this.$el.addClass(notificationIcon);
      if (this.options.actionType === "move" && notificationIcon === "csui-global-success" && this.options.hideGotoLocationSingleSet) {
        this.onNavigateToLocation();
      }
    }
  });
  MessageDialogMixin.mixin(ProgressPanelViewExt.prototype);
  return ProgressPanelViewExt;
});