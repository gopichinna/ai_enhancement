/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/jquery", "csui/lib/underscore", "csui/lib/marionette3", "smart/themes/theming", "csui/themes/csui.jato.action.icons", "i18n!csui/perspective.manage/sidebar/impl/nls/lang", "hbs!csui/perspective.manage/sidebar/impl/search.widget", "css!csui/perspective.manage/sidebar/impl/search.widget" ], function($, _, Marionette, theming, jatoActionIcons, lang, template) {
  "use strict";
  let SearchWidgetView = Marionette.View.extend({
    template: template,
    templateContext: function() {
      return {
        titleClearIcon: lang.titleClearIcon,
        widgetSearchPlaceholder: lang.widgetSearchPlaceholder,
        titleSearchIcon: lang.titleSearchIcon,
        isJato: theming.isJATOTheme(),
        jatoClearIcon: jatoActionIcons.actionCloseExtraSmall,
        jatoSearchIcon: jatoActionIcons.actionSearchSmall
      };
    },
    tagName: "div",
    ui: {
      searchInput: ".search-widget.cs-search",
      searchclear: ".search-widget.cs-search-clear"
    },
    events: {
      "keyup @ui.searchInput": "onKeyUp",
      "keydown @ui.searchInput": "onKeyDownsearchInput",
      "click @ui.searchclear": "onClickClear",
      "keydown @ui.searchclear": "onClickClear",
      "input @ui.searchInput": "onSearchInput"
    },
    constructor: function SearchWidgetView(options) {
      this.options = options || {};
      Marionette.View.prototype.constructor.apply(this, arguments);
    },
    onRender: function() {
      this.ui.searchInput.show();
      this.updateClearStyle();
    },
    updateClearStyle: function() {
      let clear = this.ui.searchInput.val()?.length > 0;
      this.ui.searchclear.toggleClass("binf-hidden", !clear);
    },
    onClickClear: function(event) {
      if (event.type === "click" || event.key === "Enter") {
        this.ui.searchInput.val("");
        this.updateClearStyle();
        this.ui.searchInput[0].focus();
        this.trigger("search:closed");
      }
    },
    onKeyUp: function(e) {
      this.updateClearStyle();
      if (this.ui.searchInput.val() === "") {
        const nonClearKeys = [ "Tab", "Enter", "Shift", "ArrowUp", "ArrowDown" ];
        if (!nonClearKeys.includes(e.key)) {
          this.trigger("item:clear");
          this.ui.searchInput.removeAttr("aria-activedescendant");
        }
      }
    },
    onKeyDownsearchInput: function(e) {
      switch (e.key) {
       case "Tab":
        if ($(this.ui.searchclear).is(":visible")) {
          if (e.shiftKey && e.key === "Tab") {
            this.updateClearStyle();
          } else {
            e.preventDefault();
            e.stopPropagation();
            this.ui.searchclear[0].focus();
          }
        }
        break;
      }
    },
    onSearchInput: function(event) {
      let query = $(event.target).val().split(" ").join("").trim().toLowerCase();
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
      }
      this.searchTimeout = setTimeout(() => {
        this.trigger("search:performed", query);
        if (query.length === 0) {
          this.trigger("search:closed");
        }
      }, 200);
    }
  });
  return SearchWidgetView;
});