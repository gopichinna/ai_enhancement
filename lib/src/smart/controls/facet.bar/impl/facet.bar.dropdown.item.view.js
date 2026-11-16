/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "smart/controls/facet.bar/impl/facet.bar.item.view", "hbs!smart/controls/facet.bar/impl/facet.bar.dropdown.item", "smart/controls/icon/icon.view", "i18n!smart/controls/facet.bar/impl/nls/lang", "css!smart/controls/facet.bar/impl/facet.bar" ], function(_, $, Backbone, Marionette, FacetBarItemView, template, IconView, lang) {
  "use strict";
  var FacetBarDropDownItemView = Marionette.CompositeView.extend({
    tagName: "li",
    template: template,
    childView: FacetBarItemView,
    childViewOptions: function() {
      return {
        moreItemsTemplate: true
      };
    },
    childViewContainer: ".csui-facet-bar-dropdown",
    className: "csui-facet-dropdown binf-dropdown csui-dropdown",
    ui: {
      dropDownMenu: ".binf-dropdown-toggle",
      dropDownList: ".csui-facet-bar-dropdown"
    },
    events: {
      "click @ui.dropDownMenu": "onDropdownClick",
      keydown: "onKeyInView"
    },
    templateHelpers: function() {
      return {
        collection: this.collection,
        moreButtonsAria: lang.moreButtonsAria,
        overflowMenuAria: lang.overflowMenuAria
      };
    },
    onRender: function() {
      this.iconView = new IconView({
        iconName: "csui_action_more32",
        states: true,
        size: "normal"
      });
      this.dropDownMenuRegion = new Marionette.Region({
        el: this.ui.dropDownMenu
      });
      this.iconView.render();
      this.dropDownMenuRegion.show(this.iconView);
    },
    constructor: function FacetBarDropDownItemView(options = {}) {
      this.options = options;
      Marionette.CollectionView.prototype.constructor.apply(this, arguments);
      const overflowMenuCollection = [];
      options.collection?.forEach(model => {
        let {
          attributes
        } = model;
        attributes.isFacetLabel = true;
        overflowMenuCollection.push(attributes);
        const topics = model?.get("topics") || model?.topics;
        topics?.forEach(topic => {
          topic.isTopic = true;
          topic.readOnlyFilter = attributes.readOnlyFilter;
          overflowMenuCollection.push(topic);
        });
      });
      this.collection = new Backbone.Collection(overflowMenuCollection);
      this.currentFocusIndex = 0;
    },
    onKeyInView: function(event) {
      const keyCode = event.keyCode, target = event.target;
      if (keyCode === 46) {
        return;
      } else if (keyCode === 9 || keyCode === 27) {
        if (this.ui?.dropDownList[0]?.contains(target)) {
          this.onDropdownClick(event);
        }
        return;
      } else if (keyCode === 37 || keyCode === 38 || keyCode === 39 || keyCode === 40) {
        if (target === this.ui?.dropDownMenu[0]) {
          return;
        }
      } else if (keyCode === 13 || keyCode === 32) {
        if (target === this.ui?.dropDownMenu[0]) {
          this.onDropdownClick(event);
        }
        return;
      }
      switch (keyCode) {
       case 40:
        this.currentFocusIndex++;
        this._focusListItem(event);
        break;

       case 38:
        this.currentFocusIndex--;
        this._focusListItem(event);
        break;

       case 35:
        this.currentFocusIndex = this._getListfocusableElements()?.length - 1;
        this._focusListItem(event);
        break;

       case 33:
        this.currentFocusIndex = 0;
        this._focusListItem(event);
        break;

       case 34:
        this.currentFocusIndex = this._getListfocusableElements()?.length - 1;
        this._focusListItem(event);
        break;

       default:
        if (this.ui?.dropDownList[0]?.contains(target)) {
          event.preventDefault();
          event.stopPropagation();
        }
      }
      return true;
    },
    _focusListItem: function(event) {
      const listFocusableElements = this._getListfocusableElements();
      if (listFocusableElements?.includes(event?.target)) {
        event.preventDefault();
        event.stopPropagation();
      }
      listFocusableElements.forEach((listItem, index) => {
        listItem.setAttribute("tabindex", -1);
        if (index === this.currentFocusIndex) {
          listItem.setAttribute("tabindex", 0);
          listItem.focus();
        }
      });
      if (this.currentFocusIndex < 0) {
        this.currentFocusIndex = 0;
      } else if (this.currentFocusIndex >= listFocusableElements.length) {
        this.currentFocusIndex = listFocusableElements.length - 1;
      }
    },
    onDropdownClick: function(event) {
      const containerEle = this.options.scrollableParentEle && $(this.options.scrollableParentEle);
      if (containerEle.is(":visible")) {
        var containerEleHeight = containerEle.height(), dropdownEle = this.$el.find("ul.binf-dropdown-menu"), offset = this.options.offset || 52, dropdownEleHeight = containerEleHeight - offset;
        dropdownEle.css("max-height", dropdownEleHeight + "px");
      }
      if (event.keyCode === 13 || event.keyCode === 32 || event.type === "click") {
        event.preventDefault();
        event.stopPropagation();
        this?.options?.parentView?.trigger("collapse:normal:facetbar:menu", {
          event: event,
          currentFocusedElement: $(document.activeElement)
        });
      }
      if (this.el.classList?.contains("binf-open")) {
        this._getListfocusableElements()[this.currentFocusIndex]?.setAttribute("tabindex", -1);
        this.currentFocusIndex = 0;
        this.el.classList?.remove("binf-open");
        this.ui.dropDownMenu.attr("aria-expanded", false);
        this.iconView.setIconStateIsOn(false);
        this.ui.dropDownMenu[0]?.setAttribute("tabindex", 0);
        this.ui.dropDownMenu[0]?.focus();
      } else {
        this.el.classList?.add("binf-open");
        this.ui.dropDownMenu.attr("aria-expanded", true);
        this.iconView.setIconStateIsOn(true);
        this.ui.dropDownMenu[0]?.setAttribute("tabindex", -1);
        this.currentFocusIndex = 0;
        this._focusListItem(event);
      }
    },
    _getListfocusableElements: function() {
      if (!this.el?.classList?.contains("binf-open")) {
        return [];
      }
      return Array.from(this.el?.querySelectorAll(".csui-facet-bar-dropdown *[tabindex]"));
    }
  });
  return FacetBarDropDownItemView;
});