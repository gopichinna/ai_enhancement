/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "d2/dialogs/target.browse/impl/search.list/search.query.model", "d2/dialogs/target.browse/impl/header/search.box/impl/search.box.model", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "i18n!d2/dialogs/target.browse/impl/header/search.box/impl/nls/lang", "hbs!d2/dialogs/target.browse/impl/header/search.box/impl/search.box", "i18n", "nuc/utils/namedlocalstorage", "d2/dialogs/target.browse/impl/header/search.box/search.options.view", "css!d2/dialogs/target.browse/impl/header/search.box/impl/search.box", "csui/lib/jquery.ui/js/jquery-ui" ], function(module, _, $, Marionette, SearchQueryModel, SearchBoxModel, TabableRegionBehavior, lang, template, i18n, NamedLocalStorage, SearchDropdownOptions) {
  "use strict";
  var config = _.defaults({}, module.config(), {
    showInput: false,
    inputValue: "",
    nodeName: "",
    searchFromHere: true
  });
  var SearchBoxView = Marionette.LayoutView.extend({
    className: "d2-search-box",
    template: template,
    templateHelpers: function() {
      var messages = {
        placeholder: lang.placeholder,
        clearerTitle: lang.clearerTitle,
        searchIconTitle: lang.searchIconTitle,
        searchBoxTitle: lang.searchBoxTitle,
        searchOptionsTitle: lang.searchOptionsTitle,
        searchOptionsSelect: lang.searchOptionsSelect,
        startSearch: lang.startSearch,
        searchIconAria: lang.searchIconAria,
        clearTooltip: lang.clearTooltip
      };
      return {
        messages: messages
      };
    },
    regions: {
      searchOptionsRegion: ".d2-search-options-dropdown"
    },
    ui: {
      input: ".d2-input",
      clearButton: ".close-icon",
      searchIcon: ".d2-header-search-icon",
      searchGlass: ".icon-header-search",
      menuItems: '> li[role="menuitem"]'
    },
    events: {
      "click .d2-header-search-icon": "searchIconClicked",
      "keydown @ui.input": "onInputKeyDown",
      "click @ui.input": "onClickInput",
      "input @ui.input": "showOptionsDropdown",
      "keyup .d2-header-search-icon": "onKeyInView",
      "keyup .d2-search-options-dropdown": "onInputKeyDown",
      "click .d2-search-options-dropdown": "onClickInput",
      "click @ui.clearButton": "clearInput",
      "keydown @ui.clearButton": "onClearBtnKeyDown"
    },
    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },
    constructor: function SearchBoxView(options) {
      options.data = _.defaults({}, options.data, config);
      this.direction = i18n.settings.rtl ? "left" : "right";
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.model = new SearchQueryModel(undefined, options);
      this.searchboxModel = new SearchBoxModel(undefined, options);
      this.storage = options.storage || new NamedLocalStorage(module.id);
      this.locationSelector = options.locationSelector;
      this._updatePerspective(this);
      this.options.selectedNodeId = null;
      this.connector = options.connector;
    },
    onRender: function() {
      if (!this.locationSelector) {
        this.searchIconClicked();
        var searchDiv = this.$el.find(".search-bar");
        searchDiv[0].style.display = "block";
      }
    },
    isSearchbarVisible: function() {
      return this.$(".search-bar").is(":visible");
    },
    _updateFocusables: function(ele) {
      var target = $(ele);
      this.focusedElement && this.focusedElement.removeClass(TabableRegionBehavior.accessibilityActiveElementClass);
      target.addClass(TabableRegionBehavior.accessibilityActiveElementClass);
      this.focusedElement = target;
    },
    currentlyFocusedElement: function(arg) {
      if (this.$el) {
        var focusables = this.$el.find("*[data-cstabindex=-1]");
        if (focusables.length) {
          focusables.prop("tabindex", 0);
        }
        var shiftKey = !!arg && arg.shiftKey;
        if (!shiftKey && this.$el.find(".search-bar").length && this.$el.find(".search-bar").is(":visible")) {
          this.focusElement = this.$el.find(".d2-input");
        } else if (this.$el.find("a.csui-acc-focusable").length) {
          this.focusElement = this.$el.find("a.csui-acc-focusable");
        }
      }
      return this.focusElement;
    },
    onLastTabElement: function(shiftTab) {
      var tabItems = this.$("[data-cstabindex=-1]"), lastItem = tabItems.length - 1, self = this;
      this.$el.find("*[data-cstabindex]").on("focus", function() {
        self._updateFocusables(this);
      });
      if (tabItems.length) {
        var focusElement = shiftTab ? tabItems[0] : tabItems[lastItem];
        this.$(".csui-focus").removeClass("csui-focus");
        return $(focusElement).hasClass(TabableRegionBehavior.accessibilityActiveElementClass);
      }
      return true;
    },
    resetPageDefaults: function() {
      this.model.resetDefaults = true;
    },
    searchIconClicked: function(event) {
      this.searchOptionsRegion.empty();
      this.searchFocused = false;
      this.updateIcon();
      this.ui.input.toggleClass(TabableRegionBehavior.accessibilityFocusableClass);
      this.resetPageDefaults();
      if (!this.$el.find(".search-bar").is(":visible") && (this.$el && this.$el.parents())) {
        var eleLoadContainer = this.$el.parents(".d2-target-browse ").find("div[class='load-container']");
        if (eleLoadContainer && !eleLoadContainer.hasClass("binf-hidden")) {
          this.$el.find("a.icon-global-search").attr("aria-expanded", "true");
          var that = this;
          this.$el.find(".search-bar").show(function() {
            that.ui.input.trigger("focus");
          });
          if (this.model.attributes.where === "") {
            $(event.currentTarget).title = "";
            $(event.currentTarget).addClass("icon-header-search-nohover");
          }
        }
      } else {
        this.collapseSearchBox(event);
        this.searchFocused = true;
        this.updateIcon();
      }
    },
    _setSearchQuery: function(value) {
      this.model.clear({
        silent: true
      });
      var params = {};
      if (value) {
        params["where"] = value;
      }
      if (this.viewQuickSearch) {
        if (this.options.localScope === "node") {
          if (this.options.locationID) {
            if (this.viewQuickSearch.currentDropDownSelection === "folder") {
              params["current-folder-id"] = this.options.locationID;
              params["descend"] = "false";
            } else if (this.viewQuickSearch.currentDropDownSelection === "folder_and_subfolder") {
              params["current-folder-id"] = this.options.locationID;
              params["descend"] = "true";
            }
          }
        } else if (this.options.localScope === "search") {
          if (this.viewQuickSearch.currentDropDownSelection === "search_result") {
            params["filtered-search"] = "true";
          }
        }
      }
      this.model.set(params);
      this.trigger("change:searchterm", this.model);
    },
    showOptionsDropdown: function(event) {
      event.stopPropagation();
      var $el = $(event.target);
      $el.attr("data-value", $el.val());
      this._updatePerspective(this);
      if (this.viewQuickSearch.selectedPerspective === "home") {
        this.searchOptionsRegion.empty();
      } else {
        this.searchOptionsRegion.show(this.viewQuickSearch);
      }
    },
    _hideDropdownOptions: function() {
      if (this.searchOptionsRegion) {
        this.searchOptionsRegion.empty();
      }
    },
    _hideDropdownOptionsAndClearText: function() {
      if (this.searchOptionsRegion) {
        this.clearInput();
        this.searchOptionsRegion.empty();
      }
    },
    destroyOptionspopover: function() {
      this.searchOptionsRegion.empty();
    },
    _hideSearchBar: function(event) {
      var _e = event || window.event, ele = $(".search-bar"), that = event.data;
      if (ele.is(":visible")) {
        if (_e.type === "keydown" && (_e.keyCode === 27 || _e.which === 27) || !$(_e.target).closest(ele).length && _e.type === "click" && !$(_e.target).closest(".d2-header-search-icon").length && !$(_e.target).closest(".esoc-activityfeed-invisiblebutton").length) {
          $(this).find(".d2-input").val("");
          that.$el.find(ele).hide("blind", {
            direction: event.data.direction
          }, "200", function() {
            that.focusedElement = undefined;
            var fe = that.currentlyFocusedElement();
            fe.trigger("focus");
          });
          $(this).find(".d2-search-box .d2-header-search-icon").attr("title", lang.searchIconTitle);
          $(this).find(".d2-search-box .d2-header-search-icon").attr("aria-label", lang.searchIconAria);
          $(this).find(".d2-search-box .d2-header-search-icon").attr("aria-expanded", "false");
          event.data.slice = event.data.model.get("slice");
          event.data.options.data.searchFromHere = true;
          that.searchFocused = true;
          that.updateIcon();
          $(document).off("click." + this.cid + " keydown." + this.cid);
        }
      }
    },
    collapseSearchBox: function() {
      this.clearInput();
      this.$el.find(".search-bar").hide();
    },
    clearInput: function() {
      this.$el.find(".d2-input").val("");
      this.ui.input.attr("data-value", "");
    },
    _updatePerspective: function(args) {
      this.viewQuickSearch = new SearchDropdownOptions({
        searchboxModel: this.searchboxModel,
        storage: this.storage,
        localScope: args.options.localScope
      });
    },
    onClickInput: function(event) {
      event.stopPropagation();
      if ($(event.target).val().length > 0) {
        this.showOptionsDropdown(event);
      }
    },
    onKeyInView: function(event) {
      if (event.keyCode === 32 || event.keyCode === 13) {
        this.searchIconClicked();
        event.stopPropagation();
      }
    },
    onInputKeyDown: _.throttle(function(event) {
      this.lastKeyCode = event.keyCode;
      switch (event.keyCode) {
       case 13:
        this.stopEventPropagation(event);
        var d2Input = this.$el.find(".d2-input");
        var value = d2Input.val();
        this._setSearchQuery(value);
        this.searchFocused = true;
        this.searchOptionsRegion.empty();
        break;

       case 9:
        break;

       default:
        delete this.lastKeyCode;
        break;
      }
    }, 50),
    updateIcon: function() {
      if (this.searchFocused) {
        this.$el.removeClass("close-focused");
        this.$el.find(".close_icon").removeClass("close_icon_target_browse").addClass("icon-header-search");
      } else {
        this.$el.addClass("close-focused");
        this.$el.find(".close_icon").removeClass("icon-header-search").addClass("close_icon_target_browse");
      }
    },
    stopEventPropagation: function(event) {
      event.stopPropagation();
      event.preventDefault();
    },
    onClearBtnKeyDown: function(event) {
      switch (event.keyCode) {
       case 13:
       case 32:
        this.clearInput(event);
        break;
      }
    }
  });
  return SearchBoxView;
});