/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "smart/utils/smart.base", "smart/controls/emptylist/emptylist.view", "smart/controls/list/behaviors/list.item.keyboard.behavior", "smart/utils/accessibility", "hbs!smart/controls/listitem/impl/simpletreelistitem", "hbs!smart/controls/listitem/impl/simpletreelistleaf", "i18n!smart/controls/listitem/impl/nls/lang", "smart/themes/theming", "smart/themes/jato.icons/smart.jato.action.icons", "css!smart/controls/listitem/impl/simpletreelistitem", "smart/themes/carbonfiber/ot-icons/icons_smart_action" ], function(_, $, Backbone, Marionette, smartBase, EmptyListView, ListItemKeyboardBehavior, Accessibility, treeListItemTemplate, treeListLeafTemplate, lang, theming, jatoIcons) {
  "use strict";
  var accessibleTable = Accessibility.isAccessibleTable();
  var TabPosition = {
    none: -1,
    header: 0,
    list: 1
  };
  var SimpleTreeListLeafView = Marionette.ItemView.extend({
    tagName: "a",
    attributes: function() {
      return {
        role: "treeitem",
        tabindex: "-1",
        href: "#"
      };
    },
    template: treeListLeafTemplate,
    templateHelpers: function() {
      let addIconClass = !_.isFunction(this.options.getIconView);
      return {
        showInlineActionBar: this.showInlineActionBar,
        enableIcon: this.options.enableIcon,
        addIconClass: addIconClass
      };
    },
    modelEvents: {
      change: "render"
    },
    className: function() {
      var classNames = [ "smart-tree-list-item", "binf-list-group-item" ];
      if (!this.showInlineActionBar) {
        classNames.push("csui-tileview-contains-no-more-btn");
      }
      if (!this.options.enableIcon) {
        classNames.push("smart-tree-list-item-without-icon");
      }
      return _.unique(classNames).join(" ");
    },
    ui: {
      titleName: ".list-item-title",
      moreActions: ".csui-tileview-more-btn"
    },
    events: function() {
      var evts = {
        click: "onExecuteClick"
      };
      if (!!this.options.toolbarData && !accessibleTable) {
        evts = _.extend(evts, {
          focus: "onShowInlineMenu",
          mouseenter: "onShowInlineMenu",
          mouseleave: "onHideInlineMenu",
          blur: "onHideInlineMenu",
          wheel: "onWheelEvent"
        });
      }
      return evts;
    },
    behaviors: {
      ListItemKeyboardBehavior: {
        behaviorClass: ListItemKeyboardBehavior
      }
    },
    onExecuteClick: function(event) {
      if (smartBase.isControlClick(event)) {} else {
        event.stopPropagation();
        event.preventDefault();
        this.triggerMethod("click:item", {
          target: this.model
        });
      }
    },
    constructor: function SimpleTreeListLeafView(options = {}) {
      options.enableIcon = options.enableIcon ?? true;
      if (options?.defaultActionBehavior) {
        this.behaviors = _.extend(this.behaviors, {
          DefaultAction: options.defaultActionBehavior
        });
      }
      options.showInlineActionBar = !!options.toolbarData;
      if (options.showInlineActionBar) {
        this.showInlineActionBar = true;
        this.triggers = {};
        this.tileViewToolbarItems = options.toolbarData.toolbaritems;
      }
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.context = options.context;
      this.showInlineActionBar = this.options?.showInlineActionBar;
      if (_.isFunction(this.options?.templateHelpers) && this.options?.templateHelpers()?.icon) {
        let th = this.options?.templateHelpers();
        let newTemplateHelpers = {
          enableIcon: this.options.enableIcon,
          addIconClass: this.options.enableIcon && (th?.addIconClass ?? this.options?.addIconClass ?? true)
        };
        this.options.templateHelpers = _.extend(th, newTemplateHelpers);
      }
    },
    cascadeDestroy: function() {
      return false;
    },
    onShowInlineMenu: function(event) {
      var self = this;
      var inlineBarElem = this.$el.find(".csui-tileview-more-btn");
      if (smartBase.isHybrid() && (event || !inlineBarElem.length)) {
        return;
      }
      event && event.preventDefault();
      event && event.stopPropagation();
      this.$el.addClass("csui-tile-with-more-btn");
      const myPromise = new Promise(_.bind(myResolve => {
        myResolve(this.options.getInlinMenuView?.(self));
      }, this));
      myPromise.then(view => {
        if (view) {
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
        }
      });
    },
    onHideInlineMenu: function(event) {
      if (event && smartBase.isHybrid()) {
        this._inlineMenuView?.inlineMenuBarView?.closeDropdownMenuIfOpen?.();
        return;
      }
      this.$el.removeClass("csui-tile-with-more-btn");
      if (this._inlineMenuView) {
        this._inlineMenuView.destroy();
        this._inlineMenuView = undefined;
        return true;
      }
    },
    onWheelEvent: function() {
      this._inlineMenuView?.closeDropdownMenuIfOpen?.();
    },
    onRender: function() {
      var id = this.model?.get("id");
      if (id != null && _.isFunction(this.options?.setNodeLinks)) {
        this.options?.setNodeLinks(this);
        this.$el.attr("href", this.model.get("href"));
      }
      if (this.options.refetchNodeActions && this.model) {
        this.model.refetchNodeActions = true;
      }
      if (this._nodeIconView) {
        this._nodeIconView.destroy();
      }
      var iconViewOptions = {
        el: this.el.querySelector(".csui-type-icon"),
        node: this.model,
        size: this.options.iconSize
      };
      const myPromise = new Promise(_.bind(myResolve => {
        myResolve(this.options.getIconView?.(iconViewOptions));
      }, this));
      myPromise.then(view => {
        if (view) {
          this._nodeIconView = view;
          this.$el.attr("aria-label", _.str.sformat(lang.typeAndNameAria, this._nodeIconView.model.get("title"), this.model.get("name")));
          this._nodeIconView.render();
        }
      });
      if (this.model && this.options?.checkDefaultAction) {
        var disabled = this.model.fetched === false || !this?.defaultActionController?.hasAction(this.model);
        this.$el[disabled ? "addClass" : "removeClass"]("inactive");
      }
      if (smartBase.isHybrid()) {
        this.onShowInlineMenu();
      }
    },
    onBeforeDestroy: function() {
      if (this._nodeIconView) {
        this._nodeIconView.destroy();
      }
      if (this._inlineMenuView) {
        this._inlineMenuView.destroy();
      }
    }
  });
  var SimpleTreeListItemView = Marionette.CompositeView.extend({
    className: "cs-simpletreelistitem smart-simpletreelistitem binf-panel binf-panel-default",
    attributes: function() {
      return {
        role: "treeitem"
      };
    },
    template: treeListItemTemplate,
    templateHelpers: function() {
      return this._baseTemplateHelpers();
    },
    _baseTemplateHelpers: function() {
      const isJATO = theming.isJATOTheme();
      const jatoGroupIcon = isJATO && this.options.model?.get("jatoGroupIcon");
      return {
        isJATO: isJATO,
        expandSVGContent: jatoIcons.actionChevronSmallDown,
        collapseSVGContent: jatoIcons.actionChevronSmallUp,
        icon: this.options.model?.get("icon"),
        name: this.options.model?.get("name"),
        expandLabel: lang.treeListExpandTooltip,
        collapseLabel: lang.treeListCollapseTooltip,
        jatoGroupIcon: jatoGroupIcon,
        expand: this.model?.get("expand") || this.model?.get("searchMode")
      };
    },
    ui: {
      header: ".cs-header",
      headerDropdownIcon: ".cs-header .csui-icon",
      headerDropdownIconUp: ".cs-header .smart-icon-expandArrowUp",
      headerDropdownIconDown: ".cs-header .smart-icon-expandArrowDown",
      content: "> .cs-content",
      contentList: "> .cs-content > .cs-list-group"
    },
    events: {
      keydown: "onKeyInView"
    },
    childEvents: {
      "click:item": "onClickItem",
      render: "_onChildRender",
      "before:execute:command": "onBeforeCommandExecution"
    },
    childViewContainer: ".cs-list-group",
    childView: SimpleTreeListLeafView,
    childViewOptions: function() {
      return {
        checkDefaultAction: this.options.checkDefaultAction,
        template: this.options.childViewTemplate,
        templateHelpers: this.options.childViewTemplateHelpers,
        toolbarData: this.options.toolbarData,
        context: this.options.context,
        iconSize: this.options.iconSize,
        refetchNodeActions: this.options.refetchNodeActions,
        getInlinMenuView: this.options.getInlinMenuView,
        setNodeLinks: this.options.setNodeLinks,
        getIconView: this.options.getIconView,
        defaultActionBehavior: this.options.defaultActionBehavior
      };
    },
    emptyView: EmptyListView,
    emptyViewOptions: function() {
      return {
        text: this.options?.emptyGroupTextPlaceholder || lang.emptyGroupDefaultText
      };
    },
    _onChildRender: function(childView) {
      var $item = childView.$el;
      if ($item.is("[data-csui-active]")) {
        $item.addClass("binf-active");
      }
    },
    onBeforeCommandExecution: function(args) {
      this.trigger("before:execute:command", args);
    },
    constructor: function SimpleTreeListItemView(options) {
      options || (options = {});
      if (options.model?.childrenCollection) {
        options.collection = options.model.childrenCollection;
      } else {
        options.collection = new Backbone.Collection();
      }
      if (options.templateHelpers) {
        var self = this;
        var optionsTemplateHelpers = options.templateHelpers;
        options.templateHelpers = function() {
          if (_.isFunction(optionsTemplateHelpers)) {
            return _.extend(self._baseTemplateHelpers(), optionsTemplateHelpers.call(self));
          } else {
            return _.extend(self._baseTemplateHelpers(), optionsTemplateHelpers);
          }
        };
      }
      Marionette.CompositeView.call(this, options);
    },
    onRender: function() {
      if (this.model?.get("flatten") === true) {
        this.$el.addClass("flatten-tree");
        this.ui.header.addClass("binf-hidden");
        if (this.collection.length > 0) {
          this.ui.content.removeClass("binf-hidden");
        }
        this.$el?.removeAttr("role");
        this.ui?.contentList?.removeAttr("role");
      } else {
        this.$el.attr("aria-label", _.str.sformat(lang.treeListItemExpandTooltip, this.options.model?.get("name")));
      }
      this.ui.header.on("click", _.bind(this.onClickHeader, this));
      this._setDropdownIconClass();
      this.tabPosition = TabPosition.none;
      this.selectedIndex = -1;
    },
    onClickHeader: function(event) {
      event.preventDefault();
      event.stopPropagation();
      this.ui.content.toggleClass("binf-hidden");
      this._setDropdownIconClass();
      this.$el.trigger("focus");
      this.tabPosition = TabPosition.header;
      this.selectedIndex = -1;
      this.triggerMethod("click:tree:header", this);
    },
    _setDropdownIconClass: function() {
      if (this.ui.content.hasClass("binf-hidden")) {
        this.ui.headerDropdownIconUp.addClass("binf-hidden");
        this.ui.headerDropdownIconDown.removeClass("binf-hidden");
        this.ui.headerDropdownIcon.attr("title", lang.treeListExpandTooltip);
        if (this.model?.get("flatten") !== true) {
          this.$el.attr("aria-expanded", "false");
          this.$el.attr("aria-label", _.str.sformat(lang.treeListItemExpandTooltip, this.options.model?.get("name")));
        }
      } else {
        this.ui.headerDropdownIconUp.removeClass("binf-hidden");
        this.ui.headerDropdownIconDown.addClass("binf-hidden");
        this.ui.headerDropdownIcon.attr("title", lang.treeListCollapseTooltip);
        if (this.model?.get("flatten") !== true) {
          this.$el.attr("aria-expanded", "true");
          this.$el.attr("aria-label", _.str.sformat(lang.treeListItemCollapseTooltip, this.options.model?.get("name")));
        }
      }
    },
    onClickItem: function(src) {
      src.cancelClick = false;
      this.triggerMethod("click:tree:item", src);
      if (src.cancelClick === false) {
        this._setCssItemSelected(src.$el);
        src.$el.trigger("focus");
      }
      this.tabPosition = TabPosition.list;
      this.selectedIndex = src._index ? src._index : -1;
    },
    _setCssItemSelected: function($item) {
      if (!($item instanceof $)) {
        return;
      }
      var $active = $item.siblings("[data-csui-active]");
      $active?.removeClass("binf-active")?.removeAttr("data-csui-active");
      $item.addClass("binf-active").attr("data-csui-active", "");
      $item.siblings().prop("tabindex", "-1");
    },
    currentlyFocusedElement: function(event) {
      var $elem;
      if (event && !this.ui?.content?.hasClass("binf-hidden") && (event.keyCode === 34 || event.keyCode === 35 || event.keyCode === 38 || event.keyCode === 9 && event.shiftKey)) {
        var lastIndex = this.collection.length - 1;
        $elem = this.getElementByIndex(lastIndex);
        if ($elem) {
          this.tabPosition = TabPosition.list;
          this.selectedIndex = lastIndex;
          return $elem;
        }
      }
      if (this.model?.get("flatten") === true) {
        if (this.collection.length > 0) {
          var index = this.selectedIndex > 0 ? this.selectedIndex : 0;
          event?.keyCode === 38 && (index = this.collection.length - 1);
          $elem = this.getElementByIndex(index);
          if ($elem) {
            this.tabPosition = TabPosition.list;
            this.selectedIndex = index;
            return $elem;
          }
        }
      } else if (!this.ui.content.hasClass("binf-hidden") && this.selectedIndex >= 0 && this.collection.length > 0) {
        var selectedIndex = this.selectedIndex;
        $elem = this.getElementByIndex(selectedIndex);
        if ($elem) {
          this.tabPosition = TabPosition.list;
          this.selectedIndex = selectedIndex;
          return $elem;
        }
      } else {
        this.tabPosition = TabPosition.header;
        this.selectedIndex = -1;
        return this.$el;
      }
      this.tabPosition = TabPosition.none;
      this.selectedIndex = -1;
      return undefined;
    },
    _moveTo: function(event, $elem, $preElem) {
      event.preventDefault();
      event.stopPropagation();
      this.trigger("before:keyboard:change:focus");
      $preElem?.prop("tabindex", "-1");
      $elem.prop("tabindex", "0");
      $elem.trigger("focus");
      this.trigger("changed:focus");
      this.trigger("after:keyboard:change:focus");
    },
    onKeyInView: function(event) {
      var $preElem;
      switch (event.keyCode) {
       case 38:
        if (this.tabPosition === TabPosition.list && this.selectedIndex === 0) {
          if (this.model?.get("flatten") === true) {
            this.tabPosition = TabPosition.none;
            this.selectedIndex = this.selectedIndex ?? -1;
          } else {
            $preElem = this.getElementByIndex(this.selectedIndex);
            this.tabPosition = TabPosition.header;
            this.selectedIndex = -1;
            this._moveTo(event, this.$el, $preElem);
          }
        } else if (this.tabPosition === TabPosition.list && this.selectedIndex > 0) {
          $preElem = this.getElementByIndex(this.selectedIndex);
          this._moveTo(event, this._selectPrevious(), $preElem);
        }
        break;

       case 40:
        if (!this.ui.content.hasClass("binf-hidden")) {
          if (this.ui?.content?.find("li")[0] === document.activeElement) {
            this.selectedIndex = 0;
          }
          if (this.selectedIndex < this.collection.length - 1) {
            this.tabPosition = TabPosition.list;
            $preElem = this.getElementByIndex(this.selectedIndex);
            this._moveTo(event, this._selectNext(), $preElem);
          }
        }
        break;

       case 33:
       case 34:
        this.tabPosition = TabPosition.none;
        this.selectedIndex = -1;
        break;

       case 13:
       case 32:
        this._clickTargetByKeyboard(event);
        break;

       case 37:
        if (this.tabPosition === TabPosition.header && !this.ui.content.hasClass("binf-hidden")) {
          this._clickTargetByKeyboard(event);
        } else if (this.tabPosition === TabPosition.list) {
          var flattenTree = this.model?.get("flatten");
          if (!flattenTree) {
            $preElem = this.getElementByIndex(this.selectedIndex);
            this.tabPosition = TabPosition.header;
            this.selectedIndex = -1;
            this._moveTo(event, this.$el, $preElem);
          }
        }
        break;

       case 39:
        if (this.tabPosition === TabPosition.header) {
          if (this.ui.content.hasClass("binf-hidden")) {
            this._clickTargetByKeyboard(event);
          } else {
            if (this.collection.length > 0) {
              this.tabPosition = TabPosition.list;
              this.selectedIndex = 0;
              this._moveTo(event, this.getElementByIndex(this.selectedIndex), this.$el);
            }
          }
        }
        break;
      }
      return true;
    },
    _clickTargetByKeyboard: function(event) {
      event.preventDefault();
      event.stopPropagation();
      $(event.target).find(".cs-header").trigger("click");
    },
    _selectNext: function() {
      if (this.selectedIndex < this.collection.length - 1) {
        this.selectedIndex++;
      }
      return this.getElementByIndex(this.selectedIndex);
    },
    _selectPrevious: function() {
      if (this.selectedIndex > 0) {
        this.selectedIndex--;
      }
      return this.getElementByIndex(this.selectedIndex);
    },
    getElementByIndex: function(index) {
      if (isNaN(index) || index < 0) {
        return null;
      }
      var nthChildSel = _.str.sformat("div a:nth-child({0})", index + 1);
      var $item = this.$(nthChildSel);
      return $($item[0]);
    }
  });
  return SimpleTreeListItemView;
});