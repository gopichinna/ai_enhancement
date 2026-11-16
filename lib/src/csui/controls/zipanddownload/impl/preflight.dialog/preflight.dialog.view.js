/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/controls/dialog/dialog.view", "csui/controls/zipanddownload/impl/dialog.header/dialog.header.view", "i18n!csui/controls/zipanddownload/impl/nls/lang", "hbs!csui/controls/zipanddownload/impl/preflight.dialog/impl/preflight.dialog", "css!csui/controls/zipanddownload/impl/preflight.dialog/impl/preflight.dialog" ], function(DialogView, DialogHeaderView, lang, template) {
  var PreflightDialogView = DialogView.extend({
    className: "csui-zipanddownload-dialog csui-zipanddownload-preflight-dialog csui-preflight-check",
    template: template,
    templateHelpers: function() {
      var jobs = {};
      if (this.options.model.get("results") && this.options.model.get("results").data && this.options.model.get("results").data.jobs) {
        jobs = this.options.model.get("results").data.jobs;
      }
      return {
        itemsExcludedMessage: lang.itemsExcludedMessage,
        skipped: jobs.total_skipped,
        skippedTypes: jobs.skipped_types.map(function(type) {
          return type.name;
        }).join(", ")
      };
    },
    constructor: function PreflightDialogView(options) {
      DialogView.prototype.constructor.call(this, options);
    },
    _renderHeader: function() {
      this.getRegion("header").show(new DialogHeaderView({
        title: lang.preflightDialogTitle
      }));
    }
  });
  return PreflightDialogView;
});