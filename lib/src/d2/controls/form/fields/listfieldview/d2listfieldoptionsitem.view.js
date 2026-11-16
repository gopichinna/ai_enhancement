/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "d2/utils/mass.update.utils", "dctmw/utils/utils", "hbs!d2/controls/form/impl/d2list/d2listfieldoptions.item.view", "i18n" ], function(_, $, Backbone, Marionette, MassUpdateUtils, utils, OptionsItemViewTemplate, i18n) {
  "use strict";
  return Marionette.ItemView.extend({
    template: OptionsItemViewTemplate,
    tagName: "li",
    className: "d2-selectedList",
    ui: {
      option: "a",
      iconContainer: ".d2-listfield-icon-container"
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
        utils.isMobile() ? this.render() : this.updateSelectionState();
        if (event.keyCode === 13 || event.keyCode === 32) {
          this.ui.option.trigger("focus");
        }
      });
    },
    onRender: function() {
      var searchText = this.model.collection.getOptionsFilter("searchText"), searchRegex = searchText && new RegExp(searchText, "gi"), name = this.model.get("name"), optionContainer = this.$el.find("a span.d2-listfield-text-container");
      if (searchRegex) {
        optionContainer.html(name.toString().replace(searchRegex, function(matchT) {
          return "<span class='d2-highlight-options'>" + matchT + "</span>";
        }));
        searchRegex.source.trim().toLowerCase() === name.toString().trim().toLowerCase() ? this.model.set("exactMatch", true) : this.model.set("exactMatch", false);
      }
      if (this.options.parentView.options.parentView.model.get("options").massUpdateFileCount && MassUpdateUtils.fieldHasMultipleValues(this.model.get("id"))) {
        this.$el.hide();
      }
      if (this?.options?.parentView?.options?.showOptionsInHierarchy) {
        this._applyHierarchyCSS();
      }
    },
    onClickOption: function(event) {
      event.preventDefault();
      event.stopPropagation();
      if (this.model.get("options")?.disabled) {
        return;
      }
      var selected = !!this.model.get("selected");
      this.model.set("selected", !selected, event);
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
      if (this.model.get("selected")) {
        this.ui.iconContainer.addClass("d2-icon-checkmark");
      } else {
        this.ui.iconContainer.removeClass("d2-icon-checkmark");
      }
    },
    _applyHierarchyCSS: function() {
      var optionsAnchorTag = this.$el.find("a"), optionContainer = this.$el.find("a span.d2-listfield-text-container"), disabled = this.model.get("options")?.disabled, level = this.model.get("options")?.level, labelPathString = this.model.get("options")?.labelPathString, description = this.model.get("options")?.d, isRtl = i18n && i18n.settings.rtl;
      if (level) {
        if (isRtl) {
          optionsAnchorTag[0].style.paddingRight = level === 1 ? "28px" : level * 24 + "px";
          optionsAnchorTag[0].title = labelPathString.split("›").reverse().join(" ");
        } else {
          optionsAnchorTag[0].style.paddingLeft = level === 1 ? "28px" : level * 24 + "px";
          optionsAnchorTag[0].title = labelPathString.split("›").join(" ");
        }
      }
      if (description) {
        optionsAnchorTag[0].title = description;
      }
      if (disabled) {
        optionContainer[0].style.color = "#999";
      }
    }
  });
});