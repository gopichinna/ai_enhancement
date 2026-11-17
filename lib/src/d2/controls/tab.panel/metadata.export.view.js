/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/marionette", "d2/controls/tab.panel/impl/nls/root/lang", "d2/commands/d2-export", "hbs!d2/controls/tab.panel/impl/metadata.export.view", "css!d2/controls/tab.panel/impl/metadata.export.view" ], function(Marionette, lang, commands, template) {
  return Marionette.ItemView.extend({
    className: "d2-icon-audit-export-wg",
    ui: {
      exportButton: ".d2-icon-export"
    },
    events: {
      "click @ui.exportButton": "_exportClicked"
    },
    template: template,
    constructor: function EditMode() {
      Marionette.ItemView.apply(this, arguments);
      this.node = this.options.node;
    },
    templateHelpers: function() {
      return {
        exportAudit: lang.exportAudit,
        reloadAudit: lang.reloadAudit
      };
    },
    _exportClicked: function() {
      commands.prototype.execute(this);
    }
  });
});