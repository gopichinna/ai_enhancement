/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "smart/controls/node.picker/impl/search.list/search.query.model", "smart/controls/node.picker/impl/header/search.box/impl/search.box.model", "smart/behaviors/keyboard.navigation/smart.tabable.region.behavior", "i18n!smart/controls/node.picker/impl/header/search.box/impl/nls/lang", "hbs!smart/controls/node.picker/impl/header/search.box/impl/search.box", "hbs!smart/controls/node.picker/impl/header/search.box/impl/search.slice.dropdown", "i18n", "css!smart/controls/node.picker/impl/header/search.box/impl/search.box", "smart/utils/otwc.loader", "smart/themes/carbonfiber/ot-icons/icons_smart_action_16" ], function(module, _, $, Marionette, SearchQueryModel, SearchBoxModel, TabableRegionBehavior, lang, template, SliceDropDownTemplate, i18n) {
  "use strict";
  var config = _.defaults({}, module.config(), {
    showInput: false,
    inputValue: "",
    nodeName: "",
    searchFromHere: true
  });
  var SearchBoxView = Marionette.ItemView.extend({
    className: "csui-search-box",
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
        showGlobalSearchToggler: !!this.options.saveFilter
      };
      return {
        messages: messages
      };
    },
    sliceDropDownTemplate: SliceDropDownTemplate,
    ui: {
      searchBar: ".search-bar",
      input: ".csui-input",
      clearer: ".csui-clearer",
      searchIcon: ".csui-header-search-icon",
      smartGlobalSearchToggler: ".smart-global-search-toggler",
      smartSearchIcon: ".smart-search-icon",
      searchOptionsDropdownMenu: ".smart-search-options-dropdown"
    },
    events: {
      "click @ui.smartGlobalSearchToggler": "_toggleGlobalSearch",
      "click .csui-header-search-icon": "searchIconClicked",
      "focusin @ui.input": "_handleInputFocusIn",
      "focusout @ui.input": "_handleInputFocusOut",
      "blur @ui.input": "_handleInputFocusOut",
      "click @ui.input": "hidePopover",
      "keyup @ui.input": "inputTyped",
      "keydown @ui.clearer": "clearerClicked",
      "change @ui.input": "inputChanged",
      "click @ui.clearer": "clearerClicked",
      "click .csui-searchbox-option": "selectSearchOption",
      "keydown .csui-searchbox-option": "changeSearchOption",
      "focusout @ui.searchOptionsDropdownMenu": "hideSearchOptionsDropDown",
      "mouseleave @ui.searchOptionsDropdownMenu": "hideSearchOptionsDropDown"
    },
    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },
    constructor: function SearchBoxView(options) {
      options || (options = {});
      options.data = _.defaults({}, options.data, config);
      this.direction = i18n.settings.rtl ? "left" : "right";
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.model = new SearchQueryModel(undefined, options);
      this.searchboxModel = new SearchBoxModel(undefined, options);
      this.listenTo(this.searchboxModel, "change", this.prepareTargetBrowsedropdown);
      this.listenTo(this.searchboxModel, "change", this.searchIconToggle);
      if (this.options.disableSearchFromHere) {
        this.options.data.searchFromHere = false;
      }
    },
    _handleInputFocusIn: function() {
      this.hideStartLocations();
      this._toggleSmartSearchIcon();
    },
    _handleInputFocusOut: function() {
      this.hideSearchOptionsDropDown();
      this._toggleSmartSearchIcon();
    },
    _toggleSmartSearchIcon: function() {
      const value = this.ui.input[0]?.value || "";
      if (value.length || this.ui.input[0] === document.activeElement) {
        this.ui.smartSearchIcon[0]?.classList?.remove("show-icon");
        this.ui.input[0]?.classList?.add("no-smart-search-icon");
        return;
      }
      this.ui.smartSearchIcon[0]?.classList?.add("show-icon");
      this.ui.input[0]?.classList?.remove("no-smart-search-icon");
    },
    _toggleGlobalSearch: function() {
      if (!!this.globalSearchExpanded) {
        this._setInputValue("");
        this.ui.searchBar[0]?.classList?.add("binf-hidden");
        this._smartSetAttributes(this.ui.smartGlobalSearchToggler[0], {
          icon: "smart_action:action_search32",
          title: lang.searchIconTitle,
          arialabel: lang.searchIconAria,
          "aria-expanded": false
        });
      } else {
        this.ui.searchBar[0]?.classList?.remove("binf-hidden");
        this._smartSetAttributes(this.ui.smartGlobalSearchToggler[0], {
          icon: "smart_action:action_close_max32",
          title: lang.searchIconTitle,
          arialabel: lang.searchHideIconAria,
          "aria-expanded": true
        });
        this.ui.input[0]?.focus();
      }
      this.globalSearchExpanded = !this.globalSearchExpanded;
    },
    _smartSetAttributes: function(el, attributes) {
      if (el) {
        Object.keys(attributes).forEach(key => {
          el.setAttribute(key, attributes[key]);
        });
      }
    },
    onRender: function() {
      if (!!this.options.saveFilter) {
        this.ui.smartGlobalSearchToggler[0]?.classList?.remove("binf-hidden");
        this.ui.searchBar[0]?.classList?.add("binf-hidden");
      }
      var value = this.options.data.inputValue || this.model.get("where");
      if (value) {
        this._setInputValue(value);
        this.$el.find(".search-bar").show();
      }
      if (this.options.data.showInput || value) {
        this.triggerMethod("before:show:input", this);
        this.ui.input.show();
        this.triggerMethod("show:input", this);
      }
      this.ui.searchIcon.removeClass("icon-header-search_enabled").addClass("icon-header-search");
      var self = this;
      this.$el.find("*[data-cstabindex]").on("focus", function() {
        self._updateFocusables(this);
      });
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
          this.focusElement = this.$el.find(".csui-input");
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
        var lastFocusedItem = lastItem;
        if (shiftTab) {
          for (var i = shiftTab ? 0 : lastItem; !!tabItems[lastItem]; shiftTab ? i++ : i--) {
            if ($(tabItems[i]).is(":visible")) {
              lastFocusedItem = i;
              break;
            }
          }
        }
        var focusElement = tabItems[lastFocusedItem];
        this.$(".csui-focus").removeClass("csui-focus");
        return $(focusElement).hasClass(TabableRegionBehavior.accessibilityActiveElementClass);
      }
      return true;
    },
    resetPageDefaults: function(event) {
      this.model.resetDefaults = true;
    },
    searchIconClicked: function(event) {
      this.ui.input.toggleClass(TabableRegionBehavior.accessibilityFocusableClass);
      this.resetPageDefaults(event);
      if (!!this.searchboxModel.nodeId && this.$el.find(".csui-searchbox-option").length > 0) {
        if (this.options.data.searchFromHere) {
          document.querySelector(".csui-search-from-here").setAttribute("checked", true);
        } else {
          document.querySelector(".csui-search-all-loc").setAttribute("checked", true);
        }
      }
      if (this.$el.find(".search-bar").is(":visible")) {
        var value = this.ui.input.val().trim();
        if (!!value) {
          this._setInputValue(value);
          $(event.currentTarget).attr("title", lang.startSearch).attr("aria-label", lang.startSearch);
        }
        var searchOption = "", _selOption = this.el?.querySelector(".csui-searchbox-option");
        if (!!_selOption?.checked) {
          searchOption = _selOption.getAttribute("value");
        }
        if (!!history.state && !!history.state.search) {
          this.previousState = history.state.search;
        }
        if (!!value) {
          this.model.clear({
            silent: true
          });
          var params = {};
          params["location_id1"] = searchOption;
          if (value) {
            params["where"] = value;
          }
          this.model.set(params);
          this.trigger("change:searchterm", this.model);
          this._updateInput(event);
        }
        if (!!this.previousState) {
          this.model["prevSearchState"] = this.previousState;
        }
      }
    },
    showStartLocations: function(event) {
      this.trigger("show:startLocation");
    },
    hideStartLocations: function(event) {
      this.trigger("hide:startLocation");
    },
    inputTyped: function(event) {
      var value = this.ui.input.val().trim();
      if (event.which === 13 && !event.isDefaultPrevented()) {
        event.preventDefault();
        event.stopPropagation();
        this._setInputValue(value);
        if (!!value) {
          this.searchIconClicked(event);
        }
        if (this.previousValue != value) {
          this.previousValue = value;
        }
      } else if (event.keyCode == 27) {} else {
        if (event.which === 40 && $(".smart-search-options-dropdown").is(":visible")) {
          this.$el.find(".csui-selected-checkbox")[0]?.focus();
        } else {
          this.inputChanged(event);
        }
      }
    },
    inputChanged: function(event) {
      var value = this.ui.input[0]?.value || "";
      if (value.length) {
        this.ui.clearer[0]?.classList?.add("show-icon");
      } else {
        this.ui.clearer[0]?.classList?.remove("show-icon");
      }
      this.showOptionsDropdown(event);
    },
    showOptionsDropdown: function(event) {
      var _e = event || window.event;
      if (this.searchboxModel.nodeId && _e?.which !== 27) {
        this.ui.searchOptionsDropdownMenu[0]?.setAttribute("isopen", true);
        if (this.$el.find(".csui-searchbox-option").length > 0) {
          if (this.options.data.searchFromHere) {
            document.querySelector(".csui-search-from-here").setAttribute("checked", true);
          } else {
            document.querySelector(".csui-search-all-loc").setAttribute("checked", true);
          }
          this.selectSearchOption();
        }
      }
      event.preventDefault();
      event.stopPropagation();
    },
    prepareTargetBrowsedropdown: function(e) {
      if (this.searchboxModel.nodeId) {
        this.searchOptions = {};
        this.searchOptions.nodeId = this.searchboxModel.nodeId;
        this.searchOptions.nodeIdSO = _.uniqueId("csui-so-" + this.searchboxModel.nodeId);
        this.searchOptions.select = lang.searchOptionsSelect;
        this.searchOptions.fromHere = lang.searchFromHere;
        this.searchOptions.selectFromHereAria = lang.searchFromHereAria;
        this.searchOptions.allLoc = lang.searchAllLoc;
        this.searchOptions.selectAllLocAria = lang.searchAllLocAria;
        var content = this.sliceDropDownTemplate(this.searchOptions);
        this.$el.find(".smart-search-options-dropdown").html(content);
        this.hideSearchOptionsDropDown();
        this.ui.searchIcon.show();
        this.ui.searchIcon.removeClass("icon-header-search_enabled").addClass("icon-header-search");
      } else {
        this.destroyOptionspopover();
      }
    },
    destroyOptionspopover: function(e) {
      if (this.ui.searchOptionsDropdownMenu?.length) {
        this.ui.searchOptionsDropdownMenu[0].innerHTML = "";
        this.ui.searchOptionsDropdownMenu[0].removeAttribute("isopen");
      }
    },
    changeSearchOption: function(event) {
      if (event.keyCode === 13 || event.keyCode === 32) {
        this.selectSearchOption(event);
      }
    },
    selectSearchOption: function(e) {
      const searchBoxOption = this.el?.querySelector(".csui-searchbox-option");
      if (searchBoxOption?.checked) {
        this.options.data.searchFromHere = true;
      } else {
        this.options.data.searchFromHere = false;
      }
    },
    hideSearchOptionsDropDown: function() {
      var that = this;
      var searchFromHereIcon = that.$el.find(".csui-searchbox-option");
      searchFromHereIcon.attr("tabindex", -1);
      setTimeout(function() {
        if (document.querySelector(".csui-search-from-here") === document.activeElement || document.querySelector(".csui-search-all-loc") === document.activeElement) {
          return false;
        } else {
          var self = that;
          if (that.popoverTimer) {
            clearTimeout(that.popoverTimer);
          }
          that.popoverTimer = setTimeout(function() {
            self.showSearchOptionDropDown();
          }, 800);
          return true;
        }
      }, 100);
    },
    showSearchOptionDropDown: function() {
      if (!this.$el.find(".smart-search-options-dropdown")?.is(":hover")) {
        this.el.querySelector(".smart-search-options-dropdown")?.removeAttribute("isopen");
      } else {
        if (this.popoverTimer) {
          clearTimeout(this.popoverTimer);
        }
      }
    },
    clearerClicked: function(event) {
      if (event.type === "click" || event.keyCode === 13) {
        event.preventDefault();
        event.stopPropagation();
        this._setInputValue("");
        this.ui.searchIcon.removeClass("icon-header-search_enabled").addClass("icon-header-search");
        this.hidePopover(event);
        this.ui.input.trigger("focus");
      }
    },
    hidePopover: function(event) {
      if ($(".csui-search-box-slice-popover").css("display") !== "none") {
        $(".csui-search-box-slice-popover").binf_popover("hide");
      }
      this.showOptionsDropdown(event);
    },
    _updateInput: function(event) {
      if (this._isRendered) {
        var value = this.model.get("where") || "";
        this._setInputValue(value);
      }
    },
    _setInputValue: function(value) {
      this.ui.input.val(value);
      if (value.length) {
        this.ui.clearer.addClass("show-icon");
      } else {
        this.ui.clearer.removeClass("show-icon");
      }
    },
    searchIconToggle: function() {
      var value = this.ui.input.val().trim();
      if (!!value) {
        this.ui.searchIcon.removeClass("icon-header-search").addClass("icon-header-search_enabled");
        this.ui.input.addClass("csui-input-focus");
        $(this.ui.searchIcon).attr("title", lang.startSearch).attr("aria-label", lang.startSearch);
        $(this.ui.searchIcon).removeClass("icon-header-search-nohover");
      } else {
        this.ui.searchIcon.removeClass("icon-header-search_enabled").addClass("icon-header-search");
        this.ui.input.removeClass("csui-input-focus");
        if (this.$el.find(".search-bar").is(":visible")) {
          $(this.ui.searchIcon).addClass("icon-header-search-nohover");
          $(this.ui.searchIcon).attr("title", lang.searchBoxTitle).attr("aria-label", lang.searchBoxTitle);
        }
      }
    }
  });
  return SearchBoxView;
});