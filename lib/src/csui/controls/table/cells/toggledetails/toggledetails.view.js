/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/controls/table/cells/templated/templated.view", "csui/controls/table/cells/cell.registry", "hbs!csui/controls/table/cells/toggledetails/impl/toggledetails", "i18n!csui/controls/table/cells/toggledetails/impl/nls/lang", "css!csui/controls/table/cells/toggledetails/impl/toggledetails", "csui/lib/binf/js/binf" ], function(TemplatedCellView, cellViewRegistry, template, lang) {
  "use strict";
  var ToggleDetailsCellView = TemplatedCellView.extend({
    template: template,
    triggers: {
      "click a": "toggle"
    },
    events: {
      keydown: "onKeyInView"
    },
    getValueData: function() {
      return {
        hasMetadataRow: this.model.get("hasMetadataRow"),
        id: this.model.cid,
        ariaExpanded: this.options.rowIsExpanded ? true : false,
        expandToggleTooltip: this.options.rowIsExpanded ? lang.showLessTooltip : lang.showMoreTooltip,
        expandToggleAria: this.options.rowIsExpanded ? lang.showLessAria : lang.showMoreAria
      };
    },
    onToggle: function(event) {
      var href = this.$("a").attr("href");
      var toToggle = this.$el.parent().parent().find("[id=" + href.replace("#", "") + "]"), self = this;
      if (toToggle.hasClass("binf-collapse")) {
        this.options.rowIsExpanded = false;
        if (toToggle.hasClass("binf-in")) {
          toToggle.binf_collapse().one("hidden.binf.collapse", function() {
            self.trigger("toggle:detailsrow", {
              model: self.model,
              detailsRowIsExpanded: self.options.rowIsExpanded
            });
          });
          toToggle.binf_collapse("hide");
        } else {
          toToggle.binf_collapse("show");
          this.options.rowIsExpanded = true;
          this.trigger("toggle:detailsrow", {
            model: this.model,
            detailsRowIsExpanded: this.options.rowIsExpanded
          });
        }
        this.render();
        this.$("a")[0].focus();
      }
    }
  }, {
    hasFixedWidth: true,
    columnClassName: "csui-table-cell-_toggledetails",
    rowIsExpandedModelAttributeName: "csui-toggledetails-rowIsExpanded",
    widthFactor: 1 / 3
  });
  cellViewRegistry.registerByColumnKey("_toggledetails", ToggleDetailsCellView);
  return ToggleDetailsCellView;
});