/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "d2/dialogs/target.browse/impl/header/apply.properties.selector/apply.properties.selector.view", "d2/dialogs/target.browse/impl/header/start.location.selector/start.location.selector.view", "d2/dialogs/target.browse/impl/header/search.box/search.box.view", "d2/dialogs/target.browse/impl/header/table.settings/table.settings.view", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "hbs!d2/dialogs/target.browse/impl/header/header", "i18n!d2/dialogs/target.browse/impl/nls/lang", "nuc/lib/handlebars.helpers.xif", "css!d2/dialogs/target.browse/impl/header/header" ], function(_, $, Marionette, ApplyPropertiesSelectorView, StartLocationCollectionView, SearchBoxView, TableSettingsView, TabableRegionBehavior, headerTemplate, lang) {
  var HeaderView = Marionette.LayoutView.extend({
    template: headerTemplate,
    className: "cs-header-control",
    regions: {
      startLocations: ".csui-start-locations",
      globalSearch: ".d2-target-search-property-container",
      properties: ".apply-properties-selector",
      tableSettings: ".d2-target-table-mode"
    },
    ui: {
      saveFilter: ".csui-filtername",
      saveFilterError: ".csui-filtername-error",
      startlocations: ".csui-start-locations"
    },
    events: {
      "keyup @ui.saveFilter": "onChangeFilterName",
      "keydown @ui.startlocations": "onStartLoaction",
      "focusout @ui.saveFilter": "onFocusoutFilterName"
    },
    templateHelpers: function() {
      var options = this.options;
      return {
        title: options.title,
        locationSelector: options.locationSelector,
        propertiesSeletor: options.propertiesSeletor,
        saveFilter: options.saveFilter,
        placeHolderName: lang.placeHolderName,
        globalSearch: options.globalSearch,
        backButtonTooltip: lang.backButtonTooltip,
        enableTableModeChange: options.tableModeActionRequired
      };
    },
    behaviors: {
      TabableRegionBehavior: {
        behaviorClass: TabableRegionBehavior
      }
    },
    initialize: function() {
      var options = this.options;
      $(document).on("click." + this.cid, this, this._onClick);
      var defaultApplyPropertiesOption = ApplyPropertiesSelectorView.KEEP_ORIGINAL_PROPERTIES;
      if (options.propertiesSeletor) {
        this.propertiesView = new ApplyPropertiesSelectorView({
          selected: defaultApplyPropertiesOption,
          includeCombineProperties: this.options.includeCombineProperties
        });
      }
      if (options.locationSelector) {
        this.startLocationView = new StartLocationCollectionView({
          collection: this.options.locations,
          title: this.options.dialogTitle,
          selected: this.options.initialLocation
        });
      }
      if (options.globalSearch !== false) {
        var initialLocationID;
        if (this.options.initialLocation) {
          var initialLocationFactory = this.options.initialLocation.get("factory");
          initialLocationID = !!initialLocationFactory && !!initialLocationFactory.options.container ? initialLocationFactory.options.container.get("id") : null;
        }
        this.searchBoxView = new SearchBoxView({
          targetBrowseSearch: true,
          connector: options.connector,
          localScope: options.localScope,
          locationID: initialLocationID,
          locationSelector: options.locationSelector
        });
        this.searchboxModel = this.searchBoxView.searchboxModel;
        this.searchQueryModel = this.searchBoxView.model;
      }
      if (options.tableModeActionRequired) {
        this.tableSettingsView = new TableSettingsView({
          currentTableMode: options.currentTableMode
        });
      }
    },
    onRender: function() {
      if (this.startLocationView) {
        this.startLocations.show(this.startLocationView);
      }
      if (this.propertiesView) {
        this.properties.show(this.propertiesView);
      }
      if (this.searchBoxView) {
        this.globalSearch.show(this.searchBoxView);
        this.searchBoxView.on("close:dialog", this.onApplyProperties, this);
      }
      if (this.tableSettingsView) {
        this.tableSettings.show(this.tableSettingsView);
      }
      var self = this;
      this.$el.find("*[data-cstabindex]").on("focus", function() {
        var target = $(this);
        self.focusedElement && self.focusedElement.removeClass(TabableRegionBehavior.accessibilityActiveElementClass);
        target.addClass(TabableRegionBehavior.accessibilityActiveElementClass);
        self.focusedElement = target;
      });
    },
    currentlyFocusedElement: function(arg) {
      if (this.$el) {
        var focusables = this.$("*[tabindex]");
        if (focusables.length) {
          focusables.prop("tabindex", 0);
        }
        var shiftKey = !!arg && arg.shiftKey;
        if (!shiftKey && this.$el.find(".csui-filtername").length) {
          return this.$el.find(".csui-filtername");
        } else {
          return !!focusables[0] && $(focusables[0]).trigger("focus");
        }
      }
    },
    onLastTabElement: function(shiftTab, event) {
      return shiftTab && event.target === this.$("*[tabindex]")[0];
    },
    onStartLoaction: function(event) {
      if (event.keyCode === 27) {
        this.ui.startlocations.is(":focus") ? "" : event.stopImmediatePropagation();
      }
    },
    _onClick: function(event) {
      var that = event.data;
      if (that.$el.find(".d2-contentassist-search-menu").length) {
        that.trigger("hide:dropdown");
      }
    },
    onApplyProperties: function() {
      this.trigger("parent:destroydialog");
    },
    onDomRefresh: function() {
      if (this.startLocationView) {
        this.startLocationView.trigger("dom:refresh");
      }
      if (this.propertiesView) {
        this.propertiesView.trigger("dom:refresh");
      }
      if (this.searchBoxView) {
        this.searchBoxView.trigger("dom:refresh");
      }
    },
    hideStartLocationLabel: function(node) {
      this.startLocationView.hideDropDownLabel(node);
    },
    reset: function() {
      this.startLocationView.reset();
    },
    onChangeFilterName: function() {
      this.trigger("change:filterName");
    },
    onFocusoutFilterName: function() {
      this.trigger("focusout:filterName");
    },
    showErrorMessage: function(errorMessage) {
      this.$(this.ui.saveFilterError).html(errorMessage);
      this.ui.saveFilterError.removeClass("binf-hidden");
    },
    removeErrorMessage: function() {
      this.$(this.ui.saveFilterError).html("");
      this.ui.saveFilterError.addClass("binf-hidden");
    }
  });
  return HeaderView;
});