/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "i18n", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/utils/base", "dctmw/utils/client.location", "dctmw/utils/rest.resources", "hbs!d2/integration/commands/impl/embed.search.box", "hbs!d2/integration/commands/impl/embed.search.scope.item", "i18n!d2/integration/commands/impl/nls/lang", "css!d2/integration/commands/impl/embed.search.box" ], function(i18n, $, _, Backbone, Marionette, base, clientLocation, RestResources, template, itemTemplate, lang) {
  "use strict";
  var EmbedSearchScopeItemView = Marionette.ItemView.extend({
    tagName: "li",
    className: "search-scope-option",
    template: itemTemplate,
    constructor: function EmbedSearchScopeItemView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.$el.attr({
        tabindex: "-1",
        role: "menuitem",
        id: "o_" + this.model.get("id")
      });
    },
    ui: {
      searchScopeInput: ".search-scope"
    },
    events: {
      click: "_onItemClicked",
      keydown: "_inputKeyDown"
    },
    _inputKeyDown: function(event) {
      switch (event.keyCode) {
       case 9:
        break;

       case 13:
       case 32:
        event.stopPropagation();
        event.preventDefault();
        $(this.$el).trigger("click");
        break;

       case 27:
        this.options.parentView.ui.searchInput.trigger("focus");
        break;

       case 37:
       case 39:
        event.stopPropagation();
        event.preventDefault();
        break;

       case 38:
        var $prevItem = $(event.target).closest("li").prev();
        if ($prevItem.length > 0) {
          $prevItem.trigger("focus");
        } else {
          $(event.target).closest(".scope-dropdown-menu").find("li").last().trigger("focus");
        }
        event.preventDefault();
        event.stopPropagation();
        break;

       case 40:
        var $nextItem = $(event.target).closest("li").next();
        if ($nextItem.length > 0) {
          $nextItem.trigger("focus");
        } else {
          $(event.target).closest(".scope-dropdown-menu").find("li").first().trigger("focus");
        }
        event.preventDefault();
        event.stopPropagation();
        break;
      }
    },
    _onItemClicked: function(event) {
      event.stopPropagation();
      event.preventDefault();
      this.ui.searchScopeInput.prop("checked", true);
      this.trigger("select:scope");
    }
  });
  return Marionette.CompositeView.extend({
    constructor: function EmbedSearchView(options) {
      this._setSearchScopes(options);
      Marionette.CompositeView.prototype.constructor.apply(this, arguments);
      this.container = options.container;
    },
    childView: EmbedSearchScopeItemView,
    childViewContainer: "ul",
    childEvents: {
      "select:scope": "_selectScope"
    },
    childViewOptions: function() {
      return {
        parentView: this
      };
    },
    className: "d2-embedded-search",
    template: template,
    templateHelpers: {
      lang: lang
    },
    ui: {
      placeholderSearchIcon: ".icon-search-placeholder",
      searchInput: ".search",
      clearer: ".clearer",
      fadeout: ".fadeout",
      dropdownmenu: ".scope-dropdown-menu"
    },
    events: {
      "focusout @ui.searchInput": "_inputFocusOut",
      "focus @ui.searchInput": "_inputFocus",
      "click @ui.searchInput": "_inputClick",
      "keyup @ui.searchInput": "_inputChange",
      "paste @ui.searchInput": "_inputChange",
      "change @ui.searchInput": "_inputChange",
      "keydown @ui.searchInput": "_inputKeyDown",
      "keydown @ui.clearer": "_clearerKeyDown",
      "click @ui.placeholderSearchIcon": "_placeholderSearchIconClicked",
      "click @ui.clearer": "_searchFieldClearerClicked"
    },
    onRender: function() {
      this.ui.placeholderSearchIcon.hide();
      this.ui.searchInput.hide();
      this.ui.clearer.hide();
      this.ui.dropdownmenu.find('input:radio[data-id="folder_deep_search"]').prop("checked", true);
    },
    toggleSearchBox: function(options) {
      options = options || {};
      var me = this, direction = i18n.settings.rtl ? "left" : "right", inputEl = me.ui.searchInput;
      if (me._isSearchOpen()) {
        me.ui.clearer.hide();
        me.ui.placeholderSearchIcon.hide();
        me.ui.dropdownmenu.addClass("binf-hidden");
      } else {
        me.$el.parents(".csui-tabletoolbar").find(".csui-item-title").toggle(false);
      }
      inputEl.val("").toggle("blind", {
        direction: direction
      }, 200, function() {
        if (me._isSearchOpen()) {
          inputEl.prop("tabindex", "0");
          inputEl.trigger("focus");
          me.ui.placeholderSearchIcon.show();
          me.ui.fadeout.show();
          me.trigger("searchbox:show", options);
        } else {
          me.ui.fadeout.hide();
          me.trigger("searchbox:hide", options);
          me.$el.parents(".csui-tabletoolbar").find(".csui-item-title").toggle(true);
        }
      });
    },
    _executeSearch: function(value) {
      if (!value) {
        return;
      }
      var hashParams = {
        mode: "search",
        query: encodeURIComponent(value)
      }, selectedSearchScope = this.ui.dropdownmenu.find('input:radio[name="search-scope"]:checked').attr("data-id");
      if (this.container && selectedSearchScope !== "repository_search") {
        _.extend(hashParams, {
          folder_id: this.container.get("id"),
          descend: selectedSearchScope === "folder_deep_search"
        });
      }
      clientLocation.navigate({
        trigger: true,
        replace: false,
        hashParams: hashParams
      });
    },
    _showSearchScopeMenu: function() {
      this.ui.dropdownmenu.removeClass("binf-hidden");
    },
    _inputChange: function(event) {
      this._showSearchScopeMenu();
      var me = this, fn = function() {
        me.ui.clearer.toggle(!!me.ui.searchInput.val());
      };
      if (event.type === "paste") {
        setTimeout(fn);
      } else {
        fn();
      }
    },
    _inputFocus: function() {
      this._showSearchScopeMenu();
    },
    _inputKeyDown: function(event) {
      switch (event.keyCode) {
       case 13:
        this._stopEventPropagation(event);
        this._executeSearch(this.ui.searchInput.val());
        break;

       case 27:
        this._stopEventPropagation(event);
        if (this.ui.searchInput.val().length > 0) {
          this.ui.searchInput.val("").trigger("change");
        } else {
          this.toggleSearchBox();
        }
        break;

       case 40:
        this._stopEventPropagation(event);
        this.ui.dropdownmenu.find("li.search-scope-option").first().trigger("focus");
        break;

       case 9:
        if (!event.shiftKey) {
          if (this.ui.clearer.is(":visible")) {
            this._stopEventPropagation(event);
            this.ui.clearer.trigger("focus");
          }
        }
        break;

       case 32:
        event.stopPropagation();
        break;
      }
    },
    _clearerKeyDown: function(event) {
      switch (event.keyCode) {
       case 13:
       case 32:
        this._stopEventPropagation(event);
        this._searchFieldClearerClicked();
        break;
      }
    },
    _placeholderSearchIconClicked: function() {
      this.ui.searchInput.trigger("focus");
    },
    _searchFieldClearerClicked: function() {
      this.ui.searchInput.val("").trigger("change").trigger("focus");
    },
    _isSearchOpen: function() {
      return this.ui.searchInput.is && this.ui.searchInput.is(":visible");
    },
    _stopEventPropagation: function(event) {
      event.stopPropagation();
      event.preventDefault();
    },
    _setSearchScopes: function(options) {
      var currentRepository = RestResources.getCurrentRepository(), repositoryName = base.escapeHtml(currentRepository.get("description") || currentRepository.get("name"));
      options.collection = new Backbone.Collection([ {
        id: "repository_search",
        name: _.str.sformat(lang.searchScopeLabelRepo, "<span>'" + repositoryName + "'</span>")
      }, {
        id: "folder_search",
        name: lang.searchScopeLabelCurrentFolder
      }, {
        id: "folder_deep_search",
        name: lang.searchScopeLabelCurrentFolderDeep
      } ]);
    },
    _selectScope: function() {
      this.ui.searchInput.trigger("focus");
    },
    _inputFocusOut: _.debounce(function(event) {
      if (!$.contains(this.ui.dropdownmenu[0], event.relatedTarget)) {
        this.ui.dropdownmenu.addClass("binf-hidden");
      }
    }),
    clearSearchBox: function() {
      var me = this;
      if (me._isSearchOpen()) {
        me.ui.clearer.hide();
        me.ui.placeholderSearchIcon.hide();
        me.ui.dropdownmenu.addClass("binf-hidden");
        me.$el.parents(".csui-tabletoolbar").find(".csui-item-title").toggle(true);
      } else {
        me.$el.parents(".csui-tabletoolbar").find(".csui-item-title").toggle(false);
      }
    }
  });
});