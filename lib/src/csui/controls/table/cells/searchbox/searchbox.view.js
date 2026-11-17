/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/jquery", "csui/lib/underscore", "csui/lib/marionette", "csui/controls/icon/icon.view", "csui/utils/high.contrast/detector!", "i18n!csui/controls/table/impl/nls/lang", "hbs!csui/controls/table/cells/searchbox/searchbox", "smart/themes/theming", "csui/themes/csui.jato.action.icons", "css!csui/controls/table/cells/searchbox/searchbox" ], function($, _, Marionette, IconView, highContrast, lang, template, theming, jatoIcons) {
  var SearchBoxView = Marionette.ItemView.extend({
    className: "csui-table-column-search",
    template: template,
    templateHelpers: function() {
      this._isJatoTheme = theming.isJATOTheme();
      this._svgSearchIcon = this._isJatoTheme && jatoIcons["actionSearchSmall"];
      this._svgCloseIcon = this._isJatoTheme && jatoIcons["actionCloseSmall"];
      return {
        svgSearchIcon: this._svgSearchIcon,
        svgCloseIcon: this._svgCloseIcon,
        isTypeAhead: this.options.isTypeAhead,
        search_value: this.lastFilterValue,
        show_input: !this.options.isTypeAhead && this.lastFilterValue !== undefined,
        search_icon_tooltip: _.str.sformat(lang.searchIconTooltip, this.options.columnTitle),
        search_placeholder: _.str.sformat(lang.searchPlaceholder, this.options.columnTitle),
        search_input_tooltip: _.str.sformat(lang.searchInputTooltip, this.options.columnTitle),
        search_clear_icon_tooltip: lang.searchClearIconTooltip,
        iconTheme: this.iconTheme
      };
    },
    ui: {
      itemPicker: "div.cs-item-picker",
      searchBox: ".csui-table-searchbox",
      searchInput: ".csui-table-search-input",
      searchInputFadeout: ".fadeout",
      clearer: ".sbclearer",
      searchGlassContainer: ".csui-table-search-icon",
      searchPlaceholderIcon: ".icon-search-placeholder"
    },
    events: {
      "keyup @ui.searchInput": "filterChanged",
      keydown: "onKeyInView",
      "paste @ui.searchInput": "filterChanged",
      "change @ui.searchInput": "filterChanged",
      "click @ui.searchInput": "_searchFieldInputClicked",
      "click @ui.searchInputFadeout": "_searchFieldInputClicked",
      "click @ui.clearer": "_searchFieldClearerClicked",
      "click @ui.searchGlassContainer": "_searchFieldGlassClicked",
      "click @ui.searchPlaceholderIcon": "setFocusToInput"
    },
    valueChangedEventName: "change:filterValue",
    constructor: function SearchBoxView(filterValue, options) {
      this.options = options || {};
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.lastFilterValue = filterValue;
      this.lastFocused = "I";
      this.iconTheme = highContrast === 1 ? "dark" : "light";
      this._isJatoTheme = theming.isJATOTheme();
      if (!this._isJatoTheme) {
        this.searchGlassIconView = new IconView({
          iconName: "csui_action_search32",
          size: "contain",
          theme: this.iconTheme
        });
      }
    },
    onRender: function() {
      if (!this._isJatoTheme) {
        var region = new Marionette.Region({
          el: this.ui.searchGlassContainer
        });
        region.show(this.searchGlassIconView);
        this.searchGlassIconView.el.setAttribute("aria-hidden", true);
      }
      if (!this.ui.searchBox.hasClass("binf-hidden")) {
        this.showClearerIfFilterHasValue();
        this.triggerMethod("opened");
        this.triggerMethod("changed:focus", this.lastFocused);
        this.setIconAndState();
      }
    },
    onDestroy: function() {
      if (this.filterTimeout) {
        clearTimeout(this.filterTimeout);
        this.filterTimeout = undefined;
      }
    },
    onKeyInView: function(event) {
      if (this.getShown()) {
        if (event.keyCode === 27) {
          this.hideAndClear();
          this.triggerMethod("changed:focus");
          return;
        }
        if (event.keyCode === 13 || event.keyCode === 32) {
          if ($(event.target).hasClass("sbclearer")) {
            event.preventDefault();
            event.stopPropagation();
            this._searchFieldClearerClicked(event);
          }
          if ($(event.target).hasClass("csui-table-search-icon")) {
            event.preventDefault();
            event.stopPropagation();
            this.toggleSearch();
          }
        }
        switch (this.lastFocused) {
         case "I":
          var caretPos = this.ui.searchInput[0].selectionStart;
          var val = this.getValue();
          switch (event.keyCode) {
           case 13:
            event.stopPropagation();
            event.preventDefault();
            if (val.length > 0) {
              this.triggerMethod(this.valueChangedEventName, {
                column: this.options.column,
                keywords: val
              });
            }
            break;

           case 37:
            if (caretPos > 0) {
              event.stopPropagation();
            }
            break;

           case 39:
            if (val.length > 0 && caretPos < val.length) {
              event.stopPropagation();
            } else {
              this._moveFocusRight();
              event.stopPropagation();
              event.preventDefault();
            }
            break;

           case 35:
            this.ui.searchInput[0].selectionStart = val.length;
            this.ui.searchInput[0].selectionEnd = val.length;
            event.stopPropagation();
            event.preventDefault();
            break;

           case 36:
            this.ui.searchInput[0].selectionStart = 0;
            this.ui.searchInput[0].selectionEnd = 0;
            event.stopPropagation();
            event.preventDefault();
            break;
          }
          break;

         case "C":
          switch (event.keyCode) {
           case 13:
           case 32:
            event.preventDefault();
            event.stopPropagation();
            this._searchFieldClearerClicked(event);
            break;

           case 37:
            this.lastFocused = "I";
            this.triggerMethod("changed:focus", this.lastFocused);
            event.stopPropagation();
            event.preventDefault();
            break;

           case 39:
            this.lastFocused = "G";
            this.triggerMethod("changed:focus", this.lastFocused);
            event.stopPropagation();
            event.preventDefault();
            break;
          }
          break;

         case "G":
          switch (event.keyCode) {
           case 13:
           case 32:
            this.hideAndClear();
            event.stopPropagation();
            event.preventDefault();
            break;

           case 37:
            this._moveFocusLeft();
            event.stopPropagation();
            event.preventDefault();
            break;

           case 39:
            event.preventDefault();
            break;
          }
          break;
        }
      } else {
        if (event.keyCode === 13 || event.keyCode === 32) {
          event.preventDefault();
          event.stopPropagation();
          this.showSearchInput();
        }
      }
    },
    currentlyFocusedElement: function() {
      if (this.getShown()) {
        switch (this.lastFocused) {
         case "I":
          return this.ui.searchInput;

         case "C":
          return this.ui.clearer;

         case "G":
          return this.ui.searchGlassContainer;

         default:
          return $();
        }
      } else {
        return this.ui.searchGlassContainer;
      }
    },
    setFocusToInput: function() {
      this.lastFocused = "I";
      this.triggerMethod("changed:focus", this.lastFocused);
      this.ui.searchInput[0].focus();
    },
    setFocusToGlass: function() {
      this.lastFocused = "G";
      this.triggerMethod("changed:focus", this.lastFocused);
    },
    showSearchInput: function() {
      this.ui.searchBox.removeClass("binf-hidden");
      this.setIconAndState();
      this.setFocusToInput();
      this.triggerMethod("opened");
    },
    setIconAndState: function() {
      this.showInputField = true;
      this.$el.addClass("csui-searchbox-shown");
      this.options.isTypeAhead && this.ui.searchBox.attr("aria-controls", this.options.pickerListId);
      this.ui.searchGlassContainer.attr("title", lang.collapseSearch);
      setAriaAttr(this.ui.searchGlassContainer[0], "aria-label", lang.collapseSearchAria);
      setAriaAttr(this.ui.searchGlassContainer[0], "aria-expanded", null);
      this.options.isTypeAhead && this.ui.itemPicker.attr("aria-expanded", "true");
      if (this._svgCloseIcon) {
        this.$(".csui-table-search-icon otc-icon").attr("svg", this._svgCloseIcon);
      } else {
        this.searchGlassIconView.setIcon("csui_action_close32");
      }
    },
    hideAndClear: function(silent) {
      this.showInputField = false;
      this.ui.searchBox.addClass("binf-hidden").removeAttr("aria-controls");
      this.$el.removeClass("csui-searchbox-shown");
      this.ui.searchGlassContainer.attr("title", this.templateHelpers().search_icon_tooltip);
      setAriaAttr(this.ui.searchGlassContainer[0], "aria-label", this.templateHelpers().search_icon_tooltip);
      setAriaAttr(this.ui.searchGlassContainer[0], "aria-expanded", "false");
      if (this._svgSearchIcon) {
        this.$(".csui-table-search-icon otc-icon").attr("svg", this._svgSearchIcon);
      } else {
        this.searchGlassIconView.setIcon("csui_action_search32");
      }
      this.options.isTypeAhead && this.ui.itemPicker.attr("aria-expanded", "false");
      this.ui.clearer.addClass("binf-hidden");
      this.lastFocused = "I";
      if (this.filterTimeout) {
        clearTimeout(this.filterTimeout);
        this.filterTimeout = undefined;
      }
      this.hideAndClearPostAction(silent);
    },
    hideAndClearPostAction: function(silent) {
      if (!silent) {
        this.setValue();
        this.triggerMethod(this.valueChangedEventName, {
          column: this.options.column,
          keywords: ""
        });
      }
      this.lastFilterValue = undefined;
      this.triggerMethod("closed");
    },
    toggleSearch: function() {
      if (this.ui.searchBox.hasClass("binf-hidden")) {
        this.showSearchInput();
      } else {
        this.hideAndClear();
      }
    },
    showClearerIfFilterHasValue: function() {
      var filterValue = this.getValue();
      var filterHasValue = !!filterValue.length;
      if (filterHasValue) {
        this.ui.clearer.removeClass("binf-hidden");
      } else {
        this.ui.clearer.addClass("binf-hidden");
      }
      return filterValue;
    },
    getColumn: function() {
      return this.options.column;
    },
    getValue: function() {
      return this.ui.searchInput.val();
    },
    setValue: function(val) {
      val = val ? val : "";
      this.ui.searchInput.val(val);
      this.lastFilterValue = val;
    },
    getShown: function() {
      return !this.ui.searchBox.hasClass("binf-hidden");
    },
    setFocus: function() {
      var textLen = this.ui.searchInput.val().length;
      this.lastFocused = "I";
      if (this.ui.searchInput[0].setSelectionRange) {
        this.ui.searchInput.trigger("focus");
        this.ui.searchInput[0].setSelectionRange(textLen, textLen);
      } else {
        setTimeout(_.bind(function() {
          if (this.ui.searchInput[0].setSelectionRange) {
            this.ui.searchInput.trigger("focus");
            this.ui.searchInput[0].setSelectionRange(textLen, textLen);
          }
        }, this), 500);
      }
    },
    filterChanged: function() {
      var filterValue = this.showClearerIfFilterHasValue();
      if (this.lastFilterValue !== filterValue) {
        this.lastFilterValue = filterValue;
        var self = this;
        if (this.filterTimeout) {
          clearTimeout(this.filterTimeout);
        }
        this.filterTimeout = setTimeout(function() {
          self.filterTimeout = undefined;
          var keywords = self.getValue();
          self.triggerMethod(self.valueChangedEventName, {
            column: self.options.column,
            keywords: keywords
          });
        }, 1e3);
      }
    },
    _hasFilterValue: function() {
      var filterValue = this.ui.searchInput.val();
      return filterValue.length > 0;
    },
    _moveFocusLeft: function() {
      var filterHasValue = this._hasFilterValue();
      if (filterHasValue) {
        this.lastFocused = "C";
        this.triggerMethod("changed:focus", this.lastFocused);
      } else {
        this.lastFocused = "I";
        this.triggerMethod("changed:focus", this.lastFocused);
      }
    },
    _moveFocusRight: function() {
      var filterHasValue = this._hasFilterValue();
      if (filterHasValue) {
        this.lastFocused = "C";
        this.triggerMethod("changed:focus", this.lastFocused);
      } else {
        this.lastFocused = "G";
        this.triggerMethod("changed:focus", this.lastFocused);
      }
    },
    _searchFieldInputClicked: function(event) {
      this.setFocusToInput();
    },
    _searchFieldClearerClicked: function(event) {
      this.showInputField = true;
      this.setValue();
      this.ui.clearer.addClass("binf-hidden");
      this.lastFilterValue = "";
      this.setFocusToInput();
      this.triggerMethod(this.valueChangedEventName, {
        column: this.options.column,
        keywords: ""
      });
    },
    _searchFieldGlassClicked: function(event) {
      this.toggleSearch();
      if (!this.getShown()) {
        this.setFocusToGlass();
      }
    }
  });
  function setAriaAttr(el, attr, value) {
    if (el) {
      const tagName = el.tagName;
      if (tagName === "OTC-BUTTON" || tagName === "OTC-ICON") {
        attr = attr.replaceAll("-", "");
      }
      if (value == null) {
        el.removeAttribute(attr);
      } else {
        el.setAttribute(attr, value);
      }
    }
  }
  return SearchBoxView;
});