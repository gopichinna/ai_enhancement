/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "csui/controls/form/pub.sub", "i18n!d2/controls/overflow.footer/impl/nls/lang", "hbs!d2/controls/overflow.footer/impl/overflow.footer.button", "css!d2/controls/overflow.footer/impl/overflow.footer.button" ], function($, _, Marionette, PubSub, lang, template) {
  var OverflowMenuItemView = Marionette.ItemView.extend({
    template: false,
    tagName: "otc-menuitem",
    className: "d2-otc-menu-item",
    events: {
      "item-click": "onItemChange",
      mouseenter: "onMouseEnter",
      mouseleave: "onMouseLeave"
    },
    constructor: function OverflowMenuItemView(options) {
      Marionette.ItemView.prototype.constructor.call(this, options);
      this.listenTo(this.model, "change", this.render);
    },
    onRender: function() {
      this.$el.text(this.model.get("name"));
      if (this.model.get("disabled") === true) {
        this.$el.attr("disabled", "disabled");
      } else {
        this.$el.removeAttr("disabled");
      }
    },
    onItemChange: function() {
      this.trigger("click:item", this.model);
    },
    onMouseEnter: function() {
      PubSub.trigger("d2:footer:manageScroll", true);
    },
    onMouseLeave: function() {
      PubSub.trigger("d2:footer:manageScroll", false);
    }
  });
  var OverflowFooterView = Marionette.CompositeView.extend({
    template: template,
    className: "overflow-btn-wrapper",
    childViewContainer: ".d2-otc-menu",
    childView: OverflowMenuItemView,
    childEvents: {
      "click:item": "_onClickItem"
    },
    events: {
      focusout: "_onFocusOut"
    },
    ui: {
      overflowBtn: ".overflow-btn",
      overflowMenu: ".d2-otc-menu"
    },
    childViewOptions: function() {
      return {
        parentView: this
      };
    },
    templateHelpers: function() {
      return {
        title: lang.showMore,
        ariaLabel: lang.showMore
      };
    },
    constructor: function OverflowFooterView(options) {
      Marionette.CompositeView.prototype.constructor.call(this, options);
      this.listenTo(this.options.footerView, "footer:adjust:button", this._closeOverflowMenu);
    },
    _onClickItem: function(childView, childModel) {
      var buttonId = childModel.get("id"), $buttonEl = this.options.footerView.$el.find("otc-button[button-id=" + buttonId + "]");
      $buttonEl.trigger("click");
    },
    _onFocusOut: function(event) {
      if (event.relatedTarget && this.$el.has(event.relatedTarget).length === 0) {
        this._closeOverflowMenu();
      }
    },
    _closeOverflowMenu: function() {
      this.ui.overflowBtn.removeAttr("menuOpen");
      this.ui.overflowMenu.removeAttr("isOpen");
    }
  });
  return OverflowFooterView;
});