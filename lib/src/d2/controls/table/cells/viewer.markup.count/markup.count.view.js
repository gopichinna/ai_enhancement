/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "csui/controls/table/cells/cell/cell.view", "csui/controls/table/cells/cell.registry", "hbs!d2/controls/table/cells/viewer.markup.count/impl/markups.count.view", "i18n!d2/controls/table/cells/viewer.markup.count/impl/nls/lang", "css!d2/controls/table/cells/viewer.markup.count/impl/markups.count.view" ], function(_, Backbone, CellView, cellViewRegistry, template, lang) {
  "use strict";
  var ViewerMarkupCountCellView = CellView.extend({
    template: template,
    className: "csui-nowrap",
    needsAriaLabel: true,
    constructor: function ViewerMarkupCountCellView() {
      CellView.prototype.constructor.apply(this, arguments);
    },
    renderValue: function() {
      var tmplData = {
        data: this.options.column ? CellView.getValue(this.model, this.options.column) : "",
        title: this.getTitleText()
      };
      var html = "";
      if (tmplData.data > 0) {
        tmplData.data = "" + tmplData.data;
        html = this.template(tmplData);
      }
      this.$el.html(html);
    },
    getTitleText: function() {
      var data = this.options.column ? CellView.getValue(this.model, this.options.column) : 0;
      if (data > 1) {
        return _.str.sformat(lang.markupTitleMultiple, data);
      }
      return _.str.sformat(lang.markupTitleSingle, data);
    },
    ensureOriginatingView: function() {
      if (!this.commandStatus.originatingView) {
        this.commandStatus.originatingView = this.options.tableView && this.options.tableView.options && this.options.tableView.options.originatingView;
      }
    }
  }, {
    permanentColumn: true,
    flexibleWidth: true,
    columnClassName: "d2-table-cell-viewer-markup-count"
  });
  cellViewRegistry.registerByColumnKey("viewer_markup_count", ViewerMarkupCountCellView);
  return ViewerMarkupCountCellView;
});