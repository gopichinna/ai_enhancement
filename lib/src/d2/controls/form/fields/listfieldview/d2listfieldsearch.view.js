/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "dctmw/utils/utils", "i18n!d2/controls/form/impl/nls/lang", "i18n!csui/controls/form/impl/nls/lang", "hbs!d2/controls/form/impl/d2list/d2listfieldsearchview" ], function(_, $, Backbone, Marionette, utils, lang, CsuiLang, searchFieldTemplate) {
  "use strict";
  var D2ListFieldSearchFieldView = Marionette.ItemView.extend({
    template: searchFieldTemplate,
    className: "d2-listfield-search",
    ui: {
      writeField: "input",
      toolBar: ".d2list-search-toolbar",
      optionsViewButton: ".d2list-search-toolbar .options-view-button",
      consolidatedViewButton: ".d2list-search-toolbar .consolidated-view-button"
    },
    events: {
      "mouseup @ui.writeField": "onMouseUpWriteField",
      "mousedown @ui.optionsViewButton": "onMouseOptionsViewButton",
      "mousedown @ui.consolidatedViewButton": "onMouseConsolidatedViewButton",
      "keydown @ui.writeField": "onKeyDownWriteField",
      "keydown @ui.optionsViewButton": "onKeyDownOptionsViewButton",
      "keydown @ui.consolidatedViewButton": "onKeyDownConsolidatedViewButton"
    },
    templateHelpers: function() {
      var isRequired = this.options.alpacaField && this.options.alpacaField.isRequired();
      return {
        ariaRequired: isRequired,
        emptyLabel: this.options.mode === "writeonly" ? lang.selectFieldEmptyFieldLabel : CsuiLang.noValueSet,
        idBtnLabel: this.options.labelId,
        lang: lang
      };
    },
    constructor: function() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },
    onRender: function() {
      this.ui.writeField.on("keyup", {
        view: this
      }, _.throttle(_.bind(this.onKeyUpWriteField, this), 200, {
        leading: false
      }));
      this.setValue("");
      this.ui.consolidatedViewButton.hide();
    },
    onMouseUpWriteField: function() {
      if (!this.options.parentView.enabled) {
        return false;
      }
      if (!this.isConsolidatedViewActive()) {
        this.triggerMethod("activate:options");
      }
      if (utils.isMobile()) {
        this.ui.writeField.trigger("blur");
      }
    },
    onKeyUpWriteField: function(event) {
      if (!this.options.parentView.enabled) {
        return false;
      }
      if (event.keyCode === 9 || event.keyCode === 13) {
        return;
      }
      var keyword = $(event.target).val();
      this.triggerMethod("update:search:filter", keyword);
    },
    onKeyDownWriteField: function(event) {
      var focussedButton = this.ui.toolBar.find(".d2-focus");
      if (event.keyCode === 9 && !event.shiftKey) {
        event.stopPropagation();
        event.preventDefault();
        if (focussedButton.length === 1) {
          focussedButton.removeClass("d2-focus");
          this.triggerMethod("focus:active:container");
        } else {
          var visibleToolbarButton = this.ui.toolBar.find("a:visible");
          visibleToolbarButton.addClass("d2-focus");
          visibleToolbarButton.trigger("focus");
        }
      }
      if (event.keyCode === 13 && this.options.isEditableList === true) {
        var value = $(event.target).val();
        if (value.length > 0) {
          this.triggerMethod("add:new:item", event);
          this.addNewActive = false;
          this.setFocus();
        }
      }
    },
    onMouseOptionsViewButton: function(event) {
      if (!this.options.parentView.enabled) {
        return false;
      }
      event.stopPropagation();
      event.preventDefault();
      this.setValue("");
      this.setFocus();
      this.triggerMethod("activate:options");
    },
    onMouseConsolidatedViewButton: function(event) {
      event.stopPropagation();
      event.preventDefault();
      if (this.ui.consolidatedViewButton.hasClass("d2-active")) {
        this.toggleConsolidatedViewButton(false);
        this.triggerMethod("activate:options");
      } else {
        this.triggerMethod("activate:selected:view");
      }
    },
    addNewItemPlaceHolder: function() {
      this.setFocus();
      this.ui.writeField.attr("placeholder", lang.typeNew);
      this.addNewActive = true;
    },
    setFocus: function() {
      this.ui.writeField.attr("placeholder", lang.selectFieldEmptyFieldLabel);
      if (!utils.isMobile()) {
        this.ui.writeField.trigger("focus");
      }
    },
    setValue: function(value) {
      this.ui.writeField.val(value);
    },
    showToolbar: function(option) {
      this.ui.toolBar.find(".d2-focus").removeClass("d2-focus");
      if (option === "showConsolidatedViewButton") {
        this.ui.optionsViewButton.hide();
        this.toggleConsolidatedViewButton(false);
        this.ui.consolidatedViewButton.show();
      } else if (option === "showOptionsViewButton") {
        this.ui.optionsViewButton.show();
        this.toggleConsolidatedViewButton(false);
        this.ui.consolidatedViewButton.hide();
      } else if (option === "showActiveConsolidatedViewButton") {
        this.toggleConsolidatedViewButton(true);
      }
    },
    isConsolidatedViewActive: function() {
      return this.ui.consolidatedViewButton.hasClass("d2-active");
    },
    toggleConsolidatedViewButton: function(flag) {
      var title = flag ? lang.select : lang.showSelected;
      if (flag) {
        this.ui.consolidatedViewButton.addClass("d2-active");
      } else {
        this.ui.consolidatedViewButton.removeClass("d2-active");
      }
      this.ui.consolidatedViewButton.attr({
        title: title,
        "aria-label": title
      });
    },
    enableDisableField: function(enabled) {
      if (enabled) {
        this.$el.removeClass("binf-hidden");
        $(this.ui.writeField).attr("placeholder", lang.selectFieldEmptyFieldLabel);
        this.$el.removeClass("d2-listfield-search-box-disabled");
      } else {
        if (this.options.selected.length === 0) {
          this.$el.addClass("d2-listfield-search-box-disabled");
          $(this.ui.writeField).attr("placeholder", CsuiLang.noValueSet);
        } else {
          $(this.ui.writeField).attr("placeholder", "");
          this.$el.addClass("binf-hidden");
        }
      }
    },
    onKeyDownConsolidatedViewButton: function(event) {
      if (event.which === 13) {
        this.onMouseConsolidatedViewButton(event);
      }
      if (event.keyCode === 9 && !event.shiftKey) {
        this.triggerMethod("focus:active:container");
        event.stopPropagation();
        event.preventDefault();
      }
    },
    onKeyDownOptionsViewButton: function(event) {
      if (event.which === 13) {
        this.onMouseOptionsViewButton(event);
      }
    }
  });
  return D2ListFieldSearchFieldView;
});