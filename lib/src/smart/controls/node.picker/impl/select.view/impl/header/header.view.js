/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "nuc/lib/backbone", "smart/behaviors/keyboard.navigation/smart.tabable.region.behavior", "smart/controls/node.picker/impl/select.view/impl/addable.types/addable.types.view", "hbs!smart/controls/node.picker/impl/select.view/impl/header/header", "i18n!smart/controls/node.picker/impl/nls/lang", "smart/themes/theming", "smart/themes/jato.icons/smart.jato.action.icons", "css!smart/controls/node.picker/impl/select.view/impl/header/header", "smart/bundles/otwc/icons_action" ], function(_, $, Marionette, Backbone, TabableRegionBehavior, AddableTypesView, template, dialogLang, theming, jatoIcons) {
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
        inputTitle: dialogLang.inputTitle,
        backButtonAria: dialogLang.backButtonTooltip,
        isJATO: theming.isJATOTheme(),
        jatoActionSearchSmall: jatoIcons.actionSearchSmall,
        jatoActionClose: jatoIcons.actionClose,
        jatoActionCloseSmall: jatoIcons.actionCloseSmall,
        jatoActionArrowLeft: jatoIcons.actionArrowLeft,
        jatoActionDocument: jatoIcons.actionDocument
      };
    },
    ui: {
      searchBox: "> form.cs-modal-filter",
      headerTitle: ".smart-header-container",
      typeaheadSearch: ".smart-typeahead-search",
      searchInput: ".smart-typeahead-search-input",
      tabElements: "> *[tabindex]",
      backBtn: ".csui-targetbrowse-history",
      toolbar: ".smart-header-tools"
    },
    events: {
      "actionIconClicked @ui.typeaheadSearch": "searchFieldClearerClicked",
      "paste @ui.searchInput": "contentPasted",
      "change @ui.searchInput": "filterChanged",
      "submit @ui.searchBox": "filterChanged",
      keydown: "onKeyInView",
      keyup: "onKeyInView"
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
        !this.ui?.searchInput.length && this.render();
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
          if (this.$el.find(".cs-go-back:visible").length && !event.shiftKey && !this.options.masterView.options.searchActionPerformed) {
            return this.$el.find(".cs-go-back");
          } else if (this.$el.find(".csui-folder-name.binf-hidden").length && !event.shiftKey) {
            return this.$el.find(".cs-filter-input");
          } else if (this.el?.querySelector(".smart-header-container.binf-hidden") && event.shiftKey) {
            return this.$el?.find(".cs-filter-input")[0]?.shadowRoot?.querySelector(".ot-input__action-icon") || this.$el?.find(".cs-filter-input")[0]?.shadowRoot?.querySelector('input[type="search"]');
          } else if ((event.shiftKey && this._canAddNewItems() || !event.shiftKey && !this.el?.querySelector(".icon-sv-search") && this._canAddNewItems()) && this.el?.querySelector(".smart-add-toolbar")) {
            return this.el?.querySelector(".smart-add-toolbar");
          } else {
            let focusEle = this.el.querySelector(".cs-filter-input")?.hasAttribute("isopen") ? this.$el?.find(".cs-filter-input") : this.el?.querySelector(".icon-sv-search");
            return focusEle || focusables[0];
          }
        } else {
          return focusables[0];
        }
      }
    },
    onLastTabElement: function(shiftTab, event) {
      var tabItems = this.$("[data-cstabindex=-1]:visible, *[tabindex=-1]:visible"), lastItem = tabItems.length - 1;
      if (tabItems.length) {
        var focusElement = shiftTab ? tabItems[0] : tabItems[lastItem];
        this.$(".csui-focus").removeClass("csui-focus");
        if (this.ui.searchInput[0]?.hasAttribute("isopen")) {
          return false;
        }
        return $(focusElement).hasClass(TabableRegionBehavior.accessibilityActiveElementClass) && !shiftTab;
      }
      return true;
    },
    onKeyInView: function(event) {
      this.keydownInHeader = true;
      if (event.target?.classList?.contains("cs-filter-input") && event.keyCode === 27) {
        event.stopPropagation();
      }
    },
    onRender: function() {
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
      const typeaheadSearch = this.ui.typeaheadSearch[0];
      const inlineSearchClickedFun = this.inlineSearchClicked.bind(this);
      const onSearchOpenFun = this.onInlineSearchOpen.bind(this);
      const onSearchCloseFun = this.onInlineSearchClose.bind(this);
      typeaheadSearch?.removeEventListener("opening", inlineSearchClickedFun);
      typeaheadSearch?.addEventListener("opening", inlineSearchClickedFun);
      typeaheadSearch?.removeEventListener("closing", inlineSearchClickedFun);
      typeaheadSearch?.addEventListener("closing", inlineSearchClickedFun);
      typeaheadSearch?.removeEventListener("open", onSearchOpenFun);
      typeaheadSearch?.addEventListener("open", onSearchOpenFun);
      typeaheadSearch?.removeEventListener("close", onSearchCloseFun);
      typeaheadSearch?.addEventListener("close", onSearchCloseFun);
    },
    inlineSearchClicked: async function() {
      this?.searchClicked();
      await this.ui.typeaheadSearch[0]?.updateComplete;
    },
    onInlineSearchOpen: function() {
      if (this.isRendered) {
        this.trigger("search:clicked");
        this.ui.searchInput[0]?.shadowRoot?.querySelector('input[type="search"]')?.focus();
      }
    },
    onInlineSearchClose: async function() {
      await this.ui.typeaheadSearch[0]?.updateComplete;
      if (this.isRendered) {
        this.trigger("search:clicked");
        this.keydownInHeader && this.ui.typeaheadSearch[0]?.shadowRoot?.querySelector("otc-button")?.focus();
      }
      this.options.masterView.options.searchActionPerformed = false;
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
    toggleTypeaheadSearch: function(event) {
      this.ui.typeaheadSearch[0].hasAttribute("isopen") ? this.ui.typeaheadSearch[0].removeAttribute("isopen") : this.ui.typeaheadSearch[0].setAttribute("isopen", "");
    },
    searchClicked: function(event) {
      Backbone.trigger("closeToggleAction");
      this.ui.headerTitle.toggleClass("binf-hidden");
      this.$el.find(".csui-folder-name").toggleClass("smart-search-input-expanded");
      this.toggleTypeaheadSearch(event);
      this.ui.searchInput.toggleClass(TabableRegionBehavior.accessibilityFocusableClass);
      if (this.getValue().length) {
        this.ui.searchInput.val("");
        this.filterChanged(event);
      }
      this.ui.typeaheadSearch.toggleClass(TabableRegionBehavior.accessibilityFocusableClass);
      if ($(event?.target).hasClass("form-control-search")) {
        this.ui.searchInput.removeClass(TabableRegionBehavior.accessibilityActiveElementClass);
        this.ui.typeaheadSearch.addClass(TabableRegionBehavior.accessibilityActiveElementClass);
        this.$el.trigger("setCurrentTabFocus");
      } else {
        this.ui.searchInput.addClass(TabableRegionBehavior.accessibilityActiveElementClass);
        this.ui.typeaheadSearch.removeClass(TabableRegionBehavior.accessibilityActiveElementClass);
      }
      this.trigger("changed:focus");
      this.focusElement && this.focusElement.trigger("focus");
    },
    searchFieldClearerClicked: function(e) {
      e.preventDefault();
      e.stopPropagation();
      this.ui.searchInput.val("");
      this.filterChanged(e);
      this.ui.searchInput.trigger("focus");
      this.ui.searchInput.addClass(TabableRegionBehavior.accessibilityActiveElementClass);
      this.trigger("search:clicked");
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
      this.options.masterView.options.searchActionPerformed = true;
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