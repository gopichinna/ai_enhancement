/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/jquery", "csui/lib/underscore", "csui/lib/marionette3", "csui/utils/contexts/factories/branding.config.factory" ], function($, _, Marionette, BrandingConfigFactory) {
  "use strict";
  let ProgressPanelView = Marionette.View.extend({
    template: false,
    constructor: function ProgressPanelView(options = {}) {
      Marionette.View.prototype.constructor.apply(this, arguments);
      this.from = 0;
      this.to = 0;
      this.listenTo(this, "get:progress", this._setProgress);
      this.listenTo(this, "processbar:minimize", this._minimizeProgressbar);
      this.otcData = {
        slot: "unknown",
        state: "default"
      };
      this.progressValues = {
        from: 0,
        to: 1
      };
      this.brandingConfigData = this.options.context.getModel(BrandingConfigFactory);
      this.trigger("data:synced");
      this.trigger("update:progress:values", this.progressValues);
    },
    onShow: function() {
      this.options.otcEl.addEventListener("click", _.bind(this._maximizeProgressbar, this));
      this.options.otcEl.addEventListener("keydown", _.bind(this._maximizeProgressbar, this));
    },
    _setProgress: function(percentage, state) {
      if (state === "rejected") {
        this.otcData.state = "error";
        this._progressComplete();
      } else if (state === "resolved") {
        this.otcData.state = "finished";
        this.progressValues.to = 100;
        this._progressComplete();
      } else if (percentage !== this.progressValues.to) {
        this.progressValues.from = this.progressValues.to;
        this.progressValues.to = percentage;
        if (percentage === 100) {
          this.otcData.state = "finished";
          this._progressComplete();
        } else {
          this.otcData.state = "default";
          this.trigger("update:progress:values", this.progressValues);
        }
      }
    },
    _minimizeProgressbar: function() {
      this.otcData.slot = "beforeOverflow";
      this.trigger("data:synced");
      this.trigger("update:progress:values", this.progressValues);
    },
    _progressComplete: function() {
      this.trigger("data:synced");
      this.trigger("update:progress:values", this.progressValues);
      setTimeout(() => {
        this.otcData.slot = "unknown";
        this.otcData.state = "default";
        this.trigger("data:synced");
        this.progressValues.from = 0;
        this.progressValues.to = 1;
        this.trigger("update:progress:values", this.progressValues);
        this.trigger("processbar:maximize");
      }, 1e3);
    },
    _maximizeProgressbar: function(event) {
      if (event.type === "click" || event.keyCode === 13 || event.keyCode === 32) {
        this.otcData.slot = "unknown";
        this.trigger("data:synced");
        this.trigger("processbar:maximize");
      }
    }
  });
  return ProgressPanelView;
});