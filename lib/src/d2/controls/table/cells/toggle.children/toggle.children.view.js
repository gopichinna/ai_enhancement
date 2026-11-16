/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/controls/table/cells/templated/templated.view", "csui/controls/table/cells/cell.registry", "hbs!d2/controls/table/cells/toggle.children/impl/toggle.children", "css!d2/controls/table/cells/toggle.children/impl/toggle.children" ], function(TemplatedCellView, cellViewRegistry, template) {
  "use strict";
  var ToggleChildrenView = TemplatedCellView.extend({
    template: template,
    triggers: {
      "click @ui.icon": "toggle"
    },
    ui: {
      loadingContainer: ".csui-loading-parent-wrapper",
      toggler: ".expand-tree-row-toggle",
      icon: ".toggle-icon"
    },
    events: {
      keydown: "onKeyInView"
    },
    constructor: function ToggleChildrenView(options) {
      options = options || {};
      options.childExpanded = options.model && options.model.get("childExpanded");
      TemplatedCellView.prototype.constructor.apply(this, arguments);
      this.listenTo(this.model, "d2:tree:expanding:nodes", function() {
        this.ui.loadingContainer.removeClass("binf-hidden");
        this.ui.toggler.addClass("binf-hidden");
      });
      this.listenTo(this.model, "d2:remove:toggler", function() {
        this.ui.toggler.addClass("binf-hidden");
        this.ui.loadingContainer.addClass("binf-hidden");
      });
    },
    getValueData: function() {
      return {
        hasChildren: !!this.model.hasTreeChildNodes,
        expanded: this.options.childExpanded ? true : false,
        expandToggleTooltip: this.options.childExpanded ? "Collapse" : "Expand",
        expandToggleAria: this.options.childExpanded ? "Collapse" : "Expand",
        expanding: !!this.model.get("expandingNodes")
      };
    },
    onToggle: function() {
      this.options.childExpanded = !this.options.childExpanded;
      this.model.collection.trigger("toggle:children", this, this.model);
    }
  }, {
    hasFixedWidth: true,
    columnClassName: "d2-table-cell-toggle-children"
  });
  cellViewRegistry.registerByColumnKey("d2_toggle_children", ToggleChildrenView);
  return ToggleChildrenView;
});