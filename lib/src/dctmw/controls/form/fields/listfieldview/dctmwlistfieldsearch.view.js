/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "smart/themes/theming", "dctmw/utils/icons/dctmw.jato.action.icons", "dctmw/utils/utils", "i18n!dctmw/controls/form/impl/nls/lang", "i18n!csui/controls/form/impl/nls/lang", "hbs!dctmw/controls/form/impl/dctmwlist/dctmwlistfieldsearchview" ], function(_, $, Backbone, Marionette, theming, JatoActionIcons, utils, lang, CsuiLang, searchFieldTemplate) {
  "use strict";
  var DctmwListFieldSearchFieldView = Marionette.ItemView.extend({
    template: searchFieldTemplate,
    className: "dctmw-listfield-search",
    ui: {
      writeField: "input",
      toolBar: ".dctmwlist-search-toolbar",
      optionsViewButton: ".dctmwlist-search-toolbar .options-view-button",
      consolidatedViewButton: ".dctmwlist-search-toolbar .consolidated-view-button",
      consolidatedViewIconContainer: ".consolidated-view-button > otc-icon",
      addNewItemButton: ".dctmwlist-search-toolbar .direct-addition-view-button"
    },
    events: {
      "mouseup @ui.writeField": "onMouseUpWriteField",
      "mousedown @ui.optionsViewButton": "onMouseOptionsViewButton",
      "mousedown @ui.consolidatedViewButton": "onMouseConsolidatedViewButton",
      "keydown @ui.writeField": "onKeyDownWriteField",
      "keydown @ui.optionsViewButton": "onKeyDownOptionsViewButton",
      "keydown @ui.consolidatedViewButton": "onKeyDownConsolidatedViewButton",
      "mousedown @ui.addNewItemButton": "onMouseDownAddNewItem",
      "keydown @ui.addNewItemButton": "onKeyDownAddNewItem"
    },
    templateHelpers: function() {
      var isRequired = this.options.alpacaField && this.options.alpacaField.isRequired();
      return {
        isJato: theming.isJATOTheme(),
        arrowDownSVG: JatoActionIcons.actionChevronLargeDown,
        actionListSVG: JatoActionIcons.actionList,
        actionListOpenSVG: JatoActionIcons.actionList,
        addActionSVG: JatoActionIcons.actionAdd,
        ariaRequired: isRequired,
        emptyLabel: this.options.mode === "writeonly" ? lang.selectFieldEmptyFieldLabel : CsuiLang.noValueSet,
        idBtnLabel: this.options.labelId,
        lang: lang,
        allowDirectAddition: this.options.alpacaField.options.emptyDataSource
      };
    },
    constructor: function DctmwListFieldSearchView() {
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
      if (!this.options.alpacaField.options.emptyDataSource) {
        if (!this.isConsolidatedViewActive()) {
          this.triggerMethod("activate:options");
        }
      }
    },
    onKeyUpWriteField: function(event) {
      if (this.options.alpacaField.options.emptyDataSource) {
        return false;
      }
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
      var focussedButton = this.ui.toolBar.find(".dctmw-focus");
      if (event.keyCode === 9 && !event.shiftKey) {
        event.stopPropagation();
        event.preventDefault();
        if (focussedButton.length === 1) {
          focussedButton.removeClass("dctmw-focus");
          this.triggerMethod("focus:active:container");
        } else {
          var visibleToolbarButton = this.ui.toolBar.find(theming.isJATOTheme() ? "otc-button:visible" : "a:visible");
          visibleToolbarButton.addClass("dctmw-focus");
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
      if (this.ui.consolidatedViewButton.hasClass("dctmw-active")) {
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
      this.ui.writeField.trigger("focus");
    },
    setValue: function(value) {
      this.ui.writeField.val(value);
    },
    showToolbar: function(option) {
      this.ui.toolBar.find(".dctmw-focus").removeClass("dctmw-focus");
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
      return this.ui.consolidatedViewButton.hasClass("dctmw-active");
    },
    toggleConsolidatedViewButton: function(flag) {
      var title = flag ? lang.select : lang.showSelected;
      if (theming.isJATOTheme()) {
        this.ui.consolidatedViewIconContainer.attr("svg", flag ? JatoActionIcons.dctmw_actionListActive : JatoActionIcons.actionList);
      }
      if (flag) {
        this.ui.consolidatedViewButton.addClass("dctmw-active");
      } else {
        this.ui.consolidatedViewButton.removeClass("dctmw-active");
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
        this.$el.removeClass("dctmw-listfield-search-box-disabled");
      } else {
        if (this.options.selected.length === 0) {
          this.$el.addClass("dctmw-listfield-search-box-disabled");
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
    },
    onKeyDownAddNewItem: function(event) {
      this.onMouseDownAddNewItem(event);
    },
    onMouseDownAddNewItem: function(event) {
      event.target = this.ui.writeField[0];
      var value = $(event.target).val();
      if (value.length > 0) {
        this.triggerMethod("add:new:item", event);
        this.addNewActive = false;
        this.setFocus();
      }
    }
  });
  return DctmwListFieldSearchFieldView;
});