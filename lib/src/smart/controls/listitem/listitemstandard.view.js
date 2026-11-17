/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "smart/utils/smart.base", "smart/controls/list/behaviors/list.item.keyboard.behavior", "smart/utils/accessibility", "hbs!smart/controls/listitem/impl/listitemstandard", "hbs!smart/controls/listitem/impl/listitemstandardmimeicon", "i18n!smart/controls/listitem/impl/nls/lang", "css!smart/controls/listitem/impl/listitemstandard" ], function(_, Backbone, Marionette, smartBase, ListItemKeyboardBehavior, Accessibility, itemTemplate, iconTemplate, lang) {
  "use strict";
  var accessibleTable = Accessibility.isAccessibleTable();
  var selectedItemsInList = new Backbone.Collection();
  var StandardListItem = Marionette.ItemView.extend({
    tagName: function() {
      return this.showInlineActionBar ? "div" : "a";
    },
    className: function() {
      var classNames = [ "csui-item-standard smart-item-standard binf-list-group-item" ];
      if (!!this.options.className) {
        classNames.push(this.options.className);
      }
      if (!this.showInlineActionBar) {
        classNames.push("csui-tileview-contains-no-more-btn");
      }
      if (!this.options.enableIcon) {
        classNames.push("smart-item-standard-without-icon");
      }
      if (this.options.enableSelection) {
        classNames.push("smart-item-standard-with-selection");
      }
      if (this.model?.get("selected")) {
        classNames.push("smart-listitem-selected");
      }
      return _.unique(classNames).join(" ");
    },
    attributes: function() {
      var attrs = {
        role: this?.options?.childRole || "option"
      };
      if (!this.showInlineActionBar) {
        attrs.href = "#";
      }
      if (this.options?.enableSelection && lang.itemSelectionAria) {
        attrs["aria-label"] = _.str.sformat(lang.itemSelectionAria, this.model.get("name"));
      }
      if (this.model?.get("selected")) {
        attrs["aria-selected"] = true;
        attrs["aria-label"] = _.str.sformat(lang.itemSelectedAria, this.model.get("name"));
      }
      if (this.options?.enableSelection && this.options?.enableSecondaryText && this.model?.get("secondaryText")) {
        attrs["aria-describedby"] = "secTextId" + this.model.cid;
      }
      return attrs;
    },
    behaviors: {
      ListItemKeyboardBehavior: {
        behaviorClass: ListItemKeyboardBehavior
      }
    },
    template: itemTemplate,
    templateHelpers: function() {
      let messages = _.reduce(this.options, function(result, name, key) {
        if (typeof name === "string") {
          var value = this._getValue(name);
          if (this.options.enableIcon && key === "icon") {
            value = "csui-icon " + value;
          }
          result[key] = value;
        }
        result.name = this.model?.get("short_name") || this.model?.get("name");
        result.showInlineActionBar = this.showInlineActionBar;
        result.enableIcon = this.options.enableIcon;
        result.isSingleSelect = !this.options.selectMultiple;
        result.enableSelection = this.options.enableSelection ?? false;
        result.enableSecondaryText = this.options.enableSecondaryText ?? false;
        const secondaryText = this.model?.get("secondaryText");
        result.enableSecText = !!secondaryText?.length;
        result.secText = secondaryText;
        result.secTextId = "secTextId" + this.model.cid;
        result.selected = this.model?.get("selected");
        this.options.enableIcon && (result["addIconClass"] = !_.isFunction(this.options.getIconView));
        return result;
      }, {}, this);
      const childHelpers = _.isFunction(this.getChildTemplateHelpers) ? this.getChildTemplateHelpers.call(this) : this.options?.childTemplateHelpers;
      return _.extend({}, messages, childHelpers);
    },
    constructor: function StandardListItem(options = {}) {
      options.enableIcon = options.enableIcon ?? true;
      if (options?.defaultActionBehavior) {
        this.behaviors = _.extend(this.behaviors, {
          DefaultAction: options.defaultActionBehavior
        });
      }
      if (!!options.toolbarData) {
        this._setInlineActions(options);
      }
      this.context = options.context;
      if (!selectedItemsInList?.length && !options?.selectMultiple) {
        selectedItemsInList?.reset([]);
      }
      Marionette.ItemView.call(this, options);
      this.$el.on("click", _.bind(function(event) {
        const target = event.target;
        if (target.closest?.(".smart-listitem-checkbox")) {
          return false;
        }
        if (smartBase.isControlClick(event)) {} else {
          event.preventDefault();
          event.stopPropagation();
          this.triggerMethod("click:item");
        }
      }, this));
    },
    _updateClasses: function() {
      if (!this.showInlineActionBar) {
        this.el.classList.add("csui-tileview-contains-no-more-btn");
      }
      if (!this.options.enableIcon) {
        this.el.classList.add("smart-item-standard-without-icon");
      }
    },
    _setInlineActions: function(options) {
      this.showInlineActionBar = true;
      this.tileViewToolbarItems = options.toolbarData.toolbaritems;
      if (!accessibleTable) {
        this.events = {
          mouseenter: "onShowInlineMenu",
          focus: "onShowInlineMenu",
          mouseleave: "onHideInlineMenu",
          blur: "onHideInlineMenu",
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
      this.options.enableIcon && this._renderIconView();
      var id = this.model?.get("id");
      this.eleData = this.setElementData();
      if (id != null) {
        this.eleData.attr("href", this.model?.get("href"));
      }
      if (this.options.refetchNodeActions && this.model) {
        this.model.refetchNodeActions = true;
      }
      if (this.model && this.options?.checkDefaultAction) {
        var disabled = this.model.fetched === false || !this.defaultActionController?.hasAction(this.model);
        this.$el[disabled ? "addClass" : "removeClass"]("inactive");
      }
      if (smartBase.isHybrid()) {
        this.onShowInlineMenu();
      }
      if (this.options?.enableSelection) {
        if (!this.boundInputChangeonCheckbox) {
          this.boundInputChangeonCheckbox = this.onChangeValue.bind(this);
        }
        const checkbox = this.el.querySelector(".smart-listitem-checkbox");
        if (checkbox) {
          checkbox.id = this.model.get("id") || this.model.cid;
          checkbox.removeEventListener("change", this.boundInputChangeonCheckbox);
          checkbox.addEventListener("change", this.boundInputChangeonCheckbox);
        }
      }
    },
    _renderIconView: function() {
      if (this._nodeIconView) {
        this._nodeIconView.destroy();
      }
      var iconViewOptions = {
        el: this.el.querySelector(".csui-type-icon"),
        node: this.model,
        size: this.options.iconSize
      };
      let iconView = this.options?.getIconView ?? this._getIconView;
      iconView = iconView(iconViewOptions);
      const promise = new Promise(_.bind(resolve => {
        resolve(iconView);
      }, this));
      promise.then(view => {
        if (view) {
          this._nodeIconView = view;
          this._nodeIconView.render();
        }
      });
      this.triggerMethod("render:icon", ".csui-type-icon");
    },
    _getIconView: function(opts) {
      let model = opts.node || opts.model;
      return new Marionette.ItemView({
        el: opts.el,
        constructor: function TestView(options) {
          Marionette.LayoutView.prototype.constructor.apply(this, arguments);
        },
        tagName: "span",
        className: "csui-icon-group",
        attributes: function() {
          return {
            title: model.get("name")
          };
        },
        templateHelpers: function() {
          return {
            typeName: model?.get("type_name")?.toLowerCase()
          };
        },
        template: iconTemplate
      });
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
      var inlineBarElem = this.$el?.find(".csui-tileview-more-btn")?.length === 0 ? this.$el?.find(".csui-list-inlineactions-btn") : this.$el?.find(".csui-tileview-more-btn");
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
    },
    onChangeValue(event) {
      const checkbox = event.target, itemId = checkbox.id, model = this.model, modelName = model.get("name"), listitem = checkbox?.closest(".smart-item-standard");
      if (this.options.selectMultiple) {
        this._updateMultiSelection({
          checkbox: checkbox,
          itemId: itemId,
          model: model,
          modelName: modelName,
          listitem: listitem
        });
      } else {
        this._updateSingleSelection({
          checkbox: checkbox,
          itemId: itemId,
          model: model,
          modelName: modelName,
          listitem: listitem
        });
      }
      this.trigger("selected:list:items", selectedItemsInList);
    },
    _updateMultiSelection: function({
      checkbox,
      itemId,
      model,
      modelName,
      listitem
    }) {
      if (checkbox.checked) {
        selectedItemsInList.add(model);
        listitem?.classList?.add("smart-listitem-selected");
        listitem?.setAttribute("aria-label", _.str.sformat(lang.itemSelectedAria, modelName));
      } else {
        selectedItemsInList.remove(model);
        listitem?.classList?.remove("smart-listitem-selected");
        listitem?.setAttribute("aria-label", _.str.sformat(lang.itemSelectionAria, modelName));
      }
      listitem?.setAttribute("aria-selected", checkbox.checked);
      model.set("selected", checkbox.checked);
    },
    _updateSingleSelection: function({
      checkbox,
      itemId,
      model,
      modelName,
      listitem
    }) {
      if (checkbox.checked) {
        listitem?.classList?.add("smart-listitem-selected");
        listitem?.setAttribute("aria-label", _.str.sformat(lang.itemSelectedAria, modelName));
        const listContainer = checkbox?.closest(".binf-list-group");
        listContainer?.querySelectorAll(".smart-listitem-checkbox")?.forEach(el => {
          if (el.id !== itemId) {
            el.checked = false;
            let li = el?.closest(".smart-item-standard");
            li?.classList?.remove("smart-listitem-selected");
            li?.setAttribute("aria-selected", false);
          }
        });
        model.set("selected", true);
        const previouslySelectedModel = selectedItemsInList?.at(0);
        const previouslySelectedId = previouslySelectedModel?.get("id");
        const id = model?.get("id");
        if (!!previouslySelectedId && id !== previouslySelectedId) {
          previouslySelectedModel?.set("selected", false);
          const prevChildView = this._parent?.children?.findByModel(previouslySelectedModel), prevEl = prevChildView?.el;
          prevEl?.setAttribute("aria-label", _.str.sformat(lang.itemSelectionAria, previouslySelectedModel?.get("name")));
        }
        selectedItemsInList?.reset([ model ]);
      } else {
        model.set("selected", false);
        selectedItemsInList?.remove(model);
        listitem?.classList?.remove("smart-listitem-selected");
        listitem?.setAttribute("aria-label", _.str.sformat(lang.itemSelectionAria, modelName));
      }
      listitem?.setAttribute("aria-selected", checkbox.checked);
    }
  });
  return StandardListItem;
});