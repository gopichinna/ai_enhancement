/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "smart/utils/smart.base", "smart/controls/emptylist/emptylist.view", "hbs!smart/controls/list/impl/simplelist", "hbs!smart/controls/list/impl/simplelistitem", "i18n!smart/controls/list/impl/nls/lang", "smart/themes/jato.icons/smart.jato.action.icons", "smart/themes/theming", "css!smart/controls/list/impl/simplelist" ], function(_, Backbone, Marionette, smartBase, EmptyListView, listTemplate, listItemTemplate, lang, jatoIcons, theming) {
  "use strict";
  const EMPTY_CLASSNAME = "smart-empty-list";
  const isJato = () => theming.isJATOTheme();
  const _getJatoHeaderIcon = smartTileHeaderJatoIcon => {
    return isJato() && smartTileHeaderJatoIcon;
  };
  var SimpleListItemView = Marionette.ItemView.extend({
    constructor: function SimpleListItemView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.triggerMethod("model:update", this.model);
    },
    tagName: "div",
    template: listItemTemplate,
    className: "smart-simplelist-item",
    events: {
      click: "onClickItem",
      keydown: "onKeyDownItem"
    },
    templateHelpers: function() {
      return {
        nameTitleAria: this.model.nameTitleAria,
        icon: this.model.get("iconClassName") || this.model.get("icon"),
        enableIcon: this.options?.enableIcon ?? true,
        isJato: isJato(),
        smartTileHeaderBackJatoIcon: jatoIcons.actionArrowLeft,
        smartTileHeaderJatoIcon: _getJatoHeaderIcon(this.model.get("smartTileHeaderJatoIcon"))
      };
    },
    attributes: function() {
      return {
        role: this?.options?.childRole || "option"
      };
    },
    serializeData: function() {
      var data = Marionette.ItemView.prototype.serializeData.apply(this, arguments);
      if (this.options.enableIcon && data) {
        var icon = data.icon;
        if (icon) {
          data.icon = "csui-icon " + icon;
        }
      }
      return data;
    },
    onRender: function() {
      this.$el.attr("tabindex", -1);
      var id = this.model && this.model.get("id");
      if (id != null) {
        this.$el.attr("href", this.model.get("href"));
      }
    },
    onClickItem: function(event) {
      if (smartBase.isControlClick(event)) {} else {
        event.preventDefault();
        event.stopPropagation();
        this.trigger("click:item");
      }
    },
    onKeyDownItem: function(event) {
      if (event.keyCode === 13) {
        event.preventDefault();
        event.stopPropagation();
        this.trigger("click:item");
      }
    },
    modelEvents: {
      change: "render"
    }
  });
  var SimpleListView = Marionette.CompositeView.extend({
    constructor: function SimpleListView(options = {}) {
      options.data ||= {};
      Marionette.CompositeView.call(this, options);
      this.focusablesSelector = "*[tabindex]";
      var backButton = this.options.data.back_button;
      if (backButton) {
        this.options.data.state = true;
        this.options.data.size = "xsmall";
      }
      if (this.options.data?.items) {
        if (!this.collection) {
          var ViewCollection = Backbone.Collection.extend({
            model: Backbone.Model.extend({
              idAttribute: null
            })
          });
          this.collection = new ViewCollection();
        }
        this.collection.add(this.options.data.items);
      }
      this.listenToOnce(this.collection, "error", _.bind(this.handleError, this));
      this.listenTo(this.completeCollection || this.collection, "sync", function() {
        const listCollection = this.completeCollection || this.collection;
        if (!listCollection?.length) {
          this.ui?.listGroup?.removeAttr("role");
        } else {
          this.ui.listGroup.attr("role", this.templateHelpers?.listRole);
        }
        this._updateClassNames();
      });
      this.listenTo(this.completeCollection || this.collection, "change update", this._updateClassNames);
    },
    _updateClassNames: function() {
      let coll = this.completeCollection || this.collection;
      if (coll.length === 0) {
        this.el.classList.add(EMPTY_CLASSNAME);
      } else {
        this.el.classList.remove(EMPTY_CLASSNAME);
      }
    },
    ui: {
      header: ".cs-header-without-go-bac",
      headerGoBack: ".cs-header-with-go-back",
      back: ".smart-simplelist-icon-wrapper",
      backTitle: ".cs-title-with-go-back",
      listGroup: ".cs-list-group",
      listGroupParent: ".cs-content"
    },
    events: {
      "click @ui.back": "onClickBack",
      "click @ui.backTitle": "onClickBack",
      "click @ui.headerGoBack": "onClickBack",
      "keydown @ui.headerGoBack": "onKeyClickBack",
      keydown: "onKeyDown"
    },
    childEvents: {
      "click:item": "onClickItem",
      render: "_onChildRender"
    },
    triggers: {
      "click @ui.header": "click:header"
    },
    className: "cs-simplelist smart-simplelist binf-panel binf-panel-default ",
    template: listTemplate,
    templateHelpers: function() {
      var backButton = this.options.data.back_button;
      var title = this.options.data.title;
      if (backButton && (title === undefined || title.length === 0)) {
        title = lang.goBackTitleForEmptyTitle;
      }
      return {
        isJato: isJato(),
        smartTileHeaderBackJatoIcon: jatoIcons.actionArrowLeft,
        leftIcon: backButton || this.options.data.titleBarIcon,
        goBackTooltip: backButton ? lang.goBackTooltip : "",
        goBackAria: _.str.sformat(lang.goBackAria, title),
        title: title,
        listAria: this.options.data.listAria || lang.listAria,
        listRole: this?.options?.data?.listRole || "listbox",
        titleBarIcon: this?.options?.data?.titleBarIcon,
        smartTileHeaderJatoIcon: _getJatoHeaderIcon(this?.options?.data?.smartTileHeaderJatoIcon),
        showBackButton: backButton,
        states: true,
        size: "normal"
      };
    },
    childViewContainer: ".cs-list-group",
    childView: SimpleListItemView,
    emptyView: EmptyListView,
    childViewOptions: function() {
      return {
        template: this.options.childViewTemplate,
        childRole: this.options.data.childRole,
        enableIcon: this.options.enableIcon ?? this.options.data.enableIcon ?? true
      };
    },
    _bindEvents: function() {
      if (isJato()) {
        this.ui.listGroupParent.off("scroll wheel", {
          view: this
        }, this._handleTileScroll).on("scroll wheel", {
          view: this
        }, this._handleTileScroll);
      }
    },
    onDomRefresh: function() {
      this._bindEvents();
    },
    _onChildRender: function(childView) {
      this.currentlyFocusedElement();
      this.triggerMethod("on:child:view:render", childView);
    },
    currentlyFocusedElement: function() {
      this.ui.back.prop("tabindex", 0);
      let firstItem = this.$el.find(".cs-list-group")?.children()[0];
      firstItem?.setAttribute("tabindex", 0);
      this.selectedIndex = 0;
    },
    _clearAllTabIndexes: function() {
      let list = this.$el.find(".cs-list-group");
      let tabableElements = list.find(this.focusablesSelector);
      tabableElements.prop("tabindex", -1);
    },
    _setTabIndex: function(index) {
      let elem = this.$el.find(".cs-list-group").children()[index];
      elem.setAttribute("tabindex", 0);
      elem.focus();
    },
    _handleTileScroll: function() {
      const tileContent = this.closest(".csui-normal-scrolling");
      if (!tileContent.classList.contains("smart-scroll-fade-top-bottom") && tileContent.scrollTop > 4) {
        tileContent.classList.add("smart-scroll-fade-top-bottom");
      } else if (tileContent.scrollTop < 4) {
        tileContent.classList.remove("smart-scroll-fade-top-bottom");
      }
    },
    onKeyDown: function(event) {
      switch (event.which) {
       case 38:
        if (this.selectedIndex > 0) {
          this.selectedIndex = this.selectedIndex - 1;
          this._clearAllTabIndexes();
          this._setTabIndex(this.selectedIndex);
        } else {
          event.preventDefault();
          event.stopPropagation();
        }
        break;

       case 40:
        if (this.selectedIndex < this.collection.length - 1) {
          this.selectedIndex = this.selectedIndex + 1;
          this._clearAllTabIndexes();
          this._setTabIndex(this.selectedIndex);
        } else {
          event.preventDefault();
          event.stopPropagation();
        }
        break;

       default:
        return;
      }
    },
    onClickItem: function(src) {
      src.cancelClick = false;
      this.trigger("click:item", src);
      this.trigger("set:css", src);
    },
    onClickBack: function(event) {
      event.preventDefault();
      event.stopPropagation();
      this.trigger("click:back");
    },
    onKeyClickBack: function(event) {
      if (event.keyCode == 13) {
        this.onClickBack(event);
      }
    },
    handleError: function() {
      this.errorExists = true;
      this.$el.addClass("smart-simplelist-view-error");
    }
  });
  return SimpleListView;
});