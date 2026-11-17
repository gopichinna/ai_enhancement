/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/lib/marionette", "csui/controls/toolbar/otctoolbar/otctoolitem.view", "csui/utils/base", "csui/controls/mixins/view.state/toolitems.state.mixin", "smart/themes/theming", "smart/controls/icons.v2/icons.v2", "hbs!csui/controls/toolbar/otctoolbar/impl/flyout.toolitem", "hbs!csui/controls/tableactionbar/impl/lazy.loading.template", "i18n!csui/controls/toolbar/otctoolbar/impl/nls/localized.strings" ], function(_, $, Marionette, OTCToolItemView, base, ToolItemsStateMixin, theming, IconsV2, template, lazyLoadingTemplate, lang) {
  "use strict";
  var OTCFlyoutToolItemView = Marionette.CollectionView.extend({
    tagName: "otc-toolbaritem",
    className: "",
    attributes: function() {
      let attrs = {
        arialabel: this.model.get("name"),
        title: this.model.get("name"),
        value: this.model.get("name"),
        usePopover: "true"
      };
      let signature = this.model.get("signature") || "";
      if (this.model.isSeparator()) {
        attrs["aria-hidden"] = "true";
      } else {
        attrs["data-csui-command"] = signature.toLowerCase();
        if (this.options.role) {
          attrs.role = this.options.role;
        } else {
          attrs.role = "none";
        }
        if (this.model.get("iconSVG") && theming.isJATOTheme()) {
          attrs["svg"] = this.model.get("iconSVG");
        } else {
          attrs["icon"] = IconsV2.getSmartIconNameByV2IconName(this.model.get("iconName"));
          attrs["iconappearance"] = this.options.useIconsForDarkBackground ? "light" : "dark";
        }
      }
      return attrs;
    },
    templateHelpers: function() {
      var command = this.options.command;
      return {
        name: this.model.get("name"),
        renderIconAndText: this.options.renderIconAndText === true,
        renderTextOnly: this.options.renderTextOnly === true,
        expandTitle: lang.showMoreLabel,
        toolItemAria: this.model.get("toolItemAria"),
        hasToolItemAriaExpand: this.model.get("toolItemAriaExpand") !== undefined,
        toolItemAriaExpand: this.model.get("toolItemAriaExpand"),
        hasIcon: this._hasIcon(),
        icon: this._icon,
        iconName: this._iconName,
        iconStateIsOn: this._stateIsOn,
        iconTheme: this.options.useIconsForDarkBackground ? "dark" : "",
        disabledClass: command && command.get("selfBlockOnly") && command.get("isExecuting") ? "binf-disabled" : "",
        title: !!this.model.get("title") ? this.model.get("title") : this.model.get("name"),
        linkRole: this.options.noMenuRoles ? undefined : "menuitem"
      };
    },
    childViewContainer: "otc-toolbaritem",
    getChildView: function(item) {
      return item.toolItems && item.toolItems.length ? OTCFlyoutToolItemView : OTCToolItemView;
    },
    childViewOptions: function() {
      return {
        renderTextOnly: true
      };
    },
    childEvents: {
      "toolitem:action": function(childView, args) {
        this.triggerMethod("toolitem:action", args);
      }
    },
    ui: {
      link: "a.csui-toolitem"
    },
    events: {
      "click @ui.link": "activeSubmenu"
    },
    constructor: function OTCFlyoutToolItemView(options) {
      this.options = options || {};
      this.collection = options.collection || options.model && options.model.toolItems;
      this.model = this.options.model;
      this._calculateIconName();
      Marionette.CollectionView.prototype.constructor.apply(this, arguments);
      this.listenTo(this.collection, "add change reset", function(models) {
        if (this.el && this.el.offsetWidth > 0 && this.el.offsetHeight > 0) {
          return;
        } else {
          this._calculateIconName();
          this.render();
        }
        this.el.querySelector("otc-toolbarplaceholder")?.remove();
      });
    },
    onRender: function() {
      if (!this.collection.length && this.options.isInlineActionToolItem) {
        this.el.insertAdjacentHTML("beforeend", lazyLoadingTemplate());
      }
    },
    onKeyInView: function(event) {
      if (event.keyCode === 13) {
        this._handleClick(event);
        return false;
      }
    },
    activeSubmenu: function(event) {
      if (base.isAppleMobile() || base.isMacintosh()) {
        var active = $(event.target).attr("aria-expanded") === "true" ? true : false, submenuParent = this.$el.parent("ul.binf-dropdown-menu");
        if (!active) {
          submenuParent.addClass("csui-submenu-active");
        } else {
          submenuParent.removeClass("csui-submenu-active");
        }
      }
    },
    saveRenderState: function() {
      this._renderState = {};
      _.each(OTCFlyoutToolItemView.STATE_PARAMS, function(param) {
        this._renderState[param] = this.options[param];
      }, this);
    },
    restoreRenderState: function() {
      if (this._renderState) {
        _.each(OTCFlyoutToolItemView.STATE_PARAMS, function(param) {
          this.options[param] = this._renderState[param];
        }, this);
        this.render();
        delete this._renderState;
      }
    }
  }, {
    STATE_PARAMS: [ "renderIconAndText", "renderTextOnly" ]
  });
  _.extend(OTCFlyoutToolItemView.prototype, ToolItemsStateMixin);
  return OTCFlyoutToolItemView;
});