/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "d2/widgets/navigation.header/controls/search/search.view", "dctmw/utils/authenticators/session", "i18n!d2/widgets/navigation.header/controls/search/impl/nls/lang", "hbs!d2/widgets/navigation.header/controls/search/impl/legacy.search.view", "css!d2/widgets/navigation.header/controls/search/impl/legacy.search.view" ], function(module, _, $, Marionette, TabableRegionBehavior, SearchView, Session, lang, template) {
  "use strict";
  var LegacySearchView = Marionette.LayoutView.extend({
    className: "d2-search-box",
    template: template,
    ui: {
      searchButton: ".d2-search-button",
      searchTextBox: ".d2-search-textbox"
    },
    regions: {
      searchTextBoxSection: ".d2-search-textbox"
    },
    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },
    templateHelpers: function() {
      return {
        title: lang.searchToolTip
      };
    },
    currentlyFocusedElement: "div.d2-search-interaction",
    constructor: function LegacySearchView(options) {
      var session = Session.get();
      Marionette.LayoutView.call(this, options);
      this.listenTo(session, "begin", () => {
        this._hideSearchTextbox();
      });
    },
    events: {
      "click .d2-search-button": "onClickSearch",
      "keydown .d2-search-interaction": "onKeyDownSearch",
      "keydown .search-container input": "inputTyped"
    },
    inputTyped: function(event) {
      if (event.keyCode === 27) {
        this._hideSearchTextbox();
      }
      event.stopPropagation();
    },
    onClickSearch: function(event) {
      this._clickSearchButton();
      event.stopPropagation();
    },
    onKeyDownSearch: function(event) {
      if (event.keyCode === 32 || event.keyCode === 13) {
        this._clickSearchButton();
        event.stopPropagation();
      }
    },
    _clickSearchButton: function() {
      if (this.searchFocused) {
        this._hideSearchTextbox();
      } else {
        this._showSearchTextbox();
      }
    },
    _showSearchTextbox: function() {
      var self = this;
      this.$el.parent().addClass("search-open");
      $(".binf-navbar-brand").removeClass("binf-navbar-collapse");
      this.ui.searchTextBox.show("blind", {
        direction: "right"
      }, "200", function() {
        self.searchView.trigger("focus_text");
      });
      self.searchFocused = true;
      self._updateButtonIcon();
    },
    _hideSearchTextbox: function() {
      var self = this;
      this.ui.searchTextBox.hide("blind", {
        direction: "right"
      }, "200", function() {
        self.$el.parent().removeClass("search-open");
        $(".binf-navbar-brand").addClass("binf-navbar-collapse");
        self.searchView.trigger("focus_text");
      });
      self.searchFocused = false;
      self.searchView.trigger("reset_text");
      self._updateButtonIcon();
    },
    _updateButtonIcon: function() {
      if (this.searchFocused) {
        this.ui.searchButton.addClass("search-close-icon");
        this.ui.searchButton.removeClass("search-magnifier-icon");
      } else {
        this.ui.searchButton.addClass("search-magnifier-icon");
        this.ui.searchButton.removeClass("search-close-icon");
      }
    },
    onRender: function() {
      var context = this.options.context;
      this.searchView = new SearchView({
        context: context,
        parentView: this
      });
      this.getRegion("searchTextBoxSection").show(this.searchView);
      this._updateButtonIcon();
    }
  });
  return LegacySearchView;
});