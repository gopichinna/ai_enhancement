/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/handlebars", "nuc/lib/backbone", "smart/utils/smart.base", "nuc/lib/underscore", "nuc/lib/marionette", "hbs!smart/controls/facet.panel/impl/facet/facet.item", "i18n!smart/controls/facet.panel/impl/nls/lang", "css!smart/controls/facet.panel/impl/facet/facet.item" ], function($, Handlebars, Backbone, smartBase, _, Marionette, template, lang) {
  const prepareHitHighlightArray = (summary, query) => {
    const result = [];
    let currentIndex = 0;
    const caseInsensitiveQuery = query.toLowerCase();
    while (currentIndex < summary.length) {
      const index = summary.toLowerCase().indexOf(caseInsensitiveQuery, currentIndex);
      if (index === -1) {
        result.push(summary.substring(currentIndex));
        break;
      } else {
        if (index > currentIndex) {
          result.push(summary.substring(currentIndex, index));
        }
        const highlightedText = summary.substring(index, index + query.length);
        result.push({
          text: highlightedText
        });
        currentIndex = index + query.length;
      }
    }
    return result;
  };
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
      this.stopListening(this.model, "change:disabled").listenTo(this.model, "change:disabled", this._setDisabledCheckbox.bind(this));
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
      let showOnHover = this.showInputOnHover ? "" : "csui-showAlways", displayName, count = this.options.model.get("count") ?? this.options.model.get("total"), filterTitleAria, filterCheckboxAria, filterTitle, name = this.options.model.get("name"), displayCount = this.displayCountProps?.threshold ? count > this.displayCountProps?.threshold : !!this.displayCountProps?.showCount || this.displayCountProps?.showCount === undefined ? count !== null && count !== undefined ? true : false : false;
      filterTitleAria = displayCount ? _.str.sformat(lang.filterTitleAria, this.options.model.get("name"), count) : _.str.sformat(lang.filterTitleAriaNoDisplayCount, this.options.model.get("name"));
      filterCheckboxAria = displayCount ? _.str.sformat(lang.filterCheckboxAria, this.options.model.get("name"), count) : _.str.sformat(lang.filterCheckboxAriaNoDisplayCount, this.options.model.get("name"));
      filterTitle = displayCount ? _.str.sformat(lang.filterTitle, this.options.model.get("name"), count) : this.options.model.get("name");
      let checkedAria = this.__isItemChecked(), checkboxTitle = displayCount ? _.str.sformat(lang.filterTitleAria, this.model.get("name"), count) : _.str.sformat(lang.filterTitleAriaNoDisplayCount, this.model.get("name")), checkboxAriaLabel = displayCount ? _.str.sformat(lang.filterCheckboxAria, this.model.get("name"), count) : _.str.sformat(lang.filterCheckboxAriaNoDisplayCount, this.model.get("name"));
      const qry = this.options.model.get("query") ?? "";
      if (qry.length) {
        displayName = prepareHitHighlightArray(name, qry);
      } else {
        displayName = [ name ];
      }
      let isChecked = this.__isItemChecked();
      return {
        isChecked: isChecked,
        facetNameEleClassName: isChecked ? "smart-selected-name" : "",
        showOnHover: showOnHover,
        count: count,
        enableCheckBox: this.options.enableCheckBoxes,
        displayCount: displayCount,
        filterTitleAria: filterTitleAria,
        filterCheckboxAria: filterCheckboxAria,
        filterTitle: filterTitle,
        checkedAria: checkedAria,
        checkboxTitle: checkboxTitle,
        checkboxAriaLabel: checkboxAriaLabel,
        name: name,
        displayName: displayName
      };
    },
    onRender: function() {
      this.triggerMethod("dom:refresh");
      if (this.showButtonsInEachFacet !== undefined && !this.showButtonsInEachFacet && this.model.get("checked")) {
        this.selectItem();
      }
    },
    __isItemChecked: function() {
      return this.options.facetCardView.__isItemChecked(this.model);
    },
    selectItem: function() {
      this.__setItemCheckedStatus(true);
      this.ui.checkboxele.attr("checked", true);
      this.ui.checkboxele.attr("ariachecked", true);
    },
    __setItemCheckedStatus: function(isChecked = false) {
      if (isChecked) {
        this.options.facetCardView.checkedItems.add(new Backbone.Model(this.model.attributes));
      } else {
        let tempItems = this.options.facetCardView.checkedItems.clone();
        let model = this.model;
        tempItems = tempItems.filter(function(item) {
          return item.get("value") !== model.get("value");
        });
        this.options.facetCardView.checkedItems.reset(tempItems);
      }
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
      if (this.__isItemChecked()) {
        this.__setItemCheckedStatus(false);
        if (!isShowButtonsInEachFacet) {
          this.ui.checkboxele.removeAttr("altstyle");
          !isMultiselect && this.triggerMethod("set:single:unselect", this);
          this.triggerMethod("multi:filter:unselect", this);
        } else {
          this.triggerMethod("multi:filter:select", this);
        }
      } else {
        if (isMultiselect) {
          this.__setItemCheckedStatus(true);
          this.triggerMethod("multi:filter:select", this);
          this.ui.checkboxele.removeAttr("altstyle");
        } else {
          if (!this.showButtonsInEachFacet) {
            this.removeSingleSelect(singleSelected);
            this.__setItemCheckedStatus(true);
            this.ui.checkboxele.addClass("single-select-facet");
            this.ui.checkboxele.attr("altstyle", "");
            checkbox.checked = true;
            this.triggerMethod("set:single:select", this);
            this.triggerMethod("single:filter:select", this);
            singleSelected = this;
          }
        }
      }
      this.isRendered && this.ui?.checkboxele?.attr("ariachecked", checkbox.checked);
      let facetName = checkbox?.closest(".csui-facet-item")?.querySelector(".csui-name");
      if (checkbox.checked) {
        facetName?.classList?.add("smart-selected-name");
      } else {
        facetName?.classList?.remove("smart-selected-name");
      }
    },
    removeSingleSelect: function(singelselected) {
      if (singelselected) {
        this.__setItemCheckedStatus(false);
        var singleSelectedCheckbox = singelselected.$el.find(".csui-checkbox");
        singleSelectedCheckbox.removeAttr("altstyle");
        let facetName = singleSelectedCheckbox[0]?.closest(".csui-facet-item")?.querySelector(".csui-name");
        facetName?.classList?.remove("smart-selected-name");
        singleSelectedCheckbox.attr("ariachecked", false);
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