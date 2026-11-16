/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/utils/base", "csui/controls/list/list.view" ], function(base, ListView) {
  let origRender = ListView.prototype.onRender;
  ListView.prototype.onRender = function() {
    origRender.apply(this, arguments);
    if (base.isHybrid() && this._enableOpenPerspective) {
      if (base.isAppleMobile()) {
        this._addActivationEventHandlers();
      }
      this.$el.removeClass("cs-no-expanding");
    }
  };
});