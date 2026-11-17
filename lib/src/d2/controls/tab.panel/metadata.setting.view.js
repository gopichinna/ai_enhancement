/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/marionette", "d2/controls/tab.panel/impl/nls/root/lang", "hbs!d2/controls/tab.panel/impl/metadata.setting.view", "css!d2/controls/tab.panel/impl/metadata.setting.view" ], function(Marionette, lang, template) {
  return Marionette.ItemView.extend({
    className: "d2-icon-audit-wg",
    ui: {
      refreshButton: ".d2-icon-refresh"
    },
    events: {
      "click @ui.refreshButton": "_refreshClicked"
    },
    template: template,
    constructor: function EditMode() {
      Marionette.ItemView.apply(this, arguments);
      this.node = this.options.node;
    },
    templateHelpers: function() {
      return {
        reloadAudit: lang.reloadAudit,
        exportAudit: lang.exportAudit
      };
    },
    _refreshClicked: function() {
      this.options.collection.fetch({
        reload: true,
        skipSWCache: true
      });
    }
  });
});