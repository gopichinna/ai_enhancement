/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "smart/utils/smart.base", "nuc/lib/underscore", "nuc/lib/marionette", "hbs!smart/controls/facet.panel/impl/facet/facet.item", "i18n!smart/controls/facet.panel/impl/nls/lang", "css!smart/controls/facet.panel/impl/facet/facet.item" ], function($, smartBase, _, Marionette, template, lang) {
  var singleSelected;
  var FacetItemView = Marionette.ItemView.extend({
    template: template,
    className: "csui-facet-item",
    attributes: {
      role: "menuitem"
    },
    constructor: function FacetItemView(options = {}) {
      this.displayCountProps = options.displayCountProps, Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.showInputOnHover = !smartBase.isTouchBrowser();
      this.showButtonsInEachFacet = options.showButtonsInEachFacet;
      this.listenTo(this.model, "change:disabled", this._setDisabledCheckbox);
    },
    triggers: {
      "click .csui-filter-name": "select:facet:name"
    },
    ui: {
      name: ".csui-name",
      checkboxele: ".csui-checkbox"
    },
    events: {
      "change .csui-checkbox": "onChangeValue",
      "keydown .csui-checkbox": "onToggleCheckbox",
      "keydown .csui-filter-name": "onToggleCheckbox"
    },
    templateHelpers: function() {
      var showOnHover = this.showInputOnHover ? "" : "csui-showAlways", count = this.options.model.get("count") ?? this.options.model.get("total"), filterTitleAria, filterCheckboxAria, filterTitle, displayCount = this.displayCountProps?.threshold ? count > this.displayCountProps?.threshold : !!this.displayCountProps?.showCount || this.displayCountProps?.showCount === undefined ? count !== null && count !== undefined ? true : false : false;
      filterTitleAria = displayCount ? _.str.sformat(lang.filterTitleAria, this.options.model.get("name"), count) : _.str.sformat(lang.filterTitleAriaNoDisplayCount, this.options.model.get("name"));
      filterCheckboxAria = displayCount ? _.str.sformat(lang.filterCheckboxAria, this.options.model.get("name"), count) : _.str.sformat(lang.filterCheckboxAriaNoDisplayCount, this.options.model.get("name"));
      filterTitle = displayCount ? _.str.sformat(lang.filterTitle, this.options.model.get("name"), count) : this.options.model.get("name");
      let checkedAria = this.model.get("facetItemChecked") || false, checkboxTitle = displayCount ? _.str.sformat(lang.filterTitleAria, this.model.get("name"), count) : _.str.sformat(lang.filterTitleAriaNoDisplayCount, this.model.get("name")), checkboxAriaLabel = displayCount ? _.str.sformat(lang.filterCheckboxAria, this.model.get("name"), count) : _.str.sformat(lang.filterCheckboxAriaNoDisplayCount, this.model.get("name"));
      return {
        showOnHover: showOnHover,
        count: count,
        enableCheckBox: this.options.enableCheckBoxes,
        displayCount: displayCount,
        filterTitleAria: filterTitleAria,
        filterCheckboxAria: filterCheckboxAria,
        filterTitle: filterTitle,
        checkedAria: checkedAria,
        checkboxTitle: checkboxTitle,
        checkboxAriaLabel: checkboxAriaLabel
      };
    },
    onRender: function() {
      this.triggerMethod("dom:refresh");
      if (this.showButtonsInEachFacet !== undefined && !this.showButtonsInEachFacet && this.model.get("checked")) {
        this.selectItem();
      }
    },
    selectItem: function() {
      this.model.set("facetItemchecked", true);
      this.ui.checkboxele.attr("checked", true);
      this.ui.checkboxele.attr("aria-checked", true);
    },
    onToggleCheckbox: function(event) {
      var keyCode = event.keyCode, target = $(event.target);
      switch (keyCode) {
       case 39:
       case 37:
        break;

       case 38:
       case 40:
        this.triggerMethod("keyupdown", keyCode === 38, target);
        break;

       default:
        return true;
      }
      return false;
    },
    onChangeValue: function(event) {
      var checkbox = event.target, isMultiselect = this.model.get("multiselect") || this.model.get("multiselect") === undefined, isShowButtonsInEachFacet = this.showButtonsInEachFacet || this.showButtonsInEachFacet === undefined;
      if (this.model.get("facetItemchecked")) {
        this.model.set("facetItemchecked", false);
        if (!isShowButtonsInEachFacet) {
          this.ui.checkboxele.removeAttr("altstyle");
          !isMultiselect && this.triggerMethod("set:single:unselect", this);
          this.triggerMethod("multi:filter:unselect", this);
        } else {
          this.triggerMethod("multi:filter:select", this);
        }
      } else {
        if (isMultiselect) {
          this.model.set("facetItemchecked", true);
          this.triggerMethod("multi:filter:select", this);
          this.ui.checkboxele.removeAttr("altstyle");
        } else {
          if (!this.showButtonsInEachFacet) {
            this.removeSingleSelect(singleSelected);
            this.model.set("facetItemchecked", true);
            this.ui.checkboxele.addClass("single-select-facet");
            this.ui.checkboxele.attr("altstyle", "");
            checkbox.checked = true;
            this.triggerMethod("set:single:select", this);
            this.triggerMethod("single:filter:select", this);
            singleSelected = this;
          }
        }
      }
      this.isRendered && this.ui?.checkboxele?.attr("aria-checked", checkbox.checked);
      let facetName = checkbox?.closest(".csui-facet-item")?.querySelector(".csui-name");
      if (checkbox.checked) {
        facetName?.classList?.add("smart-selected-name");
      } else {
        facetName?.classList?.remove("smart-selected-name");
      }
    },
    removeSingleSelect: function(singelselected) {
      if (singelselected) {
        singelselected.model.set("facetItemchecked", false);
        var singleSelectedCheckbox = singelselected.$el.find(".csui-checkbox");
        singleSelectedCheckbox.removeAttr("altstyle");
        let facetName = singleSelectedCheckbox[0]?.closest(".csui-facet-item")?.querySelector(".csui-name");
        facetName?.classList?.remove("smart-selected-name");
        singleSelectedCheckbox.attr("aria-checked", false);
        singleSelectedCheckbox.attr("checked", false);
        this.triggerMethod("set:single:unselect", singelselected);
      }
    },
    _setDisabledCheckbox: function() {
      this.ui.checkboxele.prop("disabled", this.model.get("disabled"));
    },
    onFocus: function(event) {
      var facet = $(event.target).closest(".csui-facet");
      if (facet.length > 0) {
        facet.addClass("csui-focus");
      }
    },
    onBlur: function(event) {
      var facet = $(event.target).closest(".csui-facet");
      if (facet.length > 0) {
        facet.removeClass("csui-focus");
      }
    },
    getIndex: function() {
      return this._index;
    }
  });
  return FacetItemView;
});