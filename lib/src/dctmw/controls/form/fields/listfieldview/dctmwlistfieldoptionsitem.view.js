/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "dctmw/utils/utils", "hbs!dctmw/controls/form/impl/dctmwlist/dctmwlistfieldoptions.item.view", "i18n" ], function(_, $, Backbone, Marionette, utils, OptionsItemViewTemplate, i18n) {
  "use strict";
  return Marionette.ItemView.extend({
    template: OptionsItemViewTemplate,
    tagName: "li",
    className: "dctmw-selectedList",
    ui: {
      option: ".dctmw-list-option-item"
    },
    events: {
      mousedown: "onClickOption",
      keydown: "onKeyDownItem",
      focusout: "onFocusOutItem"
    },
    constructor: function() {
      var me = this;
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.listenTo(this.model, "change:selected", function(model, changedValue, event) {
        var fieldCollection = me.options.parentView.fieldCollection;
        if (fieldCollection) {
          var matchModel = fieldCollection.find(function(fieldModel) {
            return fieldModel.get("id") === me.model.get("id");
          });
          if (matchModel) {
            matchModel.set("selected", changedValue);
          }
        }
        this.updateSelectionState();
        if (event.keyCode === 13 || event.keyCode === 32) {
          this.ui.option.trigger("focus");
        }
      });
    },
    onRender: function() {
      var searchText = this.model.collection.getOptionsFilter("searchText"), searchRegex = searchText && new RegExp(searchText, "gi"), name = this.model.get("name"), optionContainer = this.$el.find("span.dctmw-list-option-item-name");
      if (searchRegex) {
        optionContainer.html(name.toString().replace(searchRegex, function(matchT) {
          return "<span class='dctmw-highlight-options'>" + matchT + "</span>";
        }));
        searchRegex.source.trim().toLowerCase() === name.toString().trim().toLowerCase() ? this.model.set("exactMatch", true) : this.model.set("exactMatch", false);
      }
      if (this?.options?.parentView?.options?.showOptionsInHierarchy) {
        this._applyHierarchyCSS();
      }
    },
    onClickOption: function(event) {
      event.preventDefault();
      event.stopPropagation();
      if ($(event.target)?.hasClass("dctmw-list-option-item")) {
        this.optionClick = true;
      }
      if (this.model.get("options")?.disabled) {
        return;
      }
      var selected = !!this.model.get("selected");
      this.model.set("selected", !selected, event);
      delete this.optionClick;
    },
    getItemSelector: function() {
      return "a";
    },
    onKeyDownItem: function(event) {
      var $currentItem, itemSelector = this.getItemSelector();
      switch (event.which) {
       case 38:
        $currentItem = $(event.target).closest("li");
        $currentItem.prev().find(itemSelector).trigger("focus");
        event.preventDefault();
        event.stopPropagation();
        break;

       case 40:
        $currentItem = $(event.target).closest("li");
        $currentItem.next().find(itemSelector).trigger("focus");
        event.preventDefault();
        event.stopPropagation();
        break;

       case 13:
       case 32:
        this.onClickOption(event);
        break;

       default:
        return;
      }
    },
    onFocusOutItem: function(event) {
      event.preventDefault();
      event.stopPropagation();
    },
    updateSelectionState: function() {
      if (!this.optionClick) {
        if (this.model.get("selected")) {
          this.$("otc-checkbox").attr("checked", "");
        } else {
          this.$("otc-checkbox").removeAttr("checked", "");
        }
      }
    },
    _applyHierarchyCSS: function() {
      var optionContainer = this.$el.find("span"), disabled = this.model.get("options")?.disabled, level = this.model.get("options")?.level, labelPathString = this.model.get("options")?.labelPathString, description = this.model.get("options")?.d, isRtl = i18n && i18n.settings.rtl;
      if (level) {
        if (isRtl) {
          optionContainer[0].style.paddingRight = level === 1 ? "28px" : level * 24 + "px";
          optionContainer[0].title = labelPathString.split("›").reverse().join(" ");
        } else {
          optionContainer[0].style.paddingLeft = level === 1 ? "28px" : level * 24 + "px";
          optionContainer[0].title = labelPathString.split("›").join(" ");
        }
      }
      if (description) {
        optionContainer[0].title = description;
      }
      if (disabled) {
        optionContainer[0].style.color = "#999";
      }
    }
  });
});