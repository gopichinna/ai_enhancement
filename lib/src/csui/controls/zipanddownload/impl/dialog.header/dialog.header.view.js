/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/controls/dialog/impl/header.view", "csui/utils/base", "i18n!csui/controls/zipanddownload/impl/nls/lang", "hbs!csui/controls/zipanddownload/impl/dialog.header/impl/dialog.header", "css!csui/controls/zipanddownload/impl/dialog.header/impl/dialog.header" ], function(_, DialogHeaderView, base, lang, template) {
  var HeaderView = DialogHeaderView.extend({
    template: template,
    ui: {
      header: ".zip-download-header"
    },
    templateHelpers: function() {
      return {
        title: this.options.title,
        itemCountExists: this.options.hasOwnProperty("itemsCount") && this.options.itemsCount > 0,
        itemsCount: this.options.hasOwnProperty("itemsCount") ? _.str.sformat(this.options.itemsCount === 1 ? lang.itemCount : lang.itemsCount, this.options.itemsCount) : "",
        size: this.options.size ? base.formatFriendlyFileSize(this.options.size * 1024) : "",
        describedBy: this.options.describedBy
      };
    },
    constructor: function HeaderView(options) {
      DialogHeaderView.prototype.constructor.call(this, options);
    },
    onRender: function() {
      if (this.options.source === "downloadZip") {
        this.ui.header.addClass("csui-heading-v2");
      } else {
        this.ui.header.addClass("csui-heading");
      }
    }
  });
  return HeaderView;
});