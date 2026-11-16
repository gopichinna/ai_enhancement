/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "hbs!smart/controls/bulk.selection/impl/bulk.selection.dropdown.item", "css!smart/controls/bulk.selection/impl/bulk.selection.dropdown.item", "smart/utils/otwc.loader" ], function(_, $, Marionette, dropdownItemTemplate) {
  "use strict";
  var BulkSelectionDropdownItemItemView = Marionette.ItemView.extend({
    tagName: "otc-menuitem",
    template: dropdownItemTemplate,
    triggers: {
      "item-remove": "remove:selected:item"
    },
    ui: {
      iconGroup: ".csui-icon-group"
    },
    attributes: function() {
      return {
        isDeletable: true
      };
    },
    templateHelpers: function() {
      return {
        filename: this.options?.model?.get("name")
      };
    },
    constructor: function BulkSelectionDropdownItemItemView(options = {}) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },
    onRender: function() {
      if (this.options?.getNodeTypeIconView) {
        var iconViewOptions = {
          el: this.el.querySelector(".csui-type-icon"),
          node: this.model
        };
        this._nodeIconView = this.options.getNodeTypeIconView(iconViewOptions);
        this._nodeIconView.render();
      }
    }
  });
  return BulkSelectionDropdownItemItemView;
});