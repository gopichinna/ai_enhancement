/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/marionette", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "csui/controls/node-type.icon/node-type.icon.view", "hbs!d2/dialogs/reserve/impl/confirm.view", "i18n!d2/dialogs/reserve/impl/nls/lang" ], function($, Marionette, TabableRegionBehavior, NodeTypeIconView, template, lang) {
  "use strict";
  return Marionette.ItemView.extend({
    template: template,
    behaviors: {
      TabableRegionBehavior: {
        behaviorClass: TabableRegionBehavior
      }
    },
    ui: {
      checkoutItemDetailRow: ".checkout-item-detail-row"
    },
    templateHelpers: function() {
      return {
        lang: lang,
        checkoutItems: this.options.checkoutItems,
        moreThanOneItem: this.options.checkoutItems && this.options.checkoutItems.length > 1
      };
    },
    constructor: function ConfirmView(options) {
      options = options || {};
      if (!options.checkoutItems || !options.checkoutItems.length) {
        throw Error("checkoutItems list must be provided in the options");
      }
      Marionette.ItemView.prototype.constructor.call(this, options);
    },
    onRender: function() {
      this._renderIconViews();
    },
    _renderIconViews: function() {
      var self = this;
      this.ui.checkoutItemDetailRow.each(function(index, checkoutItemDetailRow) {
        var iconView = new NodeTypeIconView({
          el: $(checkoutItemDetailRow).find("td.type span").get(0),
          node: self.options.checkoutItems[index].node
        });
        iconView.render();
      });
    },
    isTabable: function() {
      return this.$el.find(".remove-item").length > 0;
    },
    currentlyFocusedElement: function(event) {
      var tabElements = this.$el.find(".remove-item");
      tabElements.prop("tabindex", "0");
      return event && event.shiftKey ? tabElements.last() : tabElements.first();
    },
    onLastTabElement: function(shiftTab, event) {
      return shiftTab && event.target === this.$(".remove-item")[0];
    }
  });
});