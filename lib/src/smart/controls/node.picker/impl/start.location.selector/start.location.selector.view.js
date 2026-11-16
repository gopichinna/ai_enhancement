/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "smart/behaviors/keyboard.navigation/smart.tabable.region.behavior", "hbs!smart/controls/node.picker/impl/start.location.selector/start.location.selector.item", "hbs!smart/controls/node.picker/impl/start.location.selector/start.location.selector", "i18n!smart/controls/node.picker/impl/nls/lang", "css!smart/controls/node.picker/impl/start.location.selector/start.location.selector", "smart/lib/binf/js/binf" ], function($, _, Backbone, Marionette, TabableRegion, itemTemplate, collectionTemplate, lang) {
  "use strict";
  var StartLocationItemView = Marionette.ItemView.extend({
    tagName: "otc-menucheckbox",
    className: "smart-location-menu-item",
    attributes: {
      altStyle: true,
      role: "menuitem"
    },
    template: itemTemplate,
    triggers: {
      click: "click:link"
    },
    events: {
      keydown: "onKeyInView"
    },
    constructor: function StartLocationItemView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.listenTo(this.model, "change", this.render);
      this.listenTo(this.model, "activate", this._activate);
    },
    onKeyInView: function(event) {
      let continueEvent = true, target = event.target;
      switch (event.keyCode) {
       case 13:
       case 32:
        if (target === this.el) {
          this.trigger("click:link");
          continueEvent = false;
        }
        break;

       case 27:
        event.preventDefault();
        continueEvent = false;
        break;
      }
      return continueEvent;
    },
    _activate: function() {
      this._parent.activeModel = this.model;
      this.el?.setAttribute("checked", true);
    }
  });
  var StartLocationCollectionView = Marionette.CompositeView.extend({
    className: "dropdown-locations",
    template: collectionTemplate,
    childView: StartLocationItemView,
    childViewContainer: "> otc-menu",
    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegion
      }
    },
    ui: {
      toggle: "> .toggler",
      selectedLabel: ">.toggler >.cs-label",
      selectedIcon: ">.toggler >.cs-icon:not(.smart-icon-caret-down)",
      selectedLocation: ">.toggler >span:not(.smart-icon-caret-down)"
    },
    events: {
      keyup: "onKeyInView"
    },
    constructor: function StartLocationCollectionView(options) {
      Marionette.CompositeView.prototype.constructor.apply(this, arguments);
      this.selected = new Backbone.Model();
      if (this.options.selected) {
        this._setSelection(this.options.selected.attributes);
      } else {
        this.resetSelection();
      }
      this.activeModel = this.selected;
      this.listenTo(this.collection, "change", this._refreshSelection);
      this.listenTo(this.selected, "change", this._updateSelection);
      this.listenTo(Backbone, "closeToggleAction", this._closeToggle);
    },
    filter: function(child, index, collection) {
      return !child.get("hide");
    },
    currentlyFocusedElement: function() {
      return this.$el.find("button");
    },
    accDeactivateTabableRegion: function() {
      this._closeToggle();
    },
    resetSelection: function() {
      this.selected.set({
        id: _.uniqueId(),
        name: lang.labelNoSelection,
        icon: ""
      });
    },
    serializeData: function() {
      var selectedData = _.pick(this.selected.toJSON(), [ "id", "name", "icon" ]);
      return _.defaults({
        id: _.uniqueId()
      }, selectedData);
    },
    templateHelpers: function() {
      return {
        location: lang.Location,
        labelSelectLocation: lang.labelSelectLocation
      };
    },
    onKeyInView: function(event) {
      if (event.keyCode === 27 && event.target.classList?.contains("smart-location-menu-item")) {
        this._closeToggle();
        this.ui?.toggle?.focus();
        event.preventDefault();
      }
    },
    onRender: function() {
      this.ui.toggle.binf_dropdown();
      this.options.selected && this.options.selected.trigger("activate");
    },
    onChildviewClickLink: function(childView) {
      this.ui.selectedLabel.removeClass("select-prompt");
      this._setSelection(childView.model.attributes);
      this.ui.toggle[0]?.click();
      this.ui.selectedLocation.removeClass("binf-hide");
      this.triggerMethod("change:location", childView.model);
      this.$el.trigger("setCurrentTabFocus");
    },
    hideDropDownLabel: function(node, options) {
      var locationFactory = this.selected?.get("factory"), locationContainer = locationFactory?.getLocationParameters(options)?.container, locationId = locationContainer && locationContainer.get("id"), nodeId = node && node.get("id");
      if (node && nodeId !== locationId) {
        this._setSelection({
          name: lang.labelSelectLocation,
          id: ""
        });
        this.ui.selectedLabel.addClass("select-prompt");
        this.ui.selectedIcon.addClass("binf-hide");
      } else if (nodeId === locationId && this.ui.selectedLabel[0].innerHTML !== locationContainer?.get("name") && this.activeModel && this.activeModel.get("name") !== lang.labelCurrentLocation) {
        this.selected.attributes.name = locationContainer?.get("name");
        this._updateSelection();
      }
    },
    _setSelection: function(attributes) {
      this.selected.set(attributes);
    },
    _updateSelection: function() {
      var selectedModel = this.collection.get(this.selected);
      selectedModel && selectedModel.trigger("activate");
    },
    _refreshSelection: function(model) {
      if (model.get("id") === this.selected.get("id")) {
        this._setSelection(model.attributes);
      }
    },
    _closeToggle: function() {
      let active = this.el.querySelector("otc-menu")["isOpen"];
      if (active) {
        this.el?.querySelector("otc-menu")?.removeAttribute("isopen");
      }
      this.ui.toggle && this.ui.toggle.attr && this.ui.toggle.attr("aria-expanded", "false");
    }
  });
  return StartLocationCollectionView;
});