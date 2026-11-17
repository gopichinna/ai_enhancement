/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/backbone", "csui/lib/marionette", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "hbs!csui/dialogs/members.picker/impl/start.location.selector/start.location.selector.item", "hbs!csui/dialogs/members.picker/impl/start.location.selector/start.location.selector", "csui/themes/csui.jato.action.icons", "i18n!csui/dialogs/members.picker/impl/nls/lang", "css!csui/dialogs/members.picker/impl/start.location.selector/start.location.selector", "csui/lib/binf/js/binf" ], function(_, Backbone, Marionette, TabableRegion, itemTemplate, collectionTemplate, JatoIcons, lang) {
  "use strict";
  var StartLocationItemView = Marionette.ItemView.extend({
    tagName: "otc-selectextensibleitem",
    attributes: {
      role: "presentation"
    },
    template: itemTemplate,
    templateHelpers: function() {
      return {
        icon: getIconClass(this.model),
        name: this.model.get("name")
      };
    },
    attributes: function() {
      return {
        value: this.model.get("name")
      };
    },
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
      this.listenTo(this.model, "deactivate", this._deactivate);
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
      this.el?.setAttribute("selected", true);
    },
    _deactivate: function() {
      if (this.el.hasAttribute("selected")) {
        this.el.removeAttr("selected");
      }
    }
  });
  var StartLocationCollectionView = Marionette.CompositeView.extend({
    className: "dropdown-locations",
    template: collectionTemplate,
    childView: StartLocationItemView,
    childViewContainer: "> otc-select",
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
    reset: function() {
      this.resetSelection();
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
        search: lang.labelSearch,
        icon: getIconClass(this.selected),
        labelSelectLocation: lang.labelSelectLocation
      };
    },
    onKeyInView: function(event) {
      var open = this.$el.hasClass("binf-open");
      if (event.keyCode === 27 && open) {
        this.$el.removeClass("binf-open");
        this.$('*[tabindex = "0"]').trigger("focus");
        return false;
      }
    },
    onRender: function() {
      this.options.selected && this.options.selected.trigger("activate");
    },
    onChildviewClickLink: function(childView) {
      this.ui.toggle.removeAttr("menuopen");
      this._setSelection(childView.model.attributes);
      this.triggerMethod("change:location", childView.model);
      this.$el.trigger("setCurrentTabFocus");
    },
    hideDropDownLabel: function(node) {
      var locationFactory = this.selected.get("factory"), locationContainer = locationFactory.getLocationParameters().container, locationId = locationContainer && locationContainer.get("id"), nodeId = node && node.get("id");
      if (node && nodeId !== locationId) {
        this._setSelection({
          name: lang.labelSelectLocation,
          id: ""
        });
        this.ui.selectedLabel.addClass("select-prompt");
        this.ui.selectedIcon.addClass("binf-hide");
      } else if (nodeId === locationId && this.ui.selectedLabel[0].innerHTML !== locationContainer.get("name") && this.activeModel && this.activeModel.get("name") !== lang.labelCurrentLocation) {
        this.selected.attributes.name = locationContainer.get("name");
        this._updateSelection();
      }
    },
    _setSelection: function(attributes) {
      this.selected.set(attributes);
    },
    _updateSelection: function() {
      this.ui.selectedLabel.text(this.selected.get("name"));
      this.ui.selectedIcon.attr("class", getIconClass(this.selected));
      this.collection.get(this.activeModel).trigger("deactivate");
      var selectedModel = this.collection.get(this.selected);
      selectedModel && selectedModel.trigger("activate");
    },
    _refreshSelection: function(model) {
      if (model.get("id") === this.selected.get("id")) {
        this._setSelection(model.attributes);
      }
    },
    _closeToggle: function() {
      var locationSelector = this.$el;
      if (locationSelector.hasClass && locationSelector.hasClass("binf-open")) {
        this.ui.toggle.binf_dropdown("toggle");
      }
      this.ui.toggle && this.ui.toggle.attr && this.ui.toggle.attr("aria-expanded", "false");
    }
  });
  function getIconClass(model) {
    var icon = model.get("icon") || "";
    if (icon && icon.indexOf("-") < 0) {
      if (icon === "member") {
        return JatoIcons.actionUserGroup;
      }
      if (icon === "location") {
        return JatoIcons.actionNodeLocation;
      }
    }
  }
  return StartLocationCollectionView;
});