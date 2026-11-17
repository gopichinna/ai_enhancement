/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "smart/controls/app.header/app.header.view", "csui/controls/app.header/burger.menu/burger.menu", "i18n!csui/pages/start/impl/nls/lang", "csui/utils/commonconfig.util" ], function(AppHeaderView, BurgerMenuItems, lang, CommonConfigUtil) {
  "use strict";
  const CSUIAppHeaderView = AppHeaderView.extend({
    initialize: function() {
      this.on("request:data", this.getAllMenuItems.bind(this));
    },
    onBeforeAttach: function() {
      this._showSystemMessage();
    },
    _showSystemMessage: function() {
      const shownSystemMsg = localStorage.getItem("shownSystemMsg");
      const self = this;
      if (!shownSystemMsg) {
        localStorage.setItem("shownSystemMsg", true);
        if (CommonConfigUtil.enableFeatureInSmartView()) {
          require([ "csui/models/system.messages/system.message.server.adaptor.mixin" ], function(Mix) {
            Mix.mixin(AppHeaderView.prototype);
            const server = AppHeaderView.prototype.makeServerAdaptor(self.options.context?._factories?.connector?.property);
            server.parseResponse(lang);
          });
        }
      }
    },
    getAllMenuItems: function() {
      BurgerMenuItems.getAllMenuItems({
        context: this.options.context,
        connector: this.options.connector
      }).then(this.syncData.bind(this));
    },
    syncData: function(panel) {
      this.trigger("sync:data", panel);
    }
  });
  return CSUIAppHeaderView;
});