/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/controls/table/cells/templated/templated.view", "i18n!csui/controls/table/impl/nls/lang", "hbs!csui/controls/table/cells/text/impl/text", "css!csui/controls/table/cells/text/impl/text" ], function(TemplatedCellView, lang, template) {
  var TextCellView = TemplatedCellView.extend({
    className: "csui-truncate",
    template: template,
    renderValue: function() {
      var text = this.getValueText();
      var isEmpty = text === undefined || text.length === 0;
      var html = this.template({
        value: text,
        isEmpty: isEmpty
      });
      this.$el.html(html);
    }
  }, {
    hasFixedWidth: false,
    columnClassName: "csui-table-cell-generic-text"
  });
  return TextCellView;
});