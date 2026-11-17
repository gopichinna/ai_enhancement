/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "nuc/utils/base", "csui/utils/contexts/factories/application.scope.factory", "nuc/models/node/node.model", "csui/utils/contexts/factories/search.query.factory", "i18n!d2/widgets/navigation.header/controls/search/impl/nls/lang", "hbs!d2/widgets/navigation.header/controls/search/impl/search", "d2/widgets/navigation.header/controls/search/search.options.view", "css!d2/widgets/navigation.header/controls/search/impl/search" ], function(_, $, Marionette, base, ApplicationScopeModelFactory, NodeModel, SearchQueryModelFactory, lang, template, SearchOptionsView) {
  "use strict";
  var SearchView = Marionette.LayoutView.extend({
    template: template,
    className: "binf-form-group search-container",
    attributes: {
      "data-value": ""
    },
    regions: {
      regionSearchMenu: ".search-menu-container"
    },
    ui: {
      input: "input.textbox",
      clearButton: ".i-close",
      searchZone: ".search-wrapper"
    },
    events: {
      "input @ui.input": "valueUpdater",
      "keydown @ui.input": "onInputKeyDown",
      "keydown @ui.clearButton": "onClearButtonKeyDown",
      "click @ui.clearButton": "clearInput",
      "click @ui.input": "onInputFocusGain",
      "focusin @ui.input": "onInputFocusGain",
      "focusout @ui.input": "onInputFocusLoss",
      "mouseenter @ui.searchZone": "onSearchZoneActivated",
      "mouseleave @ui.searchZone": "onSearchZoneDeactivated"
    },
    constructor: function SearchView(options) {
      options || (options = {});
      var context = options.context;
      options.model = options.model || context.getModel(SearchQueryModelFactory);
      Marionette.LayoutView.call(this, options);
      this.applicationScope = options.applicationScope || context.getModel(ApplicationScopeModelFactory);
      this.selectedNodeId = null;
      this.listenTo(context, "sync:perspective", this.onPerspectiveSync);
      this.listenTo(context, "sync error", function() {
        var existingClause = this.model.get("where");
        if (!_.isEmpty(existingClause) && this.ui.input.length !== 0) {
          this.ui.input.val(existingClause);
          this.$el.attr("data-value", existingClause);
        }
      });
      this.viewSearchMenu = new SearchOptionsView({
        context: options.context,
        parentView: this
      });
      this.listenTo(this.viewSearchMenu, "change:selection", function(item, isTriggerKeyboard) {
        if (!isTriggerKeyboard) {
          this.focusInputButton();
        }
      });
      this.listenTo(this.viewSearchMenu, "focus:lost", function(isDirectionBackward) {
        if (isDirectionBackward === true) {
          this.focusInputButton();
        } else if (!_.isEmpty(this.ui.input.val())) {
          this.clearAttention();
          this.focusClearButton();
        } else {
          this.clearAttention();
        }
      });
      this.listenTo(this, "focus_text", this.focusInputButton);
      this.listenTo(this, "clear_attention", _.bind(function() {
        this.$el.removeClass("active");
        this.clearAttention();
      }, this));
      this.listenTo(this, "reset_text", this.clearInput);
    },
    templateHelpers: function() {
      return {
        searchPlaceHolder: lang.searchPlaceHolder,
        msCompatibleMode: base.isMSBrowser(),
        clearTooltip: lang.clearTooltip
      };
    },
    onRender: function() {
      if (this.viewSearchMenu) {
        this.getRegion("regionSearchMenu").show(this.viewSearchMenu);
      }
    },
    valueUpdater: _.throttle(function(event) {
      var $el = $(event.target);
      this.$el.attr("data-value", $el.val());
      this.updateTooltip();
    }, 50),
    onInputKeyDown: _.throttle(function(event) {
      switch (event.keyCode) {
       case 13:
        this.stopEventPropagation(event);
        this._setSearchQuery($(event.target).val());
        break;

       case 27:
        this.clearInput(event, true);
        break;

       case 9:
        if (!event.shiftKey) {
          if (this.viewSearchMenu && this.viewSearchMenu.$el.is(":visible")) {
            this.stopEventPropagation(event);
            this.viewSearchMenu.trigger("focus:set");
          } else if (this.ui.clearButton.is(":visible")) {
            this.stopEventPropagation(event);
            this.focusClearButton();
          } else {
            this.clearTooltip();
          }
        } else {
          this.clearAttention();
        }
        break;
      }
    }, 50),
    onClearButtonKeyDown: function(event) {
      switch (event.keyCode) {
       case 13:
       case 32:
        this.clearInput(event);
        break;

       case 9:
        if (event.shiftKey) {
          if (this.viewSearchMenu && this.viewSearchMenu.$el.is(":visible")) {
            this.stopEventPropagation(event);
            this.viewSearchMenu.trigger("focus:set");
          }
        }
        break;
      }
    },
    onPerspectiveSync: function(context, perspectiveSource) {
      if (perspectiveSource instanceof NodeModel && perspectiveSource.get("container")) {
        var nodeId = perspectiveSource.get("id");
        this.selectedNodeId = nodeId !== "repository" ? nodeId : null;
      } else {
        this.selectedNodeId = null;
      }
      if (this.applicationScope.get("id") !== "search") {
        this.clearInput(null, true);
      }
      this.clearAttention();
    },
    _setSearchQuery: function(value) {
      this.model.clear({
        silent: true
      });
      var params = {};
      if (value) {
        params["where"] = value;
      }
      if (this.viewSearchMenu) {
        if (this.applicationScope.get("id") === "node") {
          if (this.selectedNodeId) {
            if (this.viewSearchMenu.getSelectedOption() === "folder") {
              params["current-folder-id"] = this.selectedNodeId;
              params["descend"] = "false";
            } else if (this.viewSearchMenu.getSelectedOption() === "folder_and_subfolder") {
              params["current-folder-id"] = this.selectedNodeId;
              params["descend"] = "true";
            }
          }
        } else if (this.applicationScope.get("id") === "search") {
          if (this.viewSearchMenu.getSelectedOption() === "search_result") {
            params["filtered-search"] = "true";
          }
        }
      }
      this.model.set(params);
    },
    clearInput: function(event, looseFocusDeliberately) {
      if (event) {
        this.stopEventPropagation(event);
      }
      if (looseFocusDeliberately) {
        $("body [tabindex]")[0].focus();
      } else {
        this.focusInputButton();
      }
      this.ui.input.val("");
      this.$el.attr("data-value", "");
    },
    clearAttention: function() {
      this.$el.removeClass("attention");
      this.clearTooltip();
    },
    focusInputButton: function() {
      this.ui.input.trigger("focus");
    },
    focusClearButton: function() {
      this.ui.clearButton.trigger("focus");
    },
    onInputFocusGain: function(event) {
      this.$el.addClass("active");
      if (!this.$el.hasClass("attention")) {
        this.$el.addClass("attention");
      }
      this.updateTooltip();
      event && event.stopPropagation();
    },
    onInputFocusLoss: function(event) {
      if (!$.contains(this.regionSearchMenu.el, event.relatedTarget)) {
        this.$el.removeClass("active");
        this.clearAttention();
      }
    },
    onSearchZoneActivated: function() {
      this.mouseActive = true;
      $(document).off("click.searchinactive");
    },
    onSearchZoneDeactivated: function() {
      this.mouseActive = false;
      if (this.$el.hasClass("attention")) {
        $(document).on("click.searchinactive", function() {
          $(document).off("click.searchinactive");
          this.clearAttention();
        }.bind(this));
      }
    },
    updateTooltip: function() {
      if (this.ui.input.val() === "") {
        this.ui.input.attr("title", lang.activationTooltip);
        this.ui.input.attr("aria-label", lang.activationTooltip);
      } else {
        this.clearTooltip();
      }
    },
    clearTooltip: function() {
      this.ui.input.removeAttr("title aria-label");
    },
    stopEventPropagation: function(event) {
      event.stopPropagation();
      event.preventDefault();
    }
  });
  return SearchView;
});