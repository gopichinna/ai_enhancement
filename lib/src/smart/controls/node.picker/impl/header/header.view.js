/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "smart/utils/smart.base", "smart/controls/node.picker/impl/header/search.box/search.box.view", "smart/behaviors/keyboard.navigation/smart.tabable.region.behavior", "module", "hbs!smart/controls/node.picker/impl/header/header", "i18n!smart/controls/node.picker/impl/nls/lang", "nuc/lib/handlebars.helpers.xif", "css!smart/controls/node.picker/impl/header/header" ], function(_, $, Backbone, Marionette, smartBase, SearchBoxView, TabableRegionBehavior, module, headerTemplate, lang) {
  var config = _.defaults(module.config().csui || {}, module.config().smart || {}, {});
  var HeaderView = Marionette.LayoutView.extend({
    template: headerTemplate,
    className: "cs-header-control",
    regions: {
      startLocations: ".smart-start-locations ",
      globalSearch: ".csui-global-search",
      selectedCountRegion: ".csui-selected-count-parent"
    },
    ui: {
      saveFilter: ".csui-filtername",
      targetLocationNameContainer: ".target-location-name-container",
      targetLocationName: ".target-location-name",
      saveFilterError: ".csui-filtername-error-wrapper",
      saveFilterErrorText: ".csui-filtername-error",
      globeIcon: ".smart-multilingual-icon",
      selectCountParent: ".csui-selected-count-parent"
    },
    events: {
      "keyup @ui.saveFilter": "onChangeFilterName",
      "focusout @ui.saveFilter": "onFocusoutFilterName",
      "click @ui.globeIcon": "onClickGlobeIcon",
      "keydown @ui.globeIcon": "onKeyDownGlobeIcon"
    },
    templateHelpers: function() {
      const options = this.options;
      return {
        title: options.title,
        locationSelector: options.locationSelector,
        saveFilter: options.saveFilter,
        initialFilter: options.initialFilter,
        placeHolderName: lang.placeHolderName,
        globalSearch: options.globalSearch,
        backButtonTooltip: lang.backButtonTooltip,
        isMlDataEnabled: options.isMlDataEnabled,
        multilingualTooltip: lang.multilingualTooltip,
        targetLocationName: this.options?.initialContainer?.get("name") || "",
        showTargetLocationName: options?.showTargetLocationName
      };
    },
    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },
    initialize: function() {
      var options = this.options;
      this.metadataLanguages = config.metadataLanguages || smartBase.getMetadataLanguageInfo();
      if (options.globalSearch !== false) {
        var initialLocationID, initialLocationName;
        if (this.options.initialLocation) {
          var initialLocationFactory = this.options.initialLocation.get("factory");
          initialLocationID = !!initialLocationFactory && !!initialLocationFactory.options.container ? initialLocationFactory.options.container.get("id") : null;
          initialLocationName = !!initialLocationFactory && !!initialLocationFactory.options.container ? initialLocationFactory.options.container.get("name") : null;
        }
        this.searchBoxView = new SearchBoxView({
          targetBrowseSearch: true,
          command: this.options.command,
          disableSearchFromHere: this.options.disableSearchFromHere,
          locationID: initialLocationID,
          locationName: initialLocationName,
          ...options
        });
        this.searchboxModel = this.searchBoxView.searchboxModel;
        this.searchQueryModel = this.searchBoxView.model;
      }
      var self = this;
      this.listenTo(this, "ml:value:updated", function(obj) {
        self.model.set("name_multilingual", obj.value_multilingual, {
          silent: true
        });
        self.targetElement.val(obj.value);
        self.saveMldata = obj;
        self.trigger("change:filterName");
      });
      this.listenTo(this.options?.selectedCountCollection, "change reset remove add", function() {
        !this.isDestroyed && this.toggleSelectCountView();
      });
      this.listenTo(this, "update:target:location:name", function(locationName) {
        !this.isDestroyed && this.toggleSelectCountView(locationName);
      });
    },
    onRender: function() {
      var options = this.options;
      if (this.searchBoxView) {
        this.globalSearch.show(this.searchBoxView);
        this.searchBoxView.on("show:startLocation", this.showStartLocations, this);
        this.searchBoxView.on("hide:startLocation", this.hideStartLocations, this);
        this.searchBoxView.on("close:dialog", this.onApplyProperties, this);
      }
      var showSelectedCount = this.options.showSelectedCount ?? true;
      this.options?.multiSelect && showSelectedCount && this.selectedCountRegion?.show(this.options.selectedCountView);
      this.toggleSelectCountView(this.options?.initialContainer?.get("name") || "");
      if (this.metadataLanguages.enabled) {
        let inputElement = this.ui.saveFilter;
        inputElement.addClass("csui-multilingual-input");
        if (options.multiLingualPopoverMixin?.mixin) {
          options.multiLingualPopoverMixin.mixin(HeaderView.prototype);
          this.model = new Backbone.Model();
          const mlOptions = {
            parentView: this,
            targetElement: inputElement,
            mlGlobeIcon: this.ui.globeIcon,
            validationRequired: false,
            multilingualData: this.model.get("name_multilingual")
          };
          this._loadMultiLingualPopover(mlOptions);
        }
      }
      let self = this;
      this.$el.find("*[data-cstabindex]").on("focus", function() {
        var target = $(this);
        self.focusedElement && self.focusedElement.removeClass(TabableRegionBehavior.accessibilityActiveElementClass);
        target.addClass(TabableRegionBehavior.accessibilityActiveElementClass);
        self.focusedElement = target;
      });
    },
    toggleSelectCountView: function(locationName) {
      if (this.options?.multiSelect) {
        this.ui?.targetLocationNameContainer[0]?.classList?.add("binf-hidden");
        this.ui?.selectCountParent[0]?.classList?.remove("binf-hidden");
        return;
      }
      this.ui?.selectCountParent[0]?.classList?.add("binf-hidden");
      if (locationName && this.ui.targetLocationName[0] && !this.options?.saveFilter) {
        this.ui.targetLocationName[0].textContent = locationName;
        this.ui?.targetLocationNameContainer[0]?.classList?.remove("binf-hidden");
      } else {
        this.ui?.targetLocationNameContainer[0]?.classList?.add("binf-hidden");
      }
    },
    currentlyFocusedElement: function(arg) {
      if (this.$el) {
        var focusables = this.$("*[tabindex]");
        if (focusables.length) {
          focusables.prop("tabindex", 0);
        }
        var shiftKey = !!arg && arg.shiftKey;
        if (shiftKey && focusables.length) {
          return focusables[focusables.length - 1];
        } else if (!shiftKey && focusables.length) {
          return focusables[0];
        }
      }
    },
    onLastTabElement: function(shiftTab, event) {
      return shiftTab && event.target === this.$("*[tabindex]")[0];
    },
    onApplyProperties: function() {
      this.trigger("parent:destroydialog");
    },
    onClickGlobeIcon: function() {
      this._showLanguagePopover();
    },
    onKeyDownGlobeIcon: function(event) {
      if (event.keyCode === 13 || event.keyCode === 32) {
        this.multiLingualForm && this.keyDownOnGlobeIcon(event);
      }
    },
    onDomRefresh: function() {
      if (this.searchBoxView) {
        this.searchBoxView.trigger("dom:refresh");
      }
      if (this.options?.selectedCountView) {
        this.options?.selectedCountView?.trigger("dom:refresh");
      }
    },
    onChangeFilterName: function() {
      this.trigger("change:filterName");
    },
    onFocusoutFilterName: function() {
      this.trigger("focusout:filterName");
    },
    showErrorMessage: function(errorMessage) {
      this.$(this.ui.saveFilterErrorText).html(errorMessage);
      this.ui.saveFilter.attr("aria-invalid", true);
      this.ui.saveFilterError.removeClass("binf-hidden");
    },
    removeErrorMessage: function() {
      this.$(this.ui.saveFilterErrorText).html("");
      this.ui.saveFilter.attr("aria-invalid", false);
      this.ui.saveFilterError.addClass("binf-hidden");
    }
  });
  return HeaderView;
});