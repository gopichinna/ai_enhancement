/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "smart/controls/node.picker/impl/search.list/search.query.model", "smart/controls/node.picker/impl/header/search.box/impl/search.box.model", "smart/behaviors/keyboard.navigation/smart.tabable.region.behavior", "i18n!smart/controls/node.picker/impl/header/search.box/impl/nls/lang", "hbs!smart/controls/node.picker/impl/header/search.box/impl/search.box", "hbs!smart/controls/node.picker/impl/header/search.box/impl/search.slice.dropdown", "i18n", "smart/themes/theming", "smart/themes/jato.icons/smart.jato.action.icons", "css!smart/controls/node.picker/impl/header/search.box/impl/search.box", "smart/utils/otwc.loader", "smart/themes/carbonfiber/ot-icons/icons_smart_action_16" ], function(module, _, $, Marionette, SearchQueryModel, SearchBoxModel, TabableRegionBehavior, lang, template, SliceDropDownTemplate, i18n, theming, jatoIcons) {
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
        errorText: lang.errorText,
        loadingText: lang.loadingText,
        labelText: lang.labelText,
        placeholder: lang.placeholder,
        clearerTitle: lang.clearerTitle,
        searchIconTitle: lang.searchIconTitle,
        searchBoxTitle: lang.searchBoxTitle,
        searchOptionsTitle: lang.searchOptionsTitle,
        searchOptionsSelect: lang.searchOptionsSelect,
        startSearch: lang.startSearch,
        searchIconAria: lang.searchIconAria,
        showGlobalSearchToggler: !!this.options.saveFilter,
        ariaLabelInputDescription: lang.ariaLabelInputDescription,
        ariaLabelInputField: lang.ariaLabelInputField,
        ariaLabelSearchBox: lang.ariaLabelSearchBox,
        arialabelclearkeywords: lang.arialabelclearkeywords,
        arialabelsearchbuttonopen: lang.arialabelsearchbuttonopen,
        arialabelstartsearch: lang.arialabelstartsearch
      };
      return {
        messages: messages,
        isJATO: theming.isJATOTheme(),
        jatoActionSearchIcon: jatoIcons.actionSearch
      };
    },
    sliceDropDownTemplate: SliceDropDownTemplate,
    ui: {
      searchBar: ".search-bar",
      input: ".smart-otc-search-input",
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
      "change @ui.input": "inputChanged",
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
      this.boundShowOptionsDD = this._delegateActionOnMenuOpen.bind(this);
      this.boundSearchAction = this.searchIconClicked.bind(this);
      this.boundDelegateEventonSearchPersistent = this._delegateEventonSearchPersistent.bind(this);
      this.listenTo(this.searchboxModel, "change", this._bindEventListeners);
      this.listenTo(this.searchboxModel, "change", this.searchIconToggle);
      if (this.options.disableSearchFromHere) {
        this.options.data.searchFromHere = false;
      }
    },
    _bindEventListeners: async function() {
      const otcSearchPersistent = this.el?.querySelector("otc-search-persistent");
      if (!otcSearchPersistent) {
        return;
      }
      await otcSearchPersistent?.updateComplete;
      otcSearchPersistent?.removeEventListener("click", this.boundShowOptionsDD);
      otcSearchPersistent?.addEventListener("click", this.boundShowOptionsDD);
      otcSearchPersistent?.removeEventListener("input", this.boundShowOptionsDD);
      otcSearchPersistent?.addEventListener("input", this.boundShowOptionsDD);
      otcSearchPersistent?.removeEventListener("search", this.boundSearchAction);
      otcSearchPersistent?.addEventListener("search", this.boundSearchAction);
      const searchPersistent = this.el?.querySelector("otc-search-persistent").shadowRoot, self = this;
      this.searchInput = searchPersistent?.querySelector("#ot-search-input-id");
      this.crossBtn = searchPersistent?.querySelector(".ot-search__clear-button-persist-md");
      this.searchBtn = searchPersistent?.querySelector(".ot-search__startsearch-button");
      this.searchMenuSurrogate = searchPersistent?.querySelector(".ot-search__menu-surrogate");
      searchPersistent.removeEventListener("keydown", this.boundDelegateEventonSearchPersistent);
      searchPersistent.addEventListener("keydown", this.boundDelegateEventonSearchPersistent);
    },
    _delegateActionOnMenuOpen: function(event) {
      if (!this.searchboxModel?.nodeId) {
        this.destroyOptionspopover();
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
        this.ui.input[0]?.classList?.add("binf-hidden");
        this._smartSetAttributes(this.ui.smartGlobalSearchToggler[0], {
          icon: !theming.isJATOTheme() ? "smart_action:action_search32" : "",
          title: lang.searchIconTitle,
          arialabel: lang.searchIconAria,
          ariaexpanded: false
        });
        this.ui.smartGlobalSearchToggler[0].querySelector(".smart-search-jato-icon")?.setAttribute("svg", jatoIcons.actionSearch);
      } else {
        this.ui.input[0]?.classList?.remove("binf-hidden");
        this._smartSetAttributes(this.ui.smartGlobalSearchToggler[0], {
          icon: !theming.isJATOTheme() ? "smart_action:action_close_max32" : "",
          title: lang.searchIconTitle,
          arialabel: lang.searchHideIconAria,
          ariaexpanded: true
        });
        this.ui.input[0]?.focus();
        this.ui.smartGlobalSearchToggler[0].querySelector(".smart-search-jato-icon")?.setAttribute("svg", jatoIcons.actionClose);
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
      this._bindEventListeners();
      if (!!this.options.saveFilter) {
        this.ui.smartGlobalSearchToggler[0]?.classList?.remove("binf-hidden");
        this.ui.input[0]?.classList?.add("binf-hidden");
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
    _delegateEventonSearchPersistent: function(event) {
      switch (event.keyCode) {
       case 9:
        if (!event.shiftKey) {
          if (event.target === this.searchInput) {
            if (this.el?.querySelector(".csui-selected-checkbox")) {
              this.el?.querySelector(".csui-selected-checkbox").shadowRoot?.querySelector("li").focus();
            } else {
              if (this.crossBtn?.offsetWidth) {
                this.crossBtn?.focus();
              } else {
                return true;
              }
            }
            event.preventDefault();
            event.stopPropagation();
          }
          if (event.target === this.searchMenuSurrogate) {
            if (this.crossBtn?.offsetWidth) {
              this.crossBtn.focus();
              event.preventDefault();
              event.stopPropagation();
            } else {
              event.stopPropagation();
              event.preventDefault();
              this.destroyOptionspopover();
              return true;
            }
          } else if (event.target === this.crossBtn && this.searchBtn?.offsetWidth) {
            this.searchBtn.focus();
            event.preventDefault();
            event.stopPropagation();
          }
        } else {
          if (event.target === this.searchMenuSurrogate) {
            this.searchInput.focus();
            event.preventDefault();
            event.stopPropagation();
          } else if (event.target === this.crossBtn) {
            if (this.el?.querySelector(".csui-selected-checkbox")) {
              this.el?.querySelector(".csui-selected-checkbox").shadowRoot?.querySelector("li").focus();
            } else {
              this.searchInput.focus();
            }
            event.preventDefault();
            event.stopPropagation();
          } else if (event.target === this.searchBtn) {
            this.crossBtn.focus();
            event.preventDefault();
            event.stopPropagation();
          }
        }
        break;

       case 27:
        if (event.target === this.searchInput) {
          event.stopPropagation();
          event.preventDefault();
          this.options.masterView._dialog.destroy();
        }
        break;
      }
    },
    currentlyFocusedElement: function(arg) {
      if (this.$el) {
        var focusables = this.$el.find("*[data-cstabindex=-1]");
        if (focusables.length) {
          focusables.prop("tabindex", 0);
        }
        var shiftKey = !!arg && arg.shiftKey;
        if (!shiftKey && this.$el.find(".smart-otc-search-input").length && this.$el.find(".smart-otc-search-input").is(":visible")) {
          this.focusElement = this.el?.querySelector("otc-search-persistent").shadowRoot?.querySelector("#ot-search-input-id");
        } else if (this.$el.find("a.csui-acc-focusable").length) {
          this.focusElement = this.$el.find("a.csui-acc-focusable");
        }
      }
      return this.focusElement;
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
      if (this.$el.find(".smart-otc-search-input").is(":visible")) {
        var value = this.ui?.input?.val()?.trim();
        if (!!value) {
          this._setInputValue(value);
        }
        var searchOption = "", _selOption = this.el?.querySelector(".csui-searchbox-option[checked]");
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
      this._delegateActionOnMenuOpen();
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
      } else {
        this.inputChanged(event);
      }
    },
    inputChanged: function(event) {
      var value = this.ui.input[0]?.value || "";
      this.showOptionsDropdown(event);
    },
    showOptionsDropdown: function(event) {
      var _e = event || window.event;
      if (this.ui.searchOptionsDropdownMenu[0]?.children?.length === 0) {
        this.prepareTargetBrowsedropdown(event);
      }
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
        this.searchOptions.nodeId = this.model.get("location_id1") ?? this.searchboxModel.nodeId;
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
      switch (event.keyCode) {
       case 13:
       case 32:
        this.selectSearchOption(event);
        break;

       case 9:
        event.stopPropagation();
        event.preventDefault();
        break;
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
      if (!!this.$el.find(".smart-search-options-dropdown")?.is(":hover")) {
        this.el.querySelector(".smart-search-options-dropdown")?.removeAttribute("isopen");
      } else {
        if (this.popoverTimer) {
          clearTimeout(this.popoverTimer);
        }
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
    },
    searchIconToggle: function() {
      var value = this.ui?.input?.val()?.trim();
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