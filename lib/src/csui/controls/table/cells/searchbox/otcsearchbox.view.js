/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/jquery", "csui/lib/underscore", "csui/lib/marionette", "i18n!csui/controls/table/impl/nls/lang", "smart/themes/theming", "csui/themes/csui.jato.action.icons", "hbs!csui/controls/table/cells/searchbox/otcsearchbox", "css!csui/controls/table/cells/searchbox/otcsearchbox", "csui/themes/carbonfiber/ot-icons/icons_csui_action" ], function($, _, Marionette, lang, theming, jatoIcons, template) {
  var OtcSearchBoxView = Marionette.ItemView.extend({
    className: "csui-table-column-otcsearch",
    template: template,
    templateHelpers: function() {
      return {
        isJatoTheme: theming.isJATOTheme(),
        search_value: this.lastFilterValue,
        iconName: "csui_action:action_search32",
        svgSearchIcon: jatoIcons["actionSearchSmall"],
        show_input: this.lastFilterValue !== undefined,
        search_icon_tooltip: _.str.sformat(lang.searchIconTooltip, this.options.columnTitle),
        search_placeholder: _.str.sformat(lang.searchPlaceholder, this.options.columnTitle),
        search_input_tooltip: _.str.sformat(lang.searchInputTooltip, this.options.columnTitle),
        search_clear_icon_tooltip: lang.searchClearIconTooltip,
        search_close_icon_tooltip: lang.collapseSearch,
        search_close_icon_arialabel: lang.collapseSearchAria
      };
    },
    ui: {
      otcSearchBox: ".csui-table-otcsearch-box",
      otcSearchInput: ".csui-table-otcsearch-input"
    },
    events: {
      keydown: "onKeyInView",
      "input @ui.otcSearchBox": "filterChanged",
      "opening @ui.otcSearchBox": "_searchFieldBoxOpening",
      "open @ui.otcSearchBox": "_searchFieldBoxOpen",
      "closing @ui.otcSearchBox": "_searchFieldBoxClosing",
      "close @ui.otcSearchBox": "_searchFieldBoxClose"
    },
    valueChangedEventName: "change:filterValue",
    constructor: function OtcSearchBoxView(filterValue, options) {
      this.options = options || {};
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.lastFilterValue = filterValue;
    },
    onRender: function() {
      this.ui.otcSearchBox.attr("tabindex", "0");
    },
    onDestroy: function() {
      if (this.filterTimeout) {
        clearTimeout(this.filterTimeout);
        this.filterTimeout = undefined;
      }
    },
    onKeyInView: function(event) {
      if (this.getShown()) {
        switch (event.keyCode) {
         case 37:
         case 39:
         case 35:
         case 36:
          event.stopPropagation();
          break;
        }
      }
    },
    currentlyFocusedElement: function() {
      return this.ui.otcSearchBox;
    },
    setFocusToInput: function() {
      this.ui.otcSearchInput[0]?.focus();
      this.triggerMethod("changed:focus");
    },
    setFocusToGlass: function() {
      this.ui.otcSearchInput[0]?.focus();
      this.triggerMethod("changed:focus");
    },
    showSearchInput: function() {
      this.ui.otcSearchBox.attr("isOpen", "");
    },
    setIconAndState: function() {
      this.showInputField = true;
      this.$el.addClass("csui-searchbox-shown");
    },
    hideAndClear: function(silent) {
      this.showInputField = false;
      this.ui.otcSearchBox.attr("isOpen", null);
      this.$el.removeClass("csui-searchbox-shown");
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
      if (!this.getShown()) {
        this.showSearchInput();
      } else {
        this.hideAndClear();
      }
    },
    showClearerIfFilterHasValue: function() {
      return this.getValue();
    },
    getColumn: function() {
      return this.options.column;
    },
    getValue: function() {
      return this.ui.otcSearchInput.val();
    },
    setValue: function(val) {
      val = val ? val : "";
      this.ui.otcSearchInput.val(val);
      this.lastFilterValue = val;
    },
    getShown: function() {
      return this.ui.otcSearchBox.attr("isOpen") != null;
    },
    setFocus: function() {
      this.ui.otcSearchInput[0].focus();
    },
    filterChanged: function() {
      var filterValue = this.getValue();
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
    _searchFieldBoxOpen: function() {
      this.setIconAndState();
      this.ui.otcSearchInput[0]?.focus();
    },
    _searchFieldBoxOpening: function() {
      this.triggerMethod("opened");
      this.showSearchInput();
    },
    _searchFieldBoxClose: function() {
      this.hideAndClear();
    },
    _searchFieldBoxClosing: function() {
      this.ui.otcSearchBox.one("close", () => {
        setTimeout(() => {
          this.ui.otcSearchBox[0].focus();
        }, 1);
      });
      this.ui.otcSearchBox.attr("isOpen", null);
    }
  });
  return OtcSearchBoxView;
});