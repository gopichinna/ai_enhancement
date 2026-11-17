/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "hbs!smart/controls/bulk.selection/impl/bulk.selection.dropdown.item", "i18n!smart/controls/bulk.selection/impl/nls/lang", "css!smart/controls/bulk.selection/impl/bulk.selection.dropdown.item", "smart/utils/otwc.loader" ], function(_, $, Marionette, dropdownItemTemplate, lang) {
  "use strict";
  var BulkSelectionDropdownItemItemView = Marionette.ItemView.extend({
    tagName: "otc-menuitem",
    template: dropdownItemTemplate,
    triggers: {
      "item-remove": "remove:selected:item"
    },
    events: {
      keydown: "onKeyInView"
    },
    ui: {
      iconGroup: ".csui-icon-group"
    },
    attributes: function() {
      const filename = this.options.model?.get("name");
      return {
        isDeletable: true,
        deletableIconTitle: lang.unselectTooltip,
        ariaLabel: _.str.sformat(lang.unselectAria, filename)
      };
    },
    templateHelpers: function() {
      return {
        filename: this.options.model?.get("name")
      };
    },
    constructor: function BulkSelectionDropdownItemItemView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },
    onRender() {
      this._createNodeTypeIcon();
    },
    onBeforeDestroy() {
      this._destroyNodeTypeIcon();
    },
    _createNodeTypeIcon: function() {
      this._destroyNodeTypeIcon();
      var iconView = this.options.getNodeTypeIconView({
        node: this.model
      });
      this.cellRegion = new Marionette.Region({
        el: this.$(".csui-type-icon")
      });
      this.cellRegion.show(iconView);
    },
    _destroyNodeTypeIcon: function() {
      if (this.cellRegion) {
        this.cellRegion.empty();
        this.cellRegion = null;
      }
    },
    onKeyInView: function(event) {
      event.preventDefault();
      switch (event.keyCode) {
       case 46:
       case 13:
       case 32:
        this.triggerMethod("remove:selected:item", this, this.model);
        event.preventDefault();
        event.stopPropagation();
        break;

       case 37:
        event.stopPropagation();
        break;

       case 39:
        event.stopPropagation();
        break;
      }
    }
  });
  return BulkSelectionDropdownItemItemView;
});