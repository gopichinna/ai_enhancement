/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "nuc/lib/backbone", "smart/behaviors/keyboard.navigation/smart.tabable.region.behavior", "smart/controls/node.picker/impl/select.view/impl/addable.types/addable.types.view", "hbs!smart/controls/node.picker/impl/select.view/impl/header/header", "i18n!smart/controls/node.picker/impl/nls/lang", "css!smart/controls/node.picker/impl/select.view/impl/header/header" ], function(_, $, Marionette, Backbone, TabableRegionBehavior, AddableTypesView, template, dialogLang) {
  var HeaderView = Marionette.ItemView.extend({
    template: template,
    tagName: "div",
    templateHelpers: function() {
      return {
        search_icon_tooltip: _.str.sformat(dialogLang.searchIconTooltip, this.options.columnTitle),
        search_placeholder: dialogLang.searchByNamePlaceholder,
        search_aria: dialogLang.searchByNameAria,
        search_clear_icon_tooltip: dialogLang.searchClearIconTooltip,
        title: this.title,
        enableSearch: this.options.collection.length > 0,
        backButtonTooltip: dialogLang.backButtonTooltip,
        type: dialogLang.Type,
        name: dialogLang.Name,
        location: dialogLang.Location,
        searchView: this.options.searchView,
        searchInButtonAria: _.str.sformat(dialogLang.searchIconTooltip, this.title),
        clearSearchButtonAria: dialogLang.clearSearchButtonAria,
        collapseSearch: dialogLang.collapseSearch,
        backButtonAria: dialogLang.backButtonTooltip
      };
    },
    ui: {
      placeholderSearchIcon: ".cs-modal-filter .icon-search-placeholder",
      searchBox: "> form.cs-modal-filter",
      closeSearchIcon: "> form .csui-form-control-search",
      openSearchIcon: "> .csui-folder-name .icon-sv-search",
      headerTitle: "> .csui-folder-name",
      searchInput: "> form .cs-filter-input",
      clearer: "> form .smart-inline-search-clear",
      tabElements: "> *[tabindex]",
      backBtn: ".csui-targetbrowse-history",
      toolbar: ".smart-header-tools"
    },
    events: {
      "click @ui.placeholderSearchIcon": "placeholderSearchIconClicked",
      "click .icon-sv-search": "searchClicked",
      "click .csui-form-control-search": "searchClicked",
      "paste @ui.searchInput": "contentPasted",
      "change @ui.searchInput": "filterChanged",
      "click @ui.clearer": "searchFieldClearerClicked",
      "submit @ui.searchBox": "filterChanged",
      keydown: "onKeyInView"
    },
    behaviors: {
      TabableRegionBehavior: {
        behaviorClass: TabableRegionBehavior
      }
    },
    constructor: function HeaderView(options) {
      this.options = options || {};
      this.container = options.container;
      this.lastFilterValue = "";
      this.title = options.title;
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      if (this.container) {
        this.listenTo(this.container, "change:name", function(node) {
          this.title = node.get("name");
          this.render();
        });
      }
      this.listenTo(options.collection, "sync reset", _.bind(function() {
        this.ui?.searchBox?.hasClass("binf-hidden") && this.render();
      }, this));
      this.listenTo(Backbone, "closeToggleAction", this._closeToggle);
      this.listenToOnce(this, "before:destroy", _.bind(function() {
        this.addableTypesView && this.stopListening(this.addableTypesView, "save:form");
        this.addableTypesView && this.addableTypesView.trigger("destroy");
        this.stopListening(options.collection, "sync reset ");
        this.stopListening(this.container, "change:name");
        this.stopListening(Backbone, "closeToggleAction");
      }, this));
      this.listenTo(this.options?.masterView, "update:npv:ontoggle", _.bind(function() {
        if (this.showHistoryBackBtn()) {
          this.ui?.backBtn?.show();
        }
      }, this));
      this.listenTo(this.options?.masterView, "focus:in:emptyview", _.bind(function() {
        const focusableEle = this.getFocusables();
        if (focusableEle) {
          focusableEle.trigger("focus");
        }
      }, this));
    },
    _canAddNewItems: function() {
      return this.container && this.options?.addableTypes?.length > 0;
    },
    _checkforAddableTypeObject: function(arrOfObj) {
      return arrOfObj.some(obj => Object.keys(obj).includes("type"));
    },
    getFocusables: function() {
      var focusables = this.$el.find("*[data-cstabindex=-1], *[tabindex=-1]");
      if (focusables.length) {
        focusables.prop("tabindex", 0);
      }
      return focusables;
    },
    currentlyFocusedElement: function(event) {
      if (this.options?.masterView?.isKeyEvent) {
        var focusables = this.getFocusables();
        if (focusables.length > 1) {
          if (this.$el.find(".cs-go-back:visible").length && !event.shiftKey) {
            return this.$el.find(".cs-go-back");
          } else if (this.$el.find(".csui-folder-name.binf-hidden").length && !event.shiftKey) {
            return this.$el.find("input");
          } else if (this.el?.querySelector(".csui-folder-name.binf-hidden") && event.shiftKey) {
            return this.el?.querySelector(".icon-sv-search-hide");
          } else if (event.shiftKey && this._canAddNewItems() || !event.shiftKey && !this.el?.querySelector(".csui-folder-name .icon-sv-search") && this._canAddNewItems()) {
            return this.el?.querySelector(".smart-add-toolbar");
          } else {
            return this.el?.querySelector(".csui-folder-name .icon-sv-search") || focusables[0];
          }
        } else {
          return focusables[0];
        }
      }
    },
    onLastTabElement: function(shiftTab) {
      var tabItems = this.$("[data-cstabindex=-1], *[tabindex=-1]"), lastItem = tabItems.length - 1;
      if (tabItems.length) {
        var focusElement = shiftTab ? tabItems[0] : tabItems[lastItem];
        this.$(".csui-focus").removeClass("csui-focus");
        return $(focusElement).hasClass(TabableRegionBehavior.accessibilityActiveElementClass) && !shiftTab;
      }
      return true;
    },
    onKeyInView: function(event) {
      var bubbleEvent = false, target = $(event.target);
      switch (event.keyCode) {
       case 13:
        target.removeClass(TabableRegionBehavior.accessibilityActiveElementClass);
        if (!event.target.classList.contains("smart-toggle")) {
          $(event.target).trigger("click");
        }
        break;

       case 27:
        if (event.target?.classList?.contains("cs-filter-input")) {
          this.searchClicked();
          event.preventDefault();
          bubbleEvent = true;
        }
        break;

       default:
        return true;
      }
      return bubbleEvent;
    },
    onRender: function() {
      this.ui.clearer.toggle(false);
      this.ui.searchBox.toggleClass("binf-hidden");
      this.ui.closeSearchIcon.toggleClass("binf-hidden");
      this.ui.searchInput.hide();
      if (this.showHistoryBackBtn()) {
        this.ui.backBtn.show();
      }
      var self = this;
      this.ui.searchInput.on("keyup", function(e) {
        self.filterChanged(e);
      });
      this.$el.find("*[data-cstabindex]").on("focus", function() {
        var target = $(this);
        self.focusedElement && self.focusedElement.removeClass(TabableRegionBehavior.accessibilityActiveElementClass);
        target.addClass(TabableRegionBehavior.accessibilityActiveElementClass);
        self.focusedElement = target;
      });
      if (this._canAddNewItems()) {
        if (this.options?.hasTableToolbarView) {
          this.addableDDView = this.options.initializeToolbar(this);
          this.addableDDView.$el.appendTo(this.ui.toolbar);
        } else {
          this._getAddableTypes();
        }
      }
    },
    _getAddableTypes: function() {
      var addableTypesPromise = new Promise(_.bind(resolve => {
        resolve(this.options?.getAddableTypes(this.options));
      }, this));
      addableTypesPromise.then(addableTypes => {
        let addableTypeColl = new Backbone.Collection(addableTypes);
        this.options.title = this.title;
        if (!addableTypes || addableTypes?.length <= 1) {
          if (_.isFunction(this?.options?.requestLazyAddableTpes)) {
            this._requestLazyAddableTpes().then(lazyAddables => {
              let lazyAddableTypes = new Backbone.Collection(lazyAddables);
              _.each(lazyAddableTypes?.models, function(lazyaddable) {
                addableTypeColl?.models.push(lazyaddable);
              });
              addableTypeColl.reset(addableTypeColl?.models);
            });
          }
          this._initializeAddableTypesView(addableTypeColl);
          this._bindEventListeners();
        } else {
          this._initializeAddableTypesView(addableTypeColl);
          this.listenToOnce(this?.addableTypesView, "addtoolbar:shown", function(atv) {
            if (_.isFunction(this?.options?.requestLazyAddableTpes)) {
              atv.startLazyLoading();
              this._requestLazyAddableTpes().then(lazyAddables => {
                let lazyAddableTypes = new Backbone.Collection(lazyAddables);
                this?.addableTypesView.trigger("append:lazyaddables", lazyAddableTypes);
              });
            }
          });
          this._bindEventListeners();
        }
      });
    },
    _initializeAddableTypesView: function(addableTypeColl) {
      let addableTypeOptions = {
        addableTypeColl: addableTypeColl,
        listViewCollection: this.options.collection,
        container: this.options.container,
        title: this.title,
        showCustomInlineForm: this.options.showCustomInlineForm,
        masterView: this.options?.masterView
      };
      this.addableTypesView = new AddableTypesView(addableTypeOptions);
      if (!this.el.querySelector(".smart-add-toolbar")) {
        this.addableTypesView.render();
        this.addableTypesView?.$el.appendTo(this.ui.toolbar);
      }
    },
    _requestLazyAddableTpes: function() {
      let lazyAddableTypesPromise = new Promise(_.bind(resolve => {
        resolve(this.options?.requestLazyAddableTpes(this));
      }, this));
      return lazyAddableTypesPromise;
    },
    _bindEventListeners: function() {
      this.listenTo(this.addableTypesView, "save:form", function(node) {
        this.trigger("save:form", node);
      });
    },
    _closeToggle: function() {
      if (this.options?.hasTableToolbarView) {
        var dropdownToggleEl = this.el?.querySelector(".binf-dropdown-toggle");
        if (dropdownToggleEl?.closest(".binf-open")) {
          $(dropdownToggleEl)?.binf_dropdown("toggle");
        }
      }
    },
    showHistoryBackBtn: function() {
      var canShowBackBtn = !this.$el.closest(".csui-slideMidLeft").length;
      if (!this.options?.masterView?.isGridView()) {
        canShowBackBtn = canShowBackBtn && this.options.targetBrowseHistory && this.options.targetBrowseHistory.length >= 1;
      } else {
        canShowBackBtn = !!this.$el.closest(".csui-panel").length;
        canShowBackBtn = canShowBackBtn && this.options.targetBrowseHistory && this.options.targetBrowseHistory.length >= 1;
      }
      return canShowBackBtn;
    },
    searchClicked: function(event) {
      Backbone.trigger("closeToggleAction");
      this.ui.headerTitle.toggleClass("binf-hidden");
      this.ui.searchInput.toggleClass(TabableRegionBehavior.accessibilityFocusableClass);
      this.ui.clearer.toggle(false);
      if (this.getValue().length) {
        this.ui.searchInput.val("");
        this.filterChanged(event);
      }
      this.ui.searchInput.toggle(200, "linear", _.bind(function() {
        if (this.isRendered) {
          this.ui.searchInput.is(":visible") ? this.ui.searchInput.trigger("focus") : this.options?.masterView?.isKeyEvent ? this.ui.openSearchIcon.trigger("focus") : "";
          this.ui.closeSearchIcon.toggleClass("binf-hidden");
        }
      }, this));
      this.ui.closeSearchIcon.toggleClass(TabableRegionBehavior.accessibilityFocusableClass);
      this.ui.closeSearchIcon.removeClass(TabableRegionBehavior.accessibilityActiveElementClass);
      this.ui.openSearchIcon.toggleClass(TabableRegionBehavior.accessibilityFocusableClass);
      this.ui.searchBox.toggleClass("binf-hidden");
      if ($(event?.target).hasClass("form-control-search")) {
        this.ui.searchInput.removeClass(TabableRegionBehavior.accessibilityActiveElementClass);
        this.ui.openSearchIcon.addClass(TabableRegionBehavior.accessibilityActiveElementClass);
        this.$el.trigger("setCurrentTabFocus");
      } else {
        this.ui.searchInput.addClass(TabableRegionBehavior.accessibilityActiveElementClass);
        this.ui.openSearchIcon.removeClass(TabableRegionBehavior.accessibilityActiveElementClass);
      }
      this.trigger("changed:focus");
      this.focusElement && this.focusElement.trigger("focus");
      this.trigger("search:clicked");
    },
    searchFieldClearerClicked: function(e) {
      e.preventDefault();
      e.stopPropagation();
      this.ui.clearer.removeClass(TabableRegionBehavior.accessibilityFocusableClass);
      this.ui.clearer.removeClass(TabableRegionBehavior.accessibilityActiveElementClass);
      this.ui.searchInput.val("");
      this.filterChanged(e);
      this.ui.searchInput.trigger("focus");
      this.ui.searchInput.addClass(TabableRegionBehavior.accessibilityActiveElementClass);
      this.trigger("search:clicked");
    },
    placeholderSearchIconClicked: function() {
      this.ui.searchInput.trigger("focus");
    },
    getColumn: function() {
      return this.options.column;
    },
    getValue: function() {
      var filterValue = "";
      if (this.isRendered) {
        filterValue = this.ui?.searchInput?.val();
      }
      return filterValue;
    },
    setValue: function(val) {
      if (val && val.length) {
        this.ui.searchInput.val(val);
        this.lastFilterValue = val;
      }
    },
    getShown: function() {
      return this.ui.searchInput.hasClass("binf-show");
    },
    setShown: function(show) {
      if (show === true && this.ui.searchInput.hasClass("binf-hidden")) {
        this.ui.searchInput.toggleClass("show binf-hidden");
      } else if (show === false && this.ui.searchInput.hasClass("binf-show")) {
        this.ui.searchInput.toggleClass("show binf-hidden");
      }
    },
    setFocus: function() {
      var textLen = this.ui.searchInput.val().length;
      this.ui.searchInput.trigger("focus");
      this.ui.searchInput[0].setSelectionRange(textLen, textLen);
    },
    contentPasted: function(event) {
      this.applyFilter();
    },
    filterChanged: function(event) {
      this.applyFilter();
      return false;
    },
    applyFilter: function() {
      var filterValue = this.getValue();
      var filterHasValue = !!filterValue.length;
      this.ui.clearer.toggle(filterHasValue);
      if (filterHasValue) {
        this.ui.clearer.addClass(TabableRegionBehavior.accessibilityFocusableClass);
      } else {
        this.ui.clearer.removeClass(TabableRegionBehavior.accessibilityFocusableClass);
      }
      if (this.lastFilterValue != filterValue) {
        this.lastFilterValue = filterValue;
        var self = this;
        if (this.filterTimeout) {
          clearTimeout(this.filterTimeout);
        }
        this.filterTimeout = setTimeout(function() {
          self.filterTimeout = undefined;
          self.trigger("change:filterValue", {
            name: self.getValue()
          });
        }, 1e3);
      }
    }
  });
  return HeaderView;
});