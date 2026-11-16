/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/marionette", "smart/utils/smart.base", "smart/controls/list/behaviors/list.item.keyboard.behavior", "smart/utils/accessibility", "hbs!smart/controls/listitem/impl/listitemstandard", "i18n!smart/controls/list/impl/nls/lang", "css!smart/controls/listitem/impl/listitemstandard" ], function(_, Marionette, smartBase, ListItemKeyboardBehavior, Accessibility, itemTemplate, lang) {
  "use strict";
  var accessibleTable = Accessibility.isAccessibleTable();
  var StandardListItem = Marionette.ItemView.extend({
    tagName: function() {
      return this.showInlineActionBar ? "div" : "a";
    },
    className: function() {
      var classNames = [ "csui-item-standard", "smart-item-standard", "binf-list-group-item" ];
      if (!this.showInlineActionBar) {
        classNames.push("csui-tileview-contains-no-more-btn");
      }
      if (!this.model.get("enableIcon")) {
        classNames.push("smart-item-standard-without-icon");
      }
      return _.unique(classNames).join(" ");
    },
    behaviors: {
      ListItemKeyboardBehavior: {
        behaviorClass: ListItemKeyboardBehavior
      }
    },
    template: itemTemplate,
    templateHelpers: function() {
      return _.reduce(this.options, function(result, name, key) {
        if (typeof name === "string") {
          var value = this._getValue(name);
          if (key === "icon") {
            value = "csui-icon " + value;
            result.enableIcon = true;
          }
          result[key] = value;
        }
        result.name = this.model.get("short_name") || this.model.get("name");
        result.showInlineActionBar = this.showInlineActionBar;
        return result;
      }, {}, this);
    },
    constructor: function StandardListItem(options = {}) {
      if (!!options.toolbarData) {
        this._setInlineActions(options);
      }
      this.context = options.context;
      Marionette.ItemView.call(this, options);
      this.$el.on("click", _.bind(function(event) {
        if (smartBase.isControlClick(event)) {} else {
          event.preventDefault();
          event.stopPropagation();
          this.triggerMethod("click:item");
        }
      }, this));
    },
    _setInlineActions: function(options) {
      this.showInlineActionBar = true;
      this.tileViewToolbarItems = options.toolbarData.toolbaritems;
      this.ui = {
        titleName: ".list-item-title",
        icon: ".csui-icon-group"
      };
      if (!accessibleTable) {
        this.events = {
          mouseenter: "onShowInlineMenu",
          mouseleave: "onHideInlineMenu",
          wheel: "onWheelEvent"
        };
      }
    },
    setElementData: function() {
      var elementData;
      if (this.showInlineActionBar) {
        elementData = this.$el.find("a");
      } else {
        elementData = this.$el;
        elementData.prop("tabindex", "-1");
      }
      return elementData;
    },
    onRender: function() {
      this.triggerMethod("render:icon", ".csui-type-icon");
      var id = this.model?.get("id");
      this.eleData = this.setElementData();
      if (id != null) {
        this.eleData.attr("href", this.model.get("href"));
      }
      if (this.options.refetchNodeActions && this.model) {
        this.model.refetchNodeActions = true;
      }
      if (this.model && this.options?.checkDefaultAction) {
        var disabled = this.model.fetched === false || !this.defaultActionController?.hasAction(this.model);
        this.$el[disabled ? "addClass" : "removeClass"]("inactive");
      }
      this.$el.removeAttr("role");
      if (smartBase.isHybrid()) {
        this.onShowInlineMenu();
      }
      this.$el.attr("role", this.options.childRole || lang.childRole);
    },
    _getValue: function(name) {
      if (name.indexOf("{") === 0) {
        var names = name.substring(1, name.length - 1).split("."), value = this.model.attributes;
        _.find(names, function(name) {
          value = value[name];
          if (value === undefined) {
            return true;
          }
        });
        return value;
      }
      return name;
    },
    onShowInlineMenu: function(event) {
      var self = this;
      var inlineBarElem = this.$el.find(".csui-tileview-more-btn");
      if (smartBase.isHybrid() && (event || !inlineBarElem.length)) {
        return;
      }
      event?.preventDefault();
      event?.stopPropagation();
      this.$el.addClass("csui-tile-with-more-btn");
      const myPromise = new Promise(_.bind(myResolve => {
        myResolve(this.options.getInlinMenuView(self));
      }, this));
      myPromise.then(view => {
        this._inlineMenuView = view;
        var inlineBarRegion = new Marionette.Region({
          el: inlineBarElem
        });
        inlineBarRegion.show(this._inlineMenuView);
        this.listenTo(this._inlineMenuView, "before:execute:command", function(args) {
          this.trigger("before:execute:command", args);
        });
        this.listenTo(this._inlineMenuView, "after:execute:command", function() {
          if (!smartBase.isHybrid()) {
            this.onHideInlineMenu();
          }
        });
      });
    },
    onHideInlineMenu: function(event) {
      if (event && smartBase.isHybrid()) {
        this._inlineMenuView?.inlineMenuBarView?.closeDropdownMenuIfOpen();
        return;
      }
      this.$el.removeClass("csui-tile-with-more-btn");
      if (this._inlineMenuView) {
        this._inlineMenuView.destroy();
        this._inlineMenuView = undefined;
        return true;
      }
    },
    onWheelEvent: function(event) {
      this._inlineMenuView?.closeDropdownMenuIfOpen();
    }
  });
  return StandardListItem;
});